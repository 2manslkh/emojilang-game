-- Drop functions first
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_game_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS make_choice_and_record_history(UUID, UUID, TEXT, BOOLEAN) CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS round_history CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_players_in_game;
DROP INDEX IF EXISTS idx_game_sessions_status;

-- Create the players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    emoji TEXT NOT NULL,
    in_game BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the game_sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID NOT NULL REFERENCES players(id),
    player2_id UUID REFERENCES players(id),
    player1_choice TEXT CHECK (player1_choice IN ('cooperate', 'betray', NULL)),
    player2_choice TEXT CHECK (player2_choice IN ('cooperate', 'betray', NULL)),
    status TEXT NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the round_history table
CREATE TABLE round_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    choice TEXT NOT NULL CHECK (choice IN ('cooperate', 'betray')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_players_in_game ON players(in_game);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_round_history_player_id ON round_history(player_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE round_history;

-- Grant necessary permissions for realtime
GRANT SELECT ON players TO authenticated, anon;
GRANT SELECT ON game_sessions TO authenticated, anon;
GRANT SELECT ON round_history TO authenticated, anon;

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

    RETURN NEXT v_updated_game;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION make_choice_and_record_history(UUID, UUID, TEXT, BOOLEAN) TO authenticated, anon;
