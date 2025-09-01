-- Creating database schema for hackathon voting system

-- Teams table to store team information from Excel upload
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  team_number INTEGER NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  leader_name VARCHAR(255) NOT NULL,
  member2_name VARCHAR(255),
  member3_name VARCHAR(255),
  member4_name VARCHAR(255),
  total_members INTEGER NOT NULL,
  team_group VARCHAR(1) NOT NULL CHECK (team_group IN ('A', 'B', 'C')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_number)
);

-- Voters table to track who has voted
CREATE TABLE IF NOT EXISTS voters (
  id SERIAL PRIMARY KEY,
  ldap_nickname VARCHAR(255) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  voter_group VARCHAR(1) NOT NULL CHECK (voter_group IN ('A', 'B', 'C')),
  has_voted_idea BOOLEAN DEFAULT FALSE,
  has_voted_implementation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ldap_nickname)
);

-- Votes table to store individual votes
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER REFERENCES voters(id),
  team_id INTEGER REFERENCES teams(id),
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('idea', 'implementation')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(voter_id, vote_type) -- Each voter can only vote once per category
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_group ON teams(team_group);
CREATE INDEX IF NOT EXISTS idx_voters_group ON voters(voter_group);
CREATE INDEX IF NOT EXISTS idx_votes_team ON votes(team_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);
