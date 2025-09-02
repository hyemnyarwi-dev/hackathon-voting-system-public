import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { query, execute } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // Skip header row and process data
    const authCodes = jsonData
      .slice(1)
      .map((row) => {
        const [teamNumber, teamName, memberType, ldapNickname, authCode] = row

        return {
          team_number: Number.parseInt(teamNumber) || 0,
          team_name: teamName || "",
          member_type: memberType || "",
          ldap_nickname: ldapNickname || "",
          auth_code: authCode || "",
        }
      })
      .filter((auth) => auth.team_number && auth.ldap_nickname && auth.auth_code)

    if (authCodes.length === 0) {
      return NextResponse.json({ error: "유효한 인증 번호 데이터가 없습니다." }, { status: 400 })
    }

    // Get existing teams
    const existingTeams = await query("SELECT * FROM teams")
    
    // Update teams with auth codes
    for (const authCodeData of authCodes) {
      const team = existingTeams.find(t => 
        t.team_number === authCodeData.team_number && 
        t.team_name === authCodeData.team_name
      )

      if (team) {
        // Update team with auth code
        const updatedTeam = { ...team }
        
        if (authCodeData.member_type === "팀장") {
          updatedTeam.leader_auth_code = authCodeData.auth_code
        } else if (authCodeData.member_type === "팀원2") {
          updatedTeam.member2_auth_code = authCodeData.auth_code
        } else if (authCodeData.member_type === "팀원3") {
          updatedTeam.member3_auth_code = authCodeData.auth_code
        } else if (authCodeData.member_type === "팀원4") {
          updatedTeam.member4_auth_code = authCodeData.auth_code
        }

        // Update in database
        await execute(
          `UPDATE teams SET leader_auth_code = ?, member2_auth_code = ?, member3_auth_code = ?, member4_auth_code = ? WHERE id = ?`,
          [
            updatedTeam.leader_auth_code,
            updatedTeam.member2_auth_code,
            updatedTeam.member3_auth_code,
            updatedTeam.member4_auth_code,
            team.id
          ]
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `${authCodes.length}개의 인증 번호가 성공적으로 업데이트되었습니다.`,
      updatedCount: authCodes.length
    })
  } catch (error) {
    console.error("Auth codes upload error:", error)
    return NextResponse.json({ error: "파일 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
} 