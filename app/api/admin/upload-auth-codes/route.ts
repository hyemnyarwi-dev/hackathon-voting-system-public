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

    console.log("[v0] Auth codes upload: Processing", authCodes.length, "auth codes")

    // Get existing teams
    const existingTeams = await query("SELECT * FROM teams")
    console.log("[v0] Found", existingTeams.length, "existing teams")
    
    // Group auth codes by team
    const teamAuthCodes = new Map()
    
    for (const authCodeData of authCodes) {
      const teamKey = `${authCodeData.team_number}-${authCodeData.team_name}`
      
      if (!teamAuthCodes.has(teamKey)) {
        teamAuthCodes.set(teamKey, {
          team_number: authCodeData.team_number,
          team_name: authCodeData.team_name,
          leader_auth_code: "",
          member2_auth_code: "",
          member3_auth_code: "",
          member4_auth_code: ""
        })
      }
      
      const teamData = teamAuthCodes.get(teamKey)
      
      if (authCodeData.member_type === "팀장") {
        teamData.leader_auth_code = authCodeData.auth_code
      } else if (authCodeData.member_type === "팀원2") {
        teamData.member2_auth_code = authCodeData.auth_code
      } else if (authCodeData.member_type === "팀원3") {
        teamData.member3_auth_code = authCodeData.auth_code
      } else if (authCodeData.member_type === "팀원4") {
        teamData.member4_auth_code = authCodeData.auth_code
      }
    }
    
    console.log("[v0] Grouped into", teamAuthCodes.size, "teams")
    
    // Update teams with auth codes
    let updatedCount = 0
    let notFoundCount = 0
    
    for (const [teamKey, authCodeData] of teamAuthCodes) {
      const team = existingTeams.find(t => 
        t.team_number === authCodeData.team_number && 
        t.team_name === authCodeData.team_name
      )

      if (team) {
        // Update in database
        console.log("[v0] Updating team:", team.team_name, "with auth codes:", {
          leader: authCodeData.leader_auth_code,
          member2: authCodeData.member2_auth_code,
          member3: authCodeData.member3_auth_code,
          member4: authCodeData.member4_auth_code
        })
        
        await execute(
          `UPDATE teams SET leader_auth_code = ?, member2_auth_code = ?, member3_auth_code = ?, member4_auth_code = ? WHERE id = ?`,
          [
            authCodeData.leader_auth_code,
            authCodeData.member2_auth_code,
            authCodeData.member3_auth_code,
            authCodeData.member4_auth_code,
            team.id
          ]
        )
        updatedCount++
      } else {
        console.log("[v0] Team not found:", authCodeData.team_number, authCodeData.team_name)
        notFoundCount++
      }
    }
    
    console.log("[v0] Updated:", updatedCount, "teams, Not found:", notFoundCount, "teams")

    return NextResponse.json({
      success: true,
      message: `${updatedCount}개 팀의 인증 번호가 성공적으로 업데이트되었습니다.${notFoundCount > 0 ? ` (${notFoundCount}개 팀을 찾을 수 없음)` : ''}`,
      updatedCount: updatedCount,
      notFoundCount: notFoundCount,
      totalAuthCodes: authCodes.length
    })
  } catch (error) {
    console.error("Auth codes upload error:", error)
    return NextResponse.json({ error: "파일 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
} 