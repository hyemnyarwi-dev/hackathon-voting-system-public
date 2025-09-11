import { NextRequest, NextResponse } from "next/server"
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

    // Remove the voter completely from voters list
    const updatedVoters = voters.filter(v => v.id !== voterId)
    writeData("data/voters.json", updatedVoters)

    return NextResponse.json({
      success: true,
      message: `${voter.ldap_nickname}의 투표가 초기화되고 투표자 목록에서 삭제되었습니다.`,
      removedVotes: votes.length - updatedVotes.length
    })
  } catch (error) {
    console.error("Vote reset error:", error)
    return NextResponse.json({ error: "투표 초기화 중 오류가 발생했습니다." }, { status: 500 })
  }
} 