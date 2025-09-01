import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/database"
import type { Judge, Vote } from "@/lib/database"

export async function DELETE(request: NextRequest) {
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

    // Remove judge
    const updatedJudges = judges.filter(j => j.id !== judgeId)
    writeData("data/judges.json", updatedJudges)

    return NextResponse.json({
      success: true,
      message: `${judge.name} 심사위원이 성공적으로 삭제되었습니다.`,
      removedVotes: votes.length - updatedVotes.length
    })
  } catch (error) {
    console.error("Judge deletion error:", error)
    return NextResponse.json({ error: "심사위원 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
} 