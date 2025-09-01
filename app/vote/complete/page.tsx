"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, CheckCircle, Lightbulb, Code } from "lucide-react"
import { getVoterSession, type VoterSession } from "@/lib/auth"

export default function VoteCompletePage() {
  const [voterSession, setVoterSession] = useState<VoterSession | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = getVoterSession()
    if (!session) {
      router.push("/vote")
      return
    }

    if (!session.has_voted_idea || !session.has_voted_implementation) {
      router.push("/vote/ballot")
      return
    }

    setVoterSession(session)
  }, [router])

  if (!voterSession) {
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/20 rounded-full w-fit">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">투표 완료!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {voterSession.ldap_nickname}님의 모든 투표가 성공적으로 완료되었습니다.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">아이디어 부문 투표 완료</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">완성도 부문 투표 완료</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  투표해주셔서 감사합니다! 결과는 관리자가 공개할 예정입니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
