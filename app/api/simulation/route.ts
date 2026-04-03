// API route for simulation control

import { NextResponse } from 'next/server'
import { createInitialState, advanceSimulation } from '@/lib/simulation/engine'
import { runSimulationTick, runAgent } from '@/lib/agents/runner'
import type { SimulationState, SimulationConfig } from '@/lib/simulation/types'
import type { AgentRole } from '@/lib/agents/agents'

// In-memory state (in production, use a database)
let simulationState: SimulationState | null = null
let simulationConfig: SimulationConfig = {
  companyName: 'Nexus Ventures',
  startingCash: 10_000_000,
  simulationSpeedMs: 1000,
  maxAgentActionsPerTick: 3,
  enableExternalDeals: true,
  marketVolatility: 'medium',
}

export async function GET() {
  if (!simulationState) {
    simulationState = createInitialState(simulationConfig)
  }

  return NextResponse.json({
    state: simulationState,
    config: simulationConfig,
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, data } = body as { action: string; data?: Record<string, unknown> }

  try {
    switch (action) {
      case 'initialize': {
        const config = data as Partial<SimulationConfig> | undefined
        if (config) {
          simulationConfig = { ...simulationConfig, ...config }
        }
        simulationState = createInitialState(simulationConfig)
        return NextResponse.json({ success: true, state: simulationState })
      }

      case 'advance': {
        if (!simulationState) {
          simulationState = createInitialState(simulationConfig)
        }
        const days = (data?.days as number) || 1
        simulationState = advanceSimulation(simulationState, simulationConfig, days)
        return NextResponse.json({ success: true, state: simulationState })
      }

      case 'run_agents': {
        if (!simulationState) {
          simulationState = createInitialState(simulationConfig)
        }

        const model = (data?.model as string) || 'openai/gpt-4o-mini'
        const { results, finalState } = await runSimulationTick(simulationState, model)
        simulationState = finalState

        return NextResponse.json({
          success: true,
          state: simulationState,
          agentResults: results.map(r => ({
            agent: r.agent,
            actions: r.actions,
            reasoning: r.reasoning,
          })),
        })
      }

      case 'run_single_agent': {
        if (!simulationState) {
          simulationState = createInitialState(simulationConfig)
        }

        const agent = data?.agent as AgentRole
        const model = (data?.model as string) || 'openai/gpt-4o-mini'

        if (!['ceo', 'cfo', 'dealmaker', 'analyst'].includes(agent)) {
          return NextResponse.json({ success: false, error: 'Invalid agent' }, { status: 400 })
        }

        const result = await runAgent(simulationState, agent, model)
        simulationState = result.newState

        return NextResponse.json({
          success: true,
          state: simulationState,
          agentResult: {
            agent: result.agent,
            actions: result.actions,
            reasoning: result.reasoning,
          },
        })
      }

      case 'full_tick': {
        if (!simulationState) {
          simulationState = createInitialState(simulationConfig)
        }

        // First advance time
        const days = (data?.days as number) || 1
        simulationState = advanceSimulation(simulationState, simulationConfig, days)

        // Then run all agents
        const model = (data?.model as string) || 'openai/gpt-4o-mini'
        const { results, finalState } = await runSimulationTick(simulationState, model)
        simulationState = finalState

        return NextResponse.json({
          success: true,
          state: simulationState,
          agentResults: results.map(r => ({
            agent: r.agent,
            actions: r.actions,
            reasoning: r.reasoning,
          })),
        })
      }

      case 'reset': {
        simulationState = createInitialState(simulationConfig)
        return NextResponse.json({ success: true, state: simulationState })
      }

      case 'update_config': {
        const newConfig = data as Partial<SimulationConfig>
        simulationConfig = { ...simulationConfig, ...newConfig }
        return NextResponse.json({ success: true, config: simulationConfig })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
