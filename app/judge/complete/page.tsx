"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface JudgeSession {
  id: number
  name: string
  judge_group: "A" | "B" | "C"
  idea_votes_used: number
  implementation_votes_used: number
}

export default function JudgeCompletePage() {
  const [judgeSession, setJudgeSession] = useState<JudgeSession | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = sessionStorage.getItem("judgeSession")
    if (!session) {
      router.push("/judge")
      return
    }

    const judgeData = JSON.parse(session)
    setJudgeSession(judgeData)
  }, [router])

  if (!judgeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">심사위원 투표 완료!</CardTitle>
            <CardDescription>
              모든 투표가 성공적으로 완료되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">{judgeSession.name} 심사위원님</p>
              <Badge className="bg-primary text-primary-foreground">
                그룹 {judgeSession.judge_group}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">{judgeSession.idea_votes_used}</div>
                <div className="text-sm text-muted-foreground">아이디어 투표</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{judgeSession.implementation_votes_used}</div>
                <div className="text-sm text-muted-foreground">완성도 투표</div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                총 {judgeSession.idea_votes_used + judgeSession.implementation_votes_used}표 투표 완료
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 