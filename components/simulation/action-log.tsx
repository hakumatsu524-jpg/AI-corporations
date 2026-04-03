'use client'

import { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ActionLogEntry } from '@/lib/simulation/types'
import { formatDateTime, formatCurrency, getAgentDisplayName, getAgentColor } from '@/lib/simulation/utils'
import { Activity, Bot, DollarSign } from 'lucide-react'

interface ActionLogProps {
  entries: ActionLogEntry[]
  maxHeight?: string
}

export function ActionLog({ entries, maxHeight = '500px' }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const reversedEntries = [...entries].reverse()

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity Log
          <Badge variant="secondary" className="ml-auto">
            {entries.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="px-4 pb-4" style={{ height: maxHeight }}>
          <div className="space-y-3" ref={scrollRef}>
            {reversedEntries.map((entry, index) => (
              <div
                key={entry.id || index}
                className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className={`h-4 w-4 ${getAgentColor(entry.agent)}`} />
                    <span className={`text-sm font-medium ${getAgentColor(entry.agent)}`}>
                      {getAgentDisplayName(entry.agent)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>

                <p className="mb-1 text-sm font-medium">{entry.action}</p>
                <p className="text-sm text-muted-foreground">{entry.details}</p>

                {entry.impact && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.impact.cashChange !== undefined && entry.impact.cashChange !== 0 && (
                      <Badge
                        variant="outline"
                        className={entry.impact.cashChange > 0 ? 'text-emerald-500' : 'text-red-500'}
                      >
                        <DollarSign className="mr-1 h-3 w-3" />
                        {entry.impact.cashChange > 0 ? '+' : ''}
                        {formatCurrency(entry.impact.cashChange)}
                      </Badge>
                    )}
                    {entry.impact.reputationChange !== undefined && entry.impact.reputationChange !== 0 && (
                      <Badge
                        variant="outline"
                        className={entry.impact.reputationChange > 0 ? 'text-blue-500' : 'text-orange-500'}
                      >
                        Rep: {entry.impact.reputationChange > 0 ? '+' : ''}
                        {entry.impact.reputationChange}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}

            {entries.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No activity yet. Start the simulation to see agent actions.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
