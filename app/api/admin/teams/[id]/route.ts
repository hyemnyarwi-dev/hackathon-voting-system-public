import { type NextRequest, NextResponse } from "next/server"
import { execute } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teamId = Number.parseInt(params.id)

    // Delete the team from database
    await execute("DELETE FROM teams WHERE id = ?", [teamId])

    return NextResponse.json({
      success: true,
      message: "팀이 성공적으로 삭제되었습니다.",
    })
  } catch (error) {
    console.error("Team deletion error:", error)
    return NextResponse.json({ error: "팀 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
