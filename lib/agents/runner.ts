// Agent runner - executes AI agent decisions

import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { SimulationState, ActionLogEntry, Property, Investment, Deal } from '../simulation/types'
import { createAgentTools, AGENT_PROMPTS, type AgentRole } from './agents'
import {
  purchaseProperty,
  sellAsset,
  makeInvestment,
  proposeDeal,
  hireEmployees,
  addLogEntry,
} from '../simulation/engine'

// Action schema for structured output
const AgentActionSchema = z.object({
  action: z.enum([
    'PURCHASE_PROPERTY',
    'SELL_ASSET', 
    'BUY_STOCK',
    'SELL_STOCK',
    'PROPOSE_DEAL',
    'HIRE_EMPLOYEES',
    'LOG_DECISION',
    'SKIP_TURN',
  ]),
  data: z.record(z.unknown()).nullable(),
  reasoning: z.string(),
})

export interface AgentRunResult {
  agent: AgentRole
  actions: Array<{
    action: string
    data: Record<string, unknown>
    success: boolean
    message: string
  }>
  reasoning: string
  newState: SimulationState
}

export async function runAgent(
  state: SimulationState,
  agent: AgentRole,
  model: string = 'openai/gpt-4o-mini'
): Promise<AgentRunResult> {
  const tools = createAgentTools(state)
  const systemPrompt = AGENT_PROMPTS[agent]

  // Create context summary for the agent
  const contextSummary = createContextSummary(state, agent)

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: contextSummary,
      tools,
      maxSteps: 5, // Allow multiple tool calls
    })

    // Process the tool calls and update state
    let newState = state
    const actions: AgentRunResult['actions'] = []

    for (const step of result.steps) {
      for (const toolCall of step.toolCalls) {
        const toolResult = step.toolResults.find(r => r.toolCallId === toolCall.toolCallId)
        if (toolResult && typeof toolResult.result === 'object' && toolResult.result !== null) {
          const resultObj = toolResult.result as Record<string, unknown>
          
          if (resultObj.success && resultObj.action) {
            const actionResult = applyAction(
              newState,
              resultObj.action as string,
              resultObj.data as Record<string, unknown>,
              agent
            )
            newState = actionResult.state
            actions.push({
              action: resultObj.action as string,
              data: resultObj.data as Record<string, unknown>,
              success: true,
              message: resultObj.message as string || 'Action completed',
            })
          } else if (resultObj.error) {
            actions.push({
              action: toolCall.toolName,
              data: toolCall.args as Record<string, unknown>,
              success: false,
              message: resultObj.error as string,
            })
          }
        }
      }
    }

    return {
      agent,
      actions,
      reasoning: result.text || 'No explanation provided',
      newState,
    }
  } catch (error) {
    console.error(`Agent ${agent} error:`, error)
    
    // Return unchanged state on error
    const errorState = addLogEntry(state, {
      agent,
      action: 'Agent Error',
      details: `Agent encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })

    return {
      agent,
      actions: [],
      reasoning: 'Agent encountered an error and could not complete its turn.',
      newState: errorState,
    }
  }
}

function createContextSummary(state: SimulationState, agent: AgentRole): string {
  const company = state.company
  const market = state.market

  let summary = `
=== CURRENT SITUATION ===
Date: ${state.currentDate.toLocaleDateString()}
Company: ${company.name}

FINANCIALS:
- Cash: $${company.cash.toLocaleString()}
- Monthly Revenue: $${company.monthlyRevenue.toLocaleString()}
- Monthly Expenses: $${company.monthlyExpenses.toLocaleString()}
- Employees: ${company.employees}
- Reputation: ${company.reputation}/100

ASSETS:
- Properties: ${company.assets.filter(a => a.type === 'property').length}
- Total Asset Value: $${company.assets.reduce((sum, a) => sum + a.currentValue, 0).toLocaleString()}
- Investments: ${company.investments.length}
- Total Investment Value: $${company.investments.reduce((sum, i) => sum + i.currentPrice * i.shares, 0).toLocaleString()}

MARKET CONDITIONS:
- Economic Sentiment: ${market.economicSentiment.toUpperCase()}
- Real Estate Index: ${market.realEstateIndex.toFixed(1)} (100 = baseline)
- Stock Market Index: ${market.stockMarketIndex.toFixed(1)}
- Interest Rate: ${market.interestRate.toFixed(2)}%
- Inflation: ${market.inflation.toFixed(1)}%
${market.events.length > 0 ? `- Active Events: ${market.events.map(e => e.title).join(', ')}` : ''}

ACTIVE DEALS:
${company.deals.filter(d => ['proposed', 'negotiating'].includes(d.status)).map(d => 
  `- ${d.type} with ${d.counterpartyName}: $${d.value.toLocaleString()} (${d.status})`
).join('\n') || 'No active deals'}

RECENT ACTIONS (last 5):
${state.actionLog.slice(-5).map(log => 
  `- [${log.agent.toUpperCase()}] ${log.action}: ${log.details}`
).join('\n')}

=== YOUR TASK ===
As the ${agent.toUpperCase()}, analyze the current situation and decide what actions to take (if any).
Use the available tools to gather more information and execute your decisions.
Always explain your reasoning.
`

  // Add role-specific context
  if (agent === 'cfo') {
    const cashRatio = company.cash / (company.cash + company.assets.reduce((s, a) => s + a.currentValue, 0))
    summary += `\nCash Reserve Ratio: ${(cashRatio * 100).toFixed(1)}% (target: 20-30%)`
  }

  if (agent === 'dealmaker') {
    summary += `\nPotential Partners Available: ${state.externalCompanies.filter(c => c.openToDeals).length}`
  }

  return summary
}

function applyAction(
  state: SimulationState,
  action: string,
  data: Record<string, unknown>,
  agent: AgentRole
): { state: SimulationState } {
  switch (action) {
    case 'PURCHASE_PROPERTY': {
      const propertyData = data as {
        name: string
        address: string
        propertyType: 'residential' | 'commercial' | 'industrial' | 'land'
        purchasePrice: number
        squareFeet: number
        occupancyRate: number
        tenants: Array<{ id: string; name: string; monthlyRent: number; leaseEndDate: Date; paymentReliability: number }>
        monthlyIncome?: number
      }
      
      const newProperty: Omit<Property, 'id' | 'purchaseDate' | 'currentValue'> = {
        type: 'property',
        name: propertyData.name,
        address: propertyData.address,
        propertyType: propertyData.propertyType,
        purchasePrice: propertyData.purchasePrice,
        squareFeet: propertyData.squareFeet,
        occupancyRate: propertyData.occupancyRate || 0,
        tenants: propertyData.tenants || [],
        monthlyIncome: propertyData.monthlyIncome,
        metadata: {},
      }
      
      return { state: purchaseProperty(state, newProperty) }
    }

    case 'SELL_ASSET': {
      const { assetId } = data as { assetId: string }
      return { state: sellAsset(state, assetId) }
    }

    case 'BUY_STOCK': {
      const stockData = data as {
        type: 'stock'
        symbol: string
        shares: number
        purchasePrice: number
        dividendYield?: number
      }
      
      return {
        state: makeInvestment(state, {
          type: stockData.type,
          symbol: stockData.symbol,
          shares: stockData.shares,
          purchasePrice: stockData.purchasePrice,
          dividendYield: stockData.dividendYield,
        })
      }
    }

    case 'SELL_STOCK': {
      const { investmentId, shares, salePrice } = data as { investmentId: string; shares: number; salePrice: number }
      const investment = state.company.investments.find(i => i.id === investmentId)
      if (!investment) return { state }

      const totalSale = shares * salePrice
      const remainingShares = investment.shares - shares

      const logEntry: ActionLogEntry = {
        id: `sell_stock_${Date.now()}`,
        timestamp: state.currentDate,
        agent,
        action: 'Stock Sold',
        details: `Sold ${shares} shares of ${investment.symbol} at $${salePrice.toFixed(2)} for $${totalSale.toLocaleString()}`,
        impact: { cashChange: totalSale },
      }

      const updatedInvestments = remainingShares > 0
        ? state.company.investments.map(i => 
            i.id === investmentId ? { ...i, shares: remainingShares } : i
          )
        : state.company.investments.filter(i => i.id !== investmentId)

      return {
        state: {
          ...state,
          company: {
            ...state.company,
            cash: state.company.cash + totalSale,
            investments: updatedInvestments,
          },
          actionLog: [...state.actionLog, logEntry],
        }
      }
    }

    case 'PROPOSE_DEAL': {
      const dealData = data as {
        counterpartyId: string
        counterpartyName: string
        type: Deal['type']
        value: number
        terms: string
        expirationDate: Date
      }
      
      return {
        state: proposeDeal(state, {
          type: dealData.type,
          counterpartyId: dealData.counterpartyId,
          counterpartyName: dealData.counterpartyName,
          value: dealData.value,
          terms: dealData.terms,
          expirationDate: new Date(dealData.expirationDate),
          notes: [],
        })
      }
    }

    case 'HIRE_EMPLOYEES': {
      const { count } = data as { count: number }
      return { state: hireEmployees(state, count) }
    }

    case 'LOG_DECISION': {
      const { decision, reasoning, expectedOutcome, priority } = data as {
        decision: string
        reasoning: string
        expectedOutcome: string
        priority: string
      }
      
      return {
        state: addLogEntry(state, {
          agent,
          action: `Decision: ${decision}`,
          details: `Reasoning: ${reasoning}. Expected: ${expectedOutcome}. Priority: ${priority}`,
        })
      }
    }

    case 'SKIP_TURN': {
      const { reason } = data as { reason: string }
      return {
        state: addLogEntry(state, {
          agent,
          action: 'No Action',
          details: reason,
        })
      }
    }

    default:
      return { state }
  }
}

// Run all agents in sequence
export async function runSimulationTick(
  state: SimulationState,
  model: string = 'openai/gpt-4o-mini'
): Promise<{
  results: AgentRunResult[]
  finalState: SimulationState
}> {
  const agents: AgentRole[] = ['analyst', 'cfo', 'dealmaker', 'ceo']
  const results: AgentRunResult[] = []
  let currentState = state

  for (const agent of agents) {
    const result = await runAgent(currentState, agent, model)
    results.push(result)
    currentState = result.newState
  }

  return { results, finalState: currentState }
}
