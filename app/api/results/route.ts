import { NextResponse } from "next/server"
import { readData } from "@/lib/database"
import type { Team, Vote } from "@/lib/database"

interface TeamWithVotes extends Team {
  idea_votes: number
  implementation_votes: number
  idea_voters: string[]
  implementation_voters: string[]
  idea_judges: string[]
  implementation_judges: string[]
}

export async function GET() {
  try {
    // Read data from JSON files
    const teams = readData<Team>("data/teams.json")
    const votes = readData<Vote>("data/votes.json")

    // Process results using JavaScript instead of SQL
    const results: TeamWithVotes[] = teams.map(team => {
      // Count votes for this team
      const teamVotes = votes.filter(vote => vote.team_id === team.id)
      
      const ideaVotes = teamVotes.filter(vote => vote.vote_type === "idea")
      const implementationVotes = teamVotes.filter(vote => vote.vote_type === "implementation")
      
      // Get voter LDAP nicknames
      const ideaVoters = ideaVotes.filter(vote => vote.voter_ldap).map(vote => vote.voter_ldap!)
      const implementationVoters = implementationVotes.filter(vote => vote.voter_ldap).map(vote => vote.voter_ldap!)
      
      // Get judge names
      const ideaJudges = ideaVotes.filter(vote => vote.judge_name).map(vote => vote.judge_name!)
      const implementationJudges = implementationVotes.filter(vote => vote.judge_name).map(vote => vote.judge_name!)

      return {
        ...team,
        idea_votes: ideaVotes.length,
        implementation_votes: implementationVotes.length,
        idea_voters: ideaVoters,
        implementation_voters: implementationVoters,
        idea_judges: ideaJudges,
        implementation_judges: implementationJudges,
      }
    })

    // Sort by team group and team number
    const sortedResults = results.sort((a, b) => {
      if (a.team_group !== b.team_group) {
        return a.team_group.localeCompare(b.team_group)
      }
      return a.team_number - b.team_number
    })

    return NextResponse.json({
      success: true,
      results: sortedResults,
    })
  } catch (error) {
    console.error("Results fetch error:", error)
    return NextResponse.json({ error: "결과를 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
