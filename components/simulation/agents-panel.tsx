'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AGENT_PROMPTS, type AgentRole } from '@/lib/agents/agents'
import { getAgentDisplayName, getAgentColor } from '@/lib/simulation/utils'
import { runSingleAgent } from '@/lib/simulation/store'
import { Bot, Play, Loader2, Brain, Briefcase, TrendingUp, Users } from 'lucide-react'

interface AgentsPanelProps {
  onAgentRun?: (result: unknown) => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
}

interface AgentResult {
  agent: AgentRole
  actions: Array<{
    action: string
    data: Record<string, unknown>
    success: boolean
    message: string
  }>
  reasoning: string
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  ceo: <Users className="h-5 w-5" />,
  cfo: <Briefcase className="h-5 w-5" />,
  dealmaker: <TrendingUp className="h-5 w-5" />,
  analyst: <Brain className="h-5 w-5" />,
}

const AGENT_DESCRIPTIONS: Record<string, string> = {
  ceo: 'Sets strategy, approves major decisions, manages reputation',
  cfo: 'Manages finances, investments, portfolio optimization',
  dealmaker: 'Finds partners, negotiates deals, builds relationships',
  analyst: 'Monitors markets, identifies opportunities and risks',
}

export function AgentsPanel({ onAgentRun, isProcessing, setIsProcessing }: AgentsPanelProps) {
  const [lastResults, setLastResults] = useState<Record<AgentRole, AgentResult | null>>({
    ceo: null,
    cfo: null,
    dealmaker: null,
    analyst: null,
  })
  const [runningAgent, setRunningAgent] = useState<AgentRole | null>(null)

  const agents: AgentRole[] = ['analyst', 'cfo', 'dealmaker', 'ceo']

  const handleRunAgent = async (agent: AgentRole) => {
    setIsProcessing(true)
    setRunningAgent(agent)

    try {
      const result = await runSingleAgent(agent)
      if (result.agentResult) {
        setLastResults(prev => ({
          ...prev,
          [agent]: result.agentResult as AgentResult,
        }))
        onAgentRun?.(result)
      }
    } catch (error) {
      console.error('Error running agent:', error)
    } finally {
      setIsProcessing(false)
      setRunningAgent(null)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4" />
          AI Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {agents.map(agent => {
              const result = lastResults[agent]
              const isRunning = runningAgent === agent

              return (
                <div
                  key={agent}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${getAgentColor(agent)}`}>
                        {AGENT_ICONS[agent]}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${getAgentColor(agent)}`}>
                          {getAgentDisplayName(agent)}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {AGENT_DESCRIPTIONS[agent]}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunAgent(agent)}
                      disabled={isProcessing}
                    >
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {result && (
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="text-sm">
                        <span className="font-medium">Last Action: </span>
                        {result.actions.length > 0 ? (
                          <span className="text-muted-foreground">
                            {result.actions.map(a => a.action).join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No action taken</span>
                        )}
                      </div>

                      {result.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.actions.map((action, i) => (
                            <Badge
                              key={i}
                              variant={action.success ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {action.success ? 'Success' : 'Failed'}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {result.reasoning && (
                        <div className="rounded bg-muted/50 p-2">
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {result.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!result && (
                    <p className="text-xs text-muted-foreground italic">
                      Agent has not run yet. Click play to activate.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
