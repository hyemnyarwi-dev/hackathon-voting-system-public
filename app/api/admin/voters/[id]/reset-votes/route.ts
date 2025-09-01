import { NextResponse } from "next/server"
import { readData, writeData } from "@/lib/database"
import type { Voter, Vote } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { voterId } = await request.json()
    
    if (!voterId) {
      return NextResponse.json({ error: "투표자 ID가 필요합니다." }, { status: 400 })
    }

    // Read current data
    const voters = readData<Voter>("data/voters.json")
    const votes = readData<Vote>("data/votes.json")

    // Find the voter
    const voter = voters.find(v => v.id === voterId)
    if (!voter) {
      return NextResponse.json({ error: "투표자를 찾을 수 없습니다." }, { status: 404 })
    }

    // Remove all votes by this voter
    const updatedVotes = votes.filter(vote => vote.voter_id !== voterId)
    writeData("data/votes.json", updatedVotes)

    // Reset voter's voting status
    const updatedVoters = voters.map(v => {
      if (v.id === voterId) {
        return {
          ...v,
          has_voted_idea: false,
          has_voted_implementation: false
        }
      }
      return v
    })
    writeData("data/voters.json", updatedVoters)

    return NextResponse.json({
      success: true,
      message: `${voter.ldap_nickname}의 투표가 성공적으로 초기화되었습니다.`,
      removedVotes: votes.length - updatedVotes.length
    })
  } catch (error) {
    console.error("Vote reset error:", error)
    return NextResponse.json({ error: "투표 초기화 중 오류가 발생했습니다." }, { status: 500 })
  }
} 