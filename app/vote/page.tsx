"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/database"

interface SearchResult {
  team: Team
  memberType: string
  memberName: string
}

export default function VotePage() {
  const [ldapNickname, setLdapNickname] = useState("")
  const [authCode, setAuthCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      } else {
        console.error("Failed to fetch teams:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    }
  }

  const searchMembers = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const results: SearchResult[] = []
    
    teams.forEach(team => {
      const members = [
        { name: team.leader_name, type: "팀장" },
        { name: team.member2_name, type: "팀원" },
        { name: team.member3_name, type: "팀원" },
        { name: team.member4_name, type: "팀원" }
      ].filter(member => member.name && member.name.trim() !== "")

      members.forEach(member => {
        if (member.name && member.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            team,
            memberType: member.type,
            memberName: member.name
          })
        }
      })
    })

    // Sort results by exact match first, then by team group and number
    results.sort((a, b) => {
      const aExact = a.memberName.toLowerCase() === query.toLowerCase()
      const bExact = b.memberName.toLowerCase() === query.toLowerCase()
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      if (a.team.team_group !== b.team.team_group) {
        return a.team.team_group.localeCompare(b.team.team_group)
      }
      return a.team.team_number - b.team.team_number
    })

    setSearchResults(results)
    setShowResults(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLdapNickname(value)
    searchMembers(value)
  }

  const handleResultClick = (result: SearchResult) => {
    setLdapNickname(result.memberName)
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

    // Clear previous error message
    setErrorMessage("")

    if (!ldapNickname.trim()) {
      toast({
        title: "입력 오류",
        description: "LDAP 닉네임을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!authCode.trim()) {
      toast({
        title: "입력 오류",
        description: "인증 번호를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/vote/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ldapNickname: ldapNickname.trim(),
          authCode: authCode.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Set error message for display
        const errorMsg = result.error || "인증 실패"
        setErrorMessage(errorMsg)
        throw new Error(errorMsg)
      }

      // Store voter session
      sessionStorage.setItem("voterSession", JSON.stringify(result.voter))

      toast({
        title: "인증 성공",
        description: "투표 페이지로 이동합니다.",
      })

      // Redirect to voting interface
      router.push("/vote/ballot")
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
          <h1 className="text-3xl font-bold text-foreground mb-2">투표자 인증</h1>
          <p className="text-muted-foreground">LDAP 닉네임을 입력하여 투표를 시작하세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              투표자 정보 입력
            </CardTitle>
            <CardDescription>
              LDAP 닉네임을 입력하면 자동으로 팀과 그룹을 찾아서 투표를 진행합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* LDAP Nickname with Auto-complete */}
              <div className="space-y-2">
                <Label htmlFor="ldap-nickname">LDAP 닉네임</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ldap-nickname"
                    placeholder="본인의 LDAP 닉네임을 입력하세요"
                    value={ldapNickname}
                    onChange={handleInputChange}
                    onFocus={() => ldapNickname && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 150)}
                    className="pl-10"
                    required
                  />
                  
                  {/* Search Results */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full max-h-48 overflow-y-auto border rounded-md bg-card shadow-lg mt-1 top-full left-0">
                      <div className="p-2">
                        {searchResults.map((result, index) => (
                          <button
                            key={`${result.team.id}-${index}`}
                            type="button"
                            onClick={() => handleResultClick(result)}
                            className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{result.memberName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {result.memberType} • {result.team.team_name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  #{result.team.team_number}
                                </Badge>
                                <Badge className={`text-xs ${getGroupColor(result.team.team_group)}`}>
                                  {result.team.team_group}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  시스템이 자동으로 팀과 그룹을 찾아서 투표를 진행합니다.
                </p>
              </div>

              {/* Authentication Code */}
              <div className="space-y-2">
                <Label htmlFor="auth-code">인증 번호</Label>
                <Input
                  id="auth-code"
                  type="text"
                  placeholder="6자리 인증 번호를 입력하세요"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="font-mono text-center text-lg tracking-wider"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  팀 등록 시 발급받은 개인 인증 번호를 입력하세요.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "인증 중..." : "투표 시작하기"}
              </Button>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">투표는 각 부문(아이디어, 구현/완성도)당 1회만 가능합니다</p>
        </div>
      </div>
    </div>
  )
}
