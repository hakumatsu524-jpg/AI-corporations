'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSimulation, advanceTime, runAllAgents, runFullTick, resetSimulation, initializeSimulation } from '@/lib/simulation/store'
import { SimulationHeader } from '@/components/simulation/header'
import { FinancialsPanel } from '@/components/simulation/financials-panel'
import { MarketPanel } from '@/components/simulation/market-panel'
import { ActionLog } from '@/components/simulation/action-log'
import { AssetsPanel } from '@/components/simulation/assets-panel'
import { AgentsPanel } from '@/components/simulation/agents-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SimulationDashboard() {
  const { state, isLoading, error } = useSimulation()
  const [isRunning, setIsRunning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize simulation on mount
  useEffect(() => {
    initializeSimulation()
  }, [])

  // Auto-run loop
  useEffect(() => {
    if (isRunning && !isProcessing) {
      intervalRef.current = setInterval(async () => {
        setIsProcessing(true)
        try {
          await runFullTick(1)
        } catch (error) {
          console.error('Tick error:', error)
          setIsRunning(false)
        } finally {
          setIsProcessing(false)
        }
      }, 3000) // Run every 3 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isProcessing])

  const handleToggleRun = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const handleAdvanceDay = useCallback(async () => {
    setIsProcessing(true)
    try {
      await advanceTime(1)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleRunAgents = useCallback(async () => {
    setIsProcessing(true)
    try {
      await runAllAgents()
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleReset = useCallback(async () => {
    setIsRunning(false)
    setIsProcessing(true)
    try {
      await resetSimulation()
    } finally {
      setIsProcessing(false)
    }
  }, [])

  if (isLoading && !state) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Initializing AI Company Simulation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-lg font-semibold text-red-500">Error Loading Simulation</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading simulation state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <SimulationHeader
        state={state}
        isRunning={isRunning}
        isProcessing={isProcessing}
        onToggleRun={handleToggleRun}
        onAdvanceDay={handleAdvanceDay}
        onRunAgents={handleRunAgents}
        onReset={handleReset}
      />

      <main className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-12 gap-4">
          {/* Left Column - Financials & Market */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            <FinancialsPanel state={state} />
          </div>

          {/* Center Column - Assets & Activity */}
          <div className="col-span-6 grid grid-rows-2 gap-4 overflow-hidden">
            <div className="overflow-hidden">
              <AssetsPanel state={state} />
            </div>
            <div className="overflow-hidden">
              <ActionLog entries={state.actionLog} maxHeight="calc(100% - 60px)" />
            </div>
          </div>

          {/* Right Column - Market & Agents */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            <MarketPanel state={state} />
            <AgentsPanel 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing}
            />
          </div>
        </div>
      </main>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">AI Agents Processing...</span>
        </div>
      )}
    </div>
  )
}
