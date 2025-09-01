"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Award, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Judge } from "@/lib/database"

interface SearchResult {
  judge: Judge
}

export default function JudgeAuthPage() {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [judges, setJudges] = useState<Judge[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchJudges()
  }, [])

  const fetchJudges = async () => {
    try {
      const response = await fetch("/api/admin/judges")
      if (response.ok) {
        const data = await response.json()
        setJudges(data.judges || [])
      }
    } catch (error) {
      console.error("Failed to fetch judges:", error)
    }
  }

  const searchJudges = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const results: SearchResult[] = judges
      .filter(judge => judge.name.toLowerCase().includes(query.toLowerCase()))
      .map(judge => ({ judge }))

    setSearchResults(results)
    setShowResults(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    searchJudges(value)
  }

  const handleResultClick = (result: SearchResult) => {
    setName(result.judge.name)
    setShowResults(false)
  }

  const getGroupColor = (group: string) => {
    switch (group) {
      case "A":
        return "bg-chart-1 text-white"
      case "B":
        return "bg-chart-2 text-white"
      case "C":
        return "bg-chart-3 text-white"
      default:
        return "bg-muted"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "입력 오류",
        description: "심사위원 이름을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    // Find the judge
    const foundJudge = judges.find(judge => 
      judge.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (!foundJudge) {
      toast({
        title: "심사위원 없음",
        description: "등록되지 않은 심사위원입니다. 관리자에게 문의하세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/judge/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: foundJudge.name,
          judgeGroup: foundJudge.judge_group,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "인증 실패")
      }

      // Store judge session
      sessionStorage.setItem("judgeSession", JSON.stringify(result.judge))

      toast({
        title: "인증 성공",
        description: "심사위원 투표 페이지로 이동합니다.",
      })

      // Redirect to judge voting interface
      router.push("/judge/ballot")
    } catch (error) {
      toast({
        title: "인증 실패",
        description: error instanceof Error ? error.message : "인증 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">심사위원 인증</h1>
          <p className="text-muted-foreground">심사위원 이름을 입력하여 투표를 시작하세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              심사위원 정보 입력
            </CardTitle>
            <CardDescription>
              심사위원 이름을 입력하면 자동으로 그룹을 찾아서 투표를 진행합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="judge-name">심사위원 이름</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="judge-name"
                    placeholder="본인의 이름을 입력하세요"
                    value={name}
                    onChange={handleInputChange}
                    onFocus={() => name && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    className="pl-10"
                    required
                  />
                </div>
                
                {/* Search Results */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full max-h-60 overflow-y-auto border rounded-md bg-card shadow-lg">
                    <div className="p-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.judge.id}-${index}`}
                          type="button"
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{result.judge.name}</div>
                              <div className="text-xs text-muted-foreground">
                                심사위원 • 그룹 {result.judge.judge_group}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getGroupColor(result.judge.judge_group)}`}>
                                {result.judge.judge_group}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  시스템이 자동으로 그룹을 찾아서 투표를 진행합니다.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "인증 중..." : "심사위원 투표 시작하기"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            심사위원은 각 부문(아이디어, 완성도)당 최대 2표까지 투표할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
} 