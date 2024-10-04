-- Drop functions first
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_game_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS make_choice_and_record_history(UUID, UUID, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS find_match(UUID) CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS round_history CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS matchmaking_queue CASCADE;
DROP TABLE IF EXISTS match_participants CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_players_in_game;
DROP INDEX IF EXISTS idx_game_sessions_status;

-- Create the game_sessions table first
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID,
    player2_id UUID,
    player1_choice TEXT CHECK (player1_choice IN ('cooperate', 'betray', NULL)),
    player2_choice TEXT CHECK (player2_choice IN ('cooperate', 'betray', NULL)),
    status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    in_game BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_game_id UUID REFERENCES game_sessions(id)
);

-- Add foreign key constraints to game_sessions
ALTER TABLE game_sessions
ADD CONSTRAINT fk_player1 FOREIGN KEY (player1_id) REFERENCES players(id),
ADD CONSTRAINT fk_player2 FOREIGN KEY (player2_id) REFERENCES players(id);

-- Create the matchmaking_queue table
CREATE TABLE matchmaking_queue (
  player_id UUID REFERENCES players(id),
  queued_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

-- Create the round_history table
CREATE TABLE round_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    choice TEXT NOT NULL CHECK (choice IN ('cooperate', 'betray')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the match_participants table
CREATE TABLE match_participants (
    match_id UUID REFERENCES game_sessions(id),
    player_id UUID REFERENCES players(id),
    PRIMARY KEY (match_id, player_id)
);



-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column in game_sessions
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_current_game ON players(current_game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_round_history_player_id ON round_history(player_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE round_history;
ALTER PUBLICATION supabase_realtime ADD TABLE match_participants;

-- Grant necessary permissions for realtime
GRANT SELECT ON players TO authenticated, anon;
GRANT SELECT ON game_sessions TO authenticated, anon;
GRANT SELECT ON round_history TO authenticated, anon;
GRANT SELECT ON match_participants TO authenticated, anon;

-- Create a function to update game session status
CREATE OR REPLACE FUNCTION update_game_session(game_session_id UUID, new_player2_id UUID)
RETURNS SETOF game_sessions AS $$
BEGIN
    RETURN QUERY
    UPDATE game_sessions
    SET status = 'playing', player2_id = new_player2_id
    WHERE id = game_session_id
      AND player2_id IS NULL
      AND status = 'waiting'
    RETURNING *;
END;
$$ LANGUAGE 'plpgsql';

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_game_session(UUID, UUID) TO authenticated, anon;

-- Create a function to make a choice and record history
CREATE OR REPLACE FUNCTION make_choice_and_record_history(
    p_game_id UUID,
    p_player_id UUID,
    p_choice TEXT,
    p_is_player1 BOOLEAN
)
RETURNS SETOF game_sessions AS $$
DECLARE
    v_updated_game game_sessions;
BEGIN
    -- Update the game session
    UPDATE game_sessions
    SET 
        player1_choice = CASE WHEN p_is_player1 THEN p_choice ELSE player1_choice END,
        player2_choice = CASE WHEN NOT p_is_player1 THEN p_choice ELSE player2_choice END
    WHERE id = p_game_id
    RETURNING * INTO v_updated_game;

    -- Insert into round_history
    INSERT INTO round_history (player_id, choice)
    VALUES (p_player_id, p_choice);

    -- Check if both players have made their choices
    IF v_updated_game.player1_choice IS NOT NULL AND v_updated_game.player2_choice IS NOT NULL THEN
        -- Both players have made their choices, set the status to 'finished'
        UPDATE game_sessions
        SET status = 'finished'
        WHERE id = p_game_id
        RETURNING * INTO v_updated_game;
    END IF;

    RETURN NEXT v_updated_game;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION make_choice_and_record_history(UUID, UUID, TEXT, BOOLEAN) TO authenticated, anon;

-- Create a function to end the round and kick inactive players
CREATE OR REPLACE FUNCTION end_round_and_kick_inactive_player(p_game_id UUID)
RETURNS TABLE (LIKE game_sessions) AS $$
DECLARE
    v_game game_sessions;
    v_inactive_player_id UUID;
BEGIN
    -- Fetch the current game state
    SELECT * INTO v_game FROM game_sessions WHERE id = p_game_id;

    -- Determine if there's an inactive player
    IF v_game.player1_choice IS NULL AND v_game.player2_choice IS NOT NULL THEN
        v_inactive_player_id := v_game.player1_id;
    ELSIF v_game.player2_choice IS NULL AND v_game.player1_choice IS NOT NULL THEN
        v_inactive_player_id := v_game.player2_id;
    END IF;

    -- If there's an inactive player, remove them from the game
    IF v_inactive_player_id IS NOT NULL THEN
        -- Update the game session
        UPDATE game_sessions
        SET 
            player1_id = CASE WHEN player1_id = v_inactive_player_id THEN player2_id ELSE player1_id END,
            player2_id = CASE WHEN player1_id = v_inactive_player_id THEN NULL ELSE player2_id END,
            player1_choice = CASE WHEN player1_id = v_inactive_player_id THEN player2_choice ELSE player1_choice END,
            player2_choice = CASE WHEN player1_id = v_inactive_player_id THEN NULL ELSE player2_choice END,
            status = CASE WHEN player2_id = v_inactive_player_id THEN 'waiting' ELSE 'finished' END
        WHERE id = p_game_id;

        -- Update the player's status
        UPDATE players SET in_game = false WHERE id = v_inactive_player_id;
    ELSE
        -- If both players made a choice or both were inactive, just end the round
        UPDATE game_sessions
        SET status = 'finished'
        WHERE id = p_game_id;
    END IF;

    -- Return the updated game session
    RETURN QUERY SELECT * FROM game_sessions WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION end_round_and_kick_inactive_player(UUID) TO authenticated, anon;

-- Create a function to find or create a game
CREATE OR REPLACE FUNCTION find_or_create_game(p_player_id UUID)
RETURNS TABLE (LIKE game_sessions) AS $$
DECLARE
    v_game game_sessions;
    v_other_player_id UUID;
BEGIN
    -- Try to find an existing game waiting for a player
    SELECT * INTO v_game
    FROM game_sessions
    WHERE status = 'waiting'
      AND player2_id IS NULL
      AND player1_id != p_player_id
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- Join existing game
        UPDATE game_sessions
        SET player2_id = p_player_id,
            status = 'playing'
        WHERE id = v_game.id
        RETURNING * INTO v_game;
    ELSE
        -- Check if there's another player waiting to create a game
        SELECT id INTO v_other_player_id
        FROM players
        WHERE in_game = true
          AND id != p_player_id
          AND id NOT IN (SELECT player1_id FROM game_sessions WHERE status IN ('waiting', 'playing'))
          AND id NOT IN (SELECT player2_id FROM game_sessions WHERE status IN ('waiting', 'playing') AND player2_id IS NOT NULL)
        ORDER BY RANDOM()
        LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
            -- Create new game with both players
            INSERT INTO game_sessions (player1_id, player2_id, status)
            VALUES (p_player_id, v_other_player_id, 'playing')
            RETURNING * INTO v_game;
        ELSE
            -- Create new game with only the current player
            INSERT INTO game_sessions (player1_id, status)
            VALUES (p_player_id, 'waiting')
            RETURNING * INTO v_game;
        END IF;
    END IF;

    RETURN QUERY SELECT * FROM game_sessions WHERE id = v_game.id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION find_or_create_game(UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION process_matchmaking()
RETURNS VOID AS $$
DECLARE
  player1 UUID;
  player2 UUID;
  new_game_id UUID;
BEGIN
  -- Get two players from the queue
  SELECT player_id INTO player1 FROM matchmaking_queue ORDER BY queued_at LIMIT 1;
  SELECT player_id INTO player2 FROM matchmaking_queue WHERE player_id != player1 ORDER BY queued_at LIMIT 1;

  IF player1 IS NOT NULL AND player2 IS NOT NULL THEN
    -- Create a new game session
    INSERT INTO game_sessions (player1_id, player2_id, status)
    VALUES (player1, player2, 'playing')
    RETURNING id INTO new_game_id;

    -- Remove players from the queue
    DELETE FROM matchmaking_queue WHERE player_id IN (player1, player2);
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION process_matchmaking() TO postgres;
GRANT USAGE ON SCHEMA cron TO postgres;

SELECT cron.schedule('process_matchmaking_job', '*/10 * * * *', 'SELECT process_matchmaking()');

-- Update the find_match function
CREATE OR REPLACE FUNCTION find_match(in_player_id UUID)
RETURNS TABLE (id UUID, name TEXT, in_game BOOLEAN, created_at TIMESTAMPTZ, current_game_id UUID) AS $$
DECLARE
    v_opponent_id UUID;
    v_game_id UUID;
BEGIN
    -- Find an opponent in the queue
    SELECT player_id INTO v_opponent_id
    FROM matchmaking_queue
    WHERE player_id != in_player_id
    ORDER BY queued_at
    LIMIT 1;

    IF v_opponent_id IS NOT NULL THEN
        -- Create a new game session
        INSERT INTO game_sessions (player1_id, player2_id, status)
        VALUES (in_player_id, v_opponent_id, 'playing')
        RETURNING game_sessions.id INTO v_game_id;

        -- Remove both players from the queue
        DELETE FROM matchmaking_queue
        WHERE player_id IN (in_player_id, v_opponent_id);

        -- Update both players' current_game_id
        UPDATE players
        SET current_game_id = v_game_id, in_game = true
        WHERE players.id IN (in_player_id, v_opponent_id);

        -- Return the opponent's data
        RETURN QUERY
        SELECT players.id, players.name, players.in_game, players.created_at, players.current_game_id
        FROM players
        WHERE players.id = v_opponent_id;
    ELSE
        -- No opponent found, return the current player's data
        RETURN QUERY
        SELECT players.id, players.name, players.in_game, players.created_at, players.current_game_id
        FROM players
        WHERE players.id = in_player_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION find_match(UUID) TO authenticated, anon;

-- Create a new function to update players' current_game_id
CREATE OR REPLACE FUNCTION update_players_current_game(p_game_id UUID, p_player1_id UUID, p_player2_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE players
    SET current_game_id = p_game_id
    WHERE id IN (p_player1_id, p_player2_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_players_current_game(UUID, UUID, UUID) TO authenticated, anon;

-- Modify the players table
ALTER TABLE players DROP COLUMN IF EXISTS emoji;