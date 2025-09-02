import fs from "fs"
import path from "path"

export interface TeamMember {
  ldap_nickname: string
  auth_code: string
}

export interface Team {
  id: number
  team_number: number
  team_name: string
  leader_name: string
  member2_name?: string
  member3_name?: string
  member4_name?: string
  total_members: number
  team_group: "A" | "B" | "C"
  created_at: string
  // 인증 번호 정보
  leader_auth_code: string
  member2_auth_code?: string
  member3_auth_code?: string
  member4_auth_code?: string
}

export interface Voter {
  id: number
  ldap_nickname: string
  team_id: number
  voter_group: "A" | "B" | "C"
  has_voted_idea: boolean
  has_voted_implementation: boolean
  created_at: string
}

export interface Judge {
  id: number
  name: string
  judge_group: "A" | "B" | "C"
  has_voted_idea: boolean
  has_voted_implementation: boolean
  idea_votes_used: number
  implementation_votes_used: number
  created_at: string
}

export interface Vote {
  id: number
  voter_id?: number
  judge_id?: number
  team_id: number
  vote_type: "idea" | "implementation"
  voter_ldap?: string
  judge_name?: string
  created_at: string
}

export interface TeamWithVotes extends Team {
  idea_votes: number
  implementation_votes: number
  idea_voters: string[]
  implementation_voters: string[]
}

// JSON file-based database
const DB_PATH = path.join(process.cwd(), "data")
const TEAMS_FILE = path.join(DB_PATH, "teams.json")
const VOTERS_FILE = path.join(DB_PATH, "voters.json")
const JUDGES_FILE = path.join(DB_PATH, "judges.json")
const VOTES_FILE = path.join(DB_PATH, "votes.json")

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true })
  }
}

// Initialize database files
function initializeDatabase() {
  ensureDataDir()
  
  if (!fs.existsSync(TEAMS_FILE)) {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify([], null, 2))
  }
  
  if (!fs.existsSync(VOTERS_FILE)) {
    fs.writeFileSync(VOTERS_FILE, JSON.stringify([], null, 2))
  }
  
  if (!fs.existsSync(JUDGES_FILE)) {
    fs.writeFileSync(JUDGES_FILE, JSON.stringify([], null, 2))
  }
  
  if (!fs.existsSync(VOTES_FILE)) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify([], null, 2))
  }
}

// Read data from file
export function readData<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      return []
    }
    const data = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

// Write data to file
export function writeData<T>(filePath: string, data: T[]): void {
  try {
    ensureDataDir()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    throw error
  }
}

// Generate unique 6-digit authentication code
function generateAuthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Initialize database on first import
initializeDatabase()

export async function query(queryText: string, params?: any[]): Promise<any[]> {
  try {
    console.log("[v0] Database query:", queryText, params)

    // Simple query parser for our JSON-based database
    if (queryText.includes("FROM teams")) {
      const teams = readData<Team>(TEAMS_FILE)
      
      // Handle WHERE conditions
      if (queryText.includes("WHERE id = ?")) {
        return teams.filter(team => team.id === params![0])
      }
      
      // Handle ORDER BY
      if (queryText.includes("ORDER BY team_group, team_number")) {
        return teams.sort((a, b) => {
          if (a.team_group !== b.team_group) {
            return a.team_group.localeCompare(b.team_group)
          }
          return a.team_number - b.team_number
        })
      }
      
      return teams
    } else if (queryText.includes("FROM voters")) {
      const voters = readData<Voter>(VOTERS_FILE)
      
      // Handle WHERE conditions
      if (queryText.includes("WHERE id = ?")) {
        return voters.filter(voter => voter.id === params![0])
      } else if (queryText.includes("WHERE ldap_nickname = ?")) {
        return voters.filter(voter => voter.ldap_nickname === params![0])
      }
      
      return voters
    } else if (queryText.includes("FROM judges")) {
      const judges = readData<Judge>(JUDGES_FILE)
      
      // Handle WHERE conditions
      if (queryText.includes("WHERE id = ?")) {
        return judges.filter(judge => judge.id === params![0])
      } else if (queryText.includes("WHERE name = ?")) {
        return judges.filter(judge => judge.name === params![0])
      }
      
      return judges
    } else if (queryText.includes("FROM votes")) {
      const votes = readData<Vote>(VOTES_FILE)
      
      // Handle WHERE conditions
      if (queryText.includes("WHERE id = ?")) {
        return votes.filter(vote => vote.id === params![0])
      } else if (queryText.includes("WHERE judge_id = ? AND team_id = ? AND vote_type = ?")) {
        return votes.filter(vote => 
          vote.judge_id === params![0] && 
          vote.team_id === params![1] && 
          vote.vote_type === params![2]
        )
      }
      
      return votes
    }

    console.log("[v0] Database query result: 0 rows (unknown query)")
    return []
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  }
}

export async function execute(queryText: string, params?: any[]): Promise<void> {
  try {
    console.log("[v0] Database execute:", queryText, params)

    if (queryText.includes("DELETE FROM teams")) {
      writeData(TEAMS_FILE, [])
    } else if (queryText.includes("INSERT INTO teams")) {
      const teams = readData<Team>(TEAMS_FILE)
      const newTeam: Team = {
        id: teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1,
        team_number: params![0],
        team_name: params![5],
        leader_name: params![1],
        member2_name: params![2] || undefined,
        member3_name: params![3] || undefined,
        member4_name: params![4] || undefined,
        total_members: params![6],
        team_group: params![7] as "A" | "B" | "C",
        created_at: new Date().toISOString(),
        // 인증 번호 생성
        leader_auth_code: generateAuthCode(),
        member2_auth_code: params![2] ? generateAuthCode() : undefined,
        member3_auth_code: params![3] ? generateAuthCode() : undefined,
        member4_auth_code: params![4] ? generateAuthCode() : undefined
      }
      teams.push(newTeam)
      writeData(TEAMS_FILE, teams)
    } else if (queryText.includes("DELETE FROM teams WHERE id = ?")) {
      const teams = readData<Team>(TEAMS_FILE)
      const filteredTeams = teams.filter(team => team.id !== params![0])
      writeData(TEAMS_FILE, filteredTeams)
    } else if (queryText.includes("INSERT INTO voters")) {
      const voters = readData<Voter>(VOTERS_FILE)
      
      // Check if voter already exists with the same LDAP nickname
      const existingVoter = voters.find(v => v.ldap_nickname === params![0])
      if (existingVoter) {
        // Update existing voter instead of creating new one
        const updatedVoters = voters.map(voter => {
          if (voter.ldap_nickname === params![0]) {
            return {
              ...voter,
              team_id: params![1],
              voter_group: params![2] as "A" | "B" | "C"
            }
          }
          return voter
        })
        writeData(VOTERS_FILE, updatedVoters)
      } else {
        // Create new voter
        const newVoter: Voter = {
          id: voters.length > 0 ? Math.max(...voters.map(v => v.id)) + 1 : 1,
          ldap_nickname: params![0],
          team_id: params![1],
          voter_group: params![2] as "A" | "B" | "C",
          has_voted_idea: false,
          has_voted_implementation: false,
          created_at: new Date().toISOString()
        }
        voters.push(newVoter)
        writeData(VOTERS_FILE, voters)
      }
    } else if (queryText.includes("INSERT INTO judges")) {
      const judges = readData<Judge>(JUDGES_FILE)
      const newJudge: Judge = {
        id: judges.length > 0 ? Math.max(...judges.map(j => j.id)) + 1 : 1,
        name: params![0],
        judge_group: params![1] as "A" | "B" | "C",
        has_voted_idea: false,
        has_voted_implementation: false,
        idea_votes_used: 0,
        implementation_votes_used: 0,
        created_at: new Date().toISOString()
      }
      judges.push(newJudge)
      writeData(JUDGES_FILE, judges)
    } else if (queryText.includes("INSERT INTO votes")) {
      const votes = readData<Vote>(VOTES_FILE)
      const newVote: Vote = {
        id: votes.length > 0 ? Math.max(...votes.map(v => v.id)) + 1 : 1,
        voter_id: params![0] || undefined,
        judge_id: params![1] || undefined,
        team_id: params![2],
        vote_type: params![3] as "idea" | "implementation",
        voter_ldap: params![4] || undefined,
        judge_name: params![5] || undefined,
        created_at: new Date().toISOString()
      }
      votes.push(newVote)
      writeData(VOTES_FILE, votes)
    } else if (queryText.includes("UPDATE voters SET has_voted_idea = true")) {
      const voters = readData<Voter>(VOTERS_FILE)
      const updatedVoters = voters.map(voter => {
        if (voter.id === params![0]) {
          return { ...voter, has_voted_idea: true }
        }
        return voter
      })
      writeData(VOTERS_FILE, updatedVoters)
    } else if (queryText.includes("UPDATE voters SET has_voted_implementation = true")) {
      const voters = readData<Voter>(VOTERS_FILE)
      const updatedVoters = voters.map(voter => {
        if (voter.id === params![0]) {
          return { ...voter, has_voted_implementation: true }
        }
        return voter
      })
      writeData(VOTERS_FILE, updatedVoters)
    } else if (queryText.includes("UPDATE judges SET has_voted_idea = true")) {
      const judges = readData<Judge>(JUDGES_FILE)
      const updatedJudges = judges.map(judge => {
        if (judge.id === params![0]) {
          return { 
            ...judge, 
            has_voted_idea: true,
            idea_votes_used: judge.idea_votes_used + 1
          }
        }
        return judge
      })
      writeData(JUDGES_FILE, updatedJudges)
    } else if (queryText.includes("UPDATE judges SET has_voted_implementation = true")) {
      const judges = readData<Judge>(JUDGES_FILE)
      const updatedJudges = judges.map(judge => {
        if (judge.id === params![0]) {
          return { 
            ...judge, 
            has_voted_implementation: true,
            implementation_votes_used: judge.implementation_votes_used + 1
          }
        }
        return judge
      })
      writeData(JUDGES_FILE, updatedJudges)
    }

    console.log("[v0] Database execute completed")
  } catch (error) {
    console.error("[v0] Database execute error:", error)
    throw error
  }
}

export function isDatabaseConnected(): boolean {
  return true // Always return true for file-based database
}
