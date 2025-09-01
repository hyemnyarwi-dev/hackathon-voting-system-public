import { NextResponse } from "next/server"
import { readData } from "@/lib/database"
import type { Voter } from "@/lib/database"

export async function GET() {
  try {
    const voters = readData<Voter>("data/voters.json")
    
    return NextResponse.json({
      success: true,
      voters: voters,
    })
  } catch (error) {
    console.error("Voters fetch error:", error)
    return NextResponse.json({ error: "투표자 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
} 