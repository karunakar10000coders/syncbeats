-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('google', 'email', 'guest')),
    auth_provider_id VARCHAR(255),
    password_hash VARCHAR(255),
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    host_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    settings JSONB DEFAULT '{
        "max_members": 10,
        "democratic_queue": false,
        "allow_guest_queue": true,
        "require_song_match": true
    }'::jsonb,
    max_members INT DEFAULT 10,
    current_song_id UUID,
    playback_state JSONB DEFAULT '{
        "is_playing": false,
        "position_ms": 0,
        "speed": 1.0,
        "updated_at": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('host', 'co-host', 'member', 'guest')),
    is_online BOOLEAN DEFAULT TRUE,
    device_type VARCHAR(20) CHECK (device_type IN ('android', 'ios', 'web', 'desktop')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500),
    artist VARCHAR(500),
    album VARCHAR(500),
    duration_ms INT,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64),
    format VARCHAR(10) CHECK (format IN ('mp3', 'wav', 'm4a', 'aac', 'flac')),
    file_size BIGINT,
    fingerprint TEXT,
    artwork_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, file_hash)
);

-- Song matches table
CREATE TABLE IF NOT EXISTS song_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_a_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    song_b_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('hash', 'fingerprint', 'metadata', 'fuzzy', 'filename')),
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(song_a_id, song_b_id)
);

-- Queue items table
CREATE TABLE IF NOT EXISTS queue_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id),
    added_by UUID NOT NULL REFERENCES users(id),
    position INT NOT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'played', 'skipped')),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'emoji', 'song_share', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    emoji VARCHAR(10) NOT NULL CHECK (emoji IN ('❤️', '🔥', '😂', '😭', '👍')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_user ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_hash ON songs(file_hash);
CREATE INDEX IF NOT EXISTS idx_songs_title_artist ON songs(title, artist);
CREATE INDEX IF NOT EXISTS idx_queue_room_position ON queue_items(room_id, position);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_reactions_room ON reactions(room_id, sent_at);
