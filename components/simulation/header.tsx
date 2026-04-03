'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SimulationState } from '@/lib/simulation/types'
import { formatCurrency, formatDate, calculateNetWorth, getCompanyHealth, getStatusColor } from '@/lib/simulation/utils'
import { Play, Pause, RotateCcw, FastForward, Zap } from 'lucide-react'

interface HeaderProps {
  state: SimulationState | null
  isRunning: boolean
  isProcessing: boolean
  onToggleRun: () => void
  onAdvanceDay: () => void
  onRunAgents: () => void
  onReset: () => void
}

export function SimulationHeader({
  state,
  isRunning,
  isProcessing,
  onToggleRun,
  onAdvanceDay,
  onRunAgents,
  onReset,
}: HeaderProps) {
  if (!state) return null

  const netWorth = calculateNetWorth(state.company)
  const health = getCompanyHealth(state)

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Company Logo"
            width={48}
            height={48}
            className="rounded bg-background"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">{state.company.name}</h1>
            <p className="text-sm text-muted-foreground">AI-Controlled Finance & Real Estate</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Simulation Date</p>
            <p className="font-mono text-lg font-semibold">{formatDate(state.currentDate)}</p>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="font-mono text-lg font-semibold text-emerald-500">{formatCurrency(netWorth)}</p>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Company Health</p>
            <Badge variant="outline" className={getStatusColor(health.status)}>
              {health.status.toUpperCase()} ({health.score})
            </Badge>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onAdvanceDay}
              disabled={isProcessing}
              title="Advance 1 Day"
            >
              <FastForward className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onRunAgents}
              disabled={isProcessing}
              title="Run AI Agents"
            >
              <Zap className="h-4 w-4" />
            </Button>

            <Button
              variant={isRunning ? 'destructive' : 'default'}
              size="icon"
              onClick={onToggleRun}
              disabled={isProcessing}
              title={isRunning ? 'Pause' : 'Auto-Run'}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              disabled={isProcessing}
              title="Reset Simulation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
