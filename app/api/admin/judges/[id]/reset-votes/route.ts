import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/database"
import type { Judge, Vote } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { judgeId } = await request.json()
    
    if (!judgeId) {
      return NextResponse.json({ error: "심사위원 ID가 필요합니다." }, { status: 400 })
    }

    // Read current data
    const judges = readData<Judge>("data/judges.json")
    const votes = readData<Vote>("data/votes.json")

    // Find the judge
    const judge = judges.find(j => j.id === judgeId)
    if (!judge) {
      return NextResponse.json({ error: "심사위원을 찾을 수 없습니다." }, { status: 404 })
    }

    // Remove all votes by this judge
    const updatedVotes = votes.filter(vote => vote.judge_id !== judgeId)
    writeData("data/votes.json", updatedVotes)

    // Reset judge's voting status
    const updatedJudges = judges.map(j => {
      if (j.id === judgeId) {
        return {
          ...j,
          has_voted_idea: false,
          has_voted_implementation: false,
          idea_votes_used: 0,
          implementation_votes_used: 0
        }
      }
      return j
    })
    writeData("data/judges.json", updatedJudges)

    return NextResponse.json({
      success: true,
      message: `${judge.name} 심사위원의 투표가 성공적으로 초기화되었습니다.`,
      removedVotes: votes.length - updatedVotes.length
    })
  } catch (error) {
    console.error("Judge vote reset error:", error)
    return NextResponse.json({ error: "심사위원 투표 초기화 중 오류가 발생했습니다." }, { status: 500 })
  }
} 