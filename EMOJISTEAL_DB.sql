-- Drop functions first
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_game_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS make_choice(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS find_match(UUID) CASCADE;
DROP FUNCTION IF EXISTS count_online_players() CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS match_participants CASCADE;
DROP TABLE IF EXISTS player_history CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS matchmaking_queue CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_players_in_game;
DROP INDEX IF EXISTS idx_game_sessions_status;

-- Create the players table first
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    in_game BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points INTEGER DEFAULT 0
);

-- Create the game_sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID REFERENCES players(id),
    player2_id UUID REFERENCES players(id),
    player1_choice TEXT CHECK (player1_choice IN ('cooperate', 'betray', NULL)),
    player2_choice TEXT CHECK (player2_choice IN ('cooperate', 'betray', NULL)),
    status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    winner UUID REFERENCES players(id)
);

-- Add current_game_id to players table
ALTER TABLE players ADD COLUMN current_game_id UUID REFERENCES game_sessions(id);

-- Create the matchmaking_queue table
CREATE TABLE matchmaking_queue (
  player_id UUID REFERENCES players(id),
  queued_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (player_id)
);

-- Create the player_history table
CREATE TABLE player_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    game_id UUID NOT NULL REFERENCES game_sessions(id),
    choice TEXT NOT NULL CHECK (choice IN ('cooperate', 'betray', 'no_choice')),
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
CREATE INDEX IF NOT EXISTS idx_player_history_player_id ON player_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_history_game_id ON player_history(game_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE match_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE player_history;

-- Grant necessary permissions for realtime
GRANT SELECT ON players TO authenticated, anon;
GRANT SELECT ON game_sessions TO authenticated, anon;
GRANT SELECT ON match_participants TO authenticated, anon;
GRANT SELECT ON player_history TO authenticated, anon;

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

-- Remove the result column from game_sessions if it exists
ALTER TABLE game_sessions DROP COLUMN IF EXISTS result;

-- Update the settle_game_result function
CREATE OR REPLACE FUNCTION settle_game_result(p_game_id UUID)
RETURNS VOID AS $$
DECLARE
    v_game game_sessions;
    v_player1_points INTEGER;
    v_player2_points INTEGER;
    v_winner UUID;
BEGIN
    -- Fetch the game session
    SELECT * INTO v_game FROM game_sessions WHERE id = p_game_id;

    -- Calculate the points and determine the winner
    IF v_game.player1_choice = 'no_choice' AND v_game.player2_choice = 'no_choice' THEN
        v_player1_points := 0;
        v_player2_points := 0;
        v_winner := NULL; -- Both didn't choose
    ELSIF v_game.player1_choice = 'no_choice' THEN
        v_player1_points := 0;
        v_player2_points := 1;
        v_winner := v_game.player2_id;
    ELSIF v_game.player2_choice = 'no_choice' THEN
        v_player1_points := 1;
        v_player2_points := 0;
        v_winner := v_game.player1_id;
    ELSIF v_game.player1_choice = 'cooperate' AND v_game.player2_choice = 'cooperate' THEN
        v_player1_points := 2;
        v_player2_points := 2;
        v_winner := NULL; -- It's a tie
    ELSIF v_game.player1_choice = 'betray' AND v_game.player2_choice = 'cooperate' THEN
        v_player1_points := 3;
        v_player2_points := 0;
        v_winner := v_game.player1_id;
    ELSIF v_game.player1_choice = 'cooperate' AND v_game.player2_choice = 'betray' THEN
        v_player1_points := 0;
        v_player2_points := 3;
        v_winner := v_game.player2_id;
    ELSIF v_game.player1_choice = 'betray' AND v_game.player2_choice = 'betray' THEN
        v_player1_points := -1;
        v_player2_points := -1;
        v_winner := NULL; -- It's a tie
    ELSE
        v_player1_points := 0;
        v_player2_points := 0;
        v_winner := NULL;
    END IF;

    -- Update the game session status and winner
    UPDATE game_sessions
    SET status = 'finished', winner = v_winner
    WHERE id = p_game_id;

    -- Update player points
    UPDATE players
    SET points = points + v_player1_points
    WHERE id = v_game.player1_id;

    UPDATE players
    SET points = points + v_player2_points
    WHERE id = v_game.player2_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION settle_game_result(UUID) TO authenticated, anon;

-- Update the make_choice function to handle null choices and fix ambiguous column references
CREATE OR REPLACE FUNCTION make_choice(
    p_game_id UUID,
    p_player_id UUID,
    p_choice TEXT
)
RETURNS TABLE (
    game_status TEXT,
    player1_id UUID,
    player2_id UUID,
    player1_points INTEGER,
    player2_points INTEGER,
    winner UUID
) AS $$
DECLARE
    v_updated_game game_sessions;
    v_other_player_id UUID;
    v_current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the current time
    v_current_time := NOW();

    -- Update the game session
    UPDATE game_sessions
    SET 
        player1_choice = CASE WHEN game_sessions.player1_id = p_player_id THEN p_choice ELSE player1_choice END,
        player2_choice = CASE WHEN game_sessions.player2_id = p_player_id THEN p_choice ELSE player2_choice END
    WHERE game_sessions.id = p_game_id
    RETURNING * INTO v_updated_game;

    -- Determine the other player's ID
    IF v_updated_game.player1_id = p_player_id THEN
        v_other_player_id := v_updated_game.player2_id;
    ELSE
        v_other_player_id := v_updated_game.player1_id;
    END IF;

    -- Check if both players have made their choices or if time has run out for the other player
    IF (v_updated_game.player1_choice IS NOT NULL AND v_updated_game.player2_choice IS NOT NULL) OR
       (v_current_time - v_updated_game.created_at > INTERVAL '15 seconds') THEN
        -- If the other player hasn't made a choice, set it to 'no_choice'
        UPDATE game_sessions
        SET 
            player1_choice = COALESCE(player1_choice, 'no_choice'),
            player2_choice = COALESCE(player2_choice, 'no_choice')
        WHERE id = p_game_id
        RETURNING * INTO v_updated_game;

        -- Insert choices into player_history for both players
        INSERT INTO player_history (player_id, game_id, choice)
        VALUES 
            (v_updated_game.player1_id, p_game_id, v_updated_game.player1_choice),
            (v_updated_game.player2_id, p_game_id, v_updated_game.player2_choice);

        -- Settle the game result
        PERFORM settle_game_result(p_game_id);

        -- Return the game result
        RETURN QUERY
        SELECT 
            gs.status,
            gs.player1_id,
            gs.player2_id,
            p1.points,
            p2.points,
            gs.winner
        FROM 
            game_sessions gs
            JOIN players p1 ON gs.player1_id = p1.id
            JOIN players p2 ON gs.player2_id = p2.id
        WHERE 
            gs.id = p_game_id;
    ELSE
        -- If the game is not finished, return null values for points and winner
        RETURN QUERY
        SELECT 
            v_updated_game.status,
            v_updated_game.player1_id,
            v_updated_game.player2_id,
            NULL::INTEGER,
            NULL::INTEGER,
            NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION make_choice(UUID, UUID, TEXT) TO authenticated, anon;

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

-- Update the process_matchmaking function
CREATE OR REPLACE FUNCTION process_matchmaking()
RETURNS VOID AS $$
DECLARE
  player1 UUID;
  player2 UUID;
  new_game_id UUID;
BEGIN
  -- Get two players from the queue
  SELECT player_id INTO player1 FROM matchmaking_queue ORDER BY queued_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF player1 IS NOT NULL THEN
    SELECT player_id INTO player2 FROM matchmaking_queue WHERE player_id != player1 ORDER BY queued_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  END IF;

  IF player1 IS NOT NULL AND player2 IS NOT NULL THEN
    -- Create a new game session
    INSERT INTO game_sessions (player1_id, player2_id, status)
    VALUES (player1, player2, 'playing')
    RETURNING id INTO new_game_id;

    -- Update players' current_game_id
    UPDATE players
    SET current_game_id = new_game_id, in_game = true
    WHERE id IN (player1, player2);

    -- Remove players from the queue
    DELETE FROM matchmaking_queue WHERE player_id IN (player1, player2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION process_matchmaking() TO authenticated, anon;

-- Remove the find_or_create_game function as it's no longer needed
DROP FUNCTION IF EXISTS find_or_create_game(UUID);

-- Remove the update_players_current_game function as it's no longer needed
DROP FUNCTION IF EXISTS update_players_current_game(UUID, UUID, UUID);

-- Update the join_matchmaking_queue function to include process_matchmaking
CREATE OR REPLACE FUNCTION join_matchmaking_queue(p_player_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if the player is already in the queue
    IF NOT EXISTS (
        SELECT 1 FROM matchmaking_queue WHERE player_id = p_player_id
    ) THEN
        -- Add player to matchmaking queue
        INSERT INTO matchmaking_queue (player_id)
        VALUES (p_player_id);
    END IF;

    -- Run process_matchmaking
    PERFORM process_matchmaking();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION join_matchmaking_queue(UUID) TO authenticated, anon;

-- Modify the players table
ALTER TABLE players DROP COLUMN IF EXISTS emoji;

-- Add this function to count players in the matchmaking queue
CREATE OR REPLACE FUNCTION count_players_in_queue()
RETURNS INTEGER AS $$
DECLARE
    queue_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO queue_count
    FROM matchmaking_queue;
    
    RETURN queue_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION count_players_in_queue() TO authenticated, anon;