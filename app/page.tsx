"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Vote, Settings, BarChart3, Users, Award, BarChart } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">해커톤 투표 시스템</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            참가자들이 팀을 선택하고 투표할 수 있는 시스템입니다. 관리자는 결과를 실시간으로 확인하고 데이터를 관리할 수
            있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                참가자 투표
              </CardTitle>
              <CardDescription>
                해커톤 참가자들이 아이디어와 완성도 부문에 투표합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/vote")} className="w-full">
                투표하기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                심사위원 투표
              </CardTitle>
              <CardDescription>
                심사위원들이 각 부문당 최대 2표까지 투표합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/judge")} className="w-full">
                심사위원 투표
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-green-500" />
                결과 확인
              </CardTitle>
              <CardDescription>
                실시간 투표 결과와 순위를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/results")} className="w-full">
                결과 보기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                관리자 대시보드
              </CardTitle>
              <CardDescription>
                팀 데이터 관리 및 투표자/심사위원 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin")} className="w-full" variant="outline">
                관리자 페이지
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-card rounded-lg p-6 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">투표 방법</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm sm:text-base">자신의 팀과 LDAP 닉네임을 입력하고 그룹을 선택합니다</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm sm:text-base">아이디어 부문에서 마음에 드는 팀에 투표합니다</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm sm:text-base">완성도 부문에서 마음에 드는 팀에 투표합니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
