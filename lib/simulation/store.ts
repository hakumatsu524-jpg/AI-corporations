// Client-side store for simulation state

import useSWR, { mutate } from 'swr'
import type { SimulationState, SimulationConfig } from './types'
import type { AgentRole } from '../agents/agents'

const API_URL = '/api/simulation'

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

interface SimulationResponse {
  state: SimulationState
  config: SimulationConfig
}

interface ActionResponse {
  success: boolean
  state?: SimulationState
  config?: SimulationConfig
  agentResults?: AgentResult[]
  agentResult?: AgentResult
  error?: string
}

const fetcher = async (url: string): Promise<SimulationResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch simulation')
  return res.json()
}

export function useSimulation() {
  const { data, error, isLoading } = useSWR<SimulationResponse>(API_URL, fetcher, {
    refreshInterval: 0, // Manual refresh only
    revalidateOnFocus: false,
  })

  return {
    state: data?.state ?? null,
    config: data?.config ?? null,
    isLoading,
    error,
  }
}

export async function initializeSimulation(config?: Partial<SimulationConfig>): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'initialize', data: config }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function advanceTime(days: number = 1): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'advance', data: { days } }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function runAllAgents(model?: string): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'run_agents', data: { model } }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function runSingleAgent(agent: AgentRole, model?: string): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'run_single_agent', data: { agent, model } }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function runFullTick(days: number = 1, model?: string): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'full_tick', data: { days, model } }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function resetSimulation(): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

export async function updateConfig(config: Partial<SimulationConfig>): Promise<ActionResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_config', data: config }),
  })
  const result = await res.json()
  await mutate(API_URL)
  return result
}

// Helper to refresh the data
export function refreshSimulation() {
  return mutate(API_URL)
}
