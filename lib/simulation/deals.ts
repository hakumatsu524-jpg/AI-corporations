// Deal negotiation and processing system

import type { SimulationState, Deal, ExternalCompany, ActionLogEntry } from './types'

export interface NegotiationResult {
  dealId: string
  status: 'accepted' | 'rejected' | 'counter' | 'expired'
  counterOffer?: number
  message: string
}

// Simulate counterparty response to a deal
export function simulateCounterpartyResponse(
  deal: Deal,
  counterparty: ExternalCompany,
  ourCompanyReputation: number
): NegotiationResult {
  // Factors affecting acceptance
  let acceptanceScore = 50

  // Reputation factor
  if (ourCompanyReputation > 70) acceptanceScore += 15
  else if (ourCompanyReputation < 40) acceptanceScore -= 20

  // Counterparty personality
  switch (counterparty.personality) {
    case 'collaborative':
      acceptanceScore += 20
      break
    case 'opportunistic':
      acceptanceScore += deal.value < counterparty.netWorth * 0.1 ? 15 : -10
      break
    case 'aggressive':
      acceptanceScore -= 10
      break
    case 'conservative':
      acceptanceScore += deal.type === 'partnership' ? 10 : -15
      break
  }

  // Deal type preference
  if (counterparty.preferredDealTypes.includes(deal.type)) {
    acceptanceScore += 15
  }

  // Size appropriateness
  const dealSizeRatio = deal.value / counterparty.netWorth
  if (dealSizeRatio > 0.5) acceptanceScore -= 30 // Too big relative to their size
  if (dealSizeRatio < 0.01) acceptanceScore -= 10 // Too small to care

  // Roll the dice
  const roll = Math.random() * 100

  if (roll < acceptanceScore * 0.7) {
    return {
      dealId: deal.id,
      status: 'accepted',
      message: `${counterparty.name} has accepted the ${deal.type} deal.`,
    }
  } else if (roll < acceptanceScore) {
    // Counter offer
    const counterMultiplier = counterparty.personality === 'aggressive' ? 1.3 : 1.15
    return {
      dealId: deal.id,
      status: 'counter',
      counterOffer: Math.round(deal.value * counterMultiplier),
      message: `${counterparty.name} is interested but proposes a counter offer.`,
    }
  } else {
    return {
      dealId: deal.id,
      status: 'rejected',
      message: `${counterparty.name} has declined the ${deal.type} proposal.`,
    }
  }
}

// Process deal completion
export function completeDeal(
  state: SimulationState,
  dealId: string
): SimulationState {
  const deal = state.company.deals.find(d => d.id === dealId)
  if (!deal || deal.status !== 'accepted') return state

  let newState = { ...state }
  let cashChange = 0
  let reputationChange = 0

  switch (deal.type) {
    case 'acquisition':
      // We're acquiring something - pay out
      cashChange = -deal.value
      reputationChange = 5
      break

    case 'sale':
      // We're selling - receive payment
      cashChange = deal.value
      reputationChange = 2
      break

    case 'partnership':
      // Partnership - small upfront cost, ongoing benefits
      cashChange = -deal.value * 0.1
      reputationChange = 8
      break

    case 'loan':
      // Receiving a loan
      cashChange = deal.value
      reputationChange = -2
      break

    case 'merger':
      // Complex merger - handled separately
      cashChange = deal.value * 0.5
      reputationChange = 10
      break
  }

  // Update deal status
  const updatedDeals = state.company.deals.map(d =>
    d.id === dealId ? { ...d, status: 'completed' as const } : d
  )

  // Create log entry
  const logEntry: ActionLogEntry = {
    id: `deal_complete_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'dealmaker',
    action: 'Deal Completed',
    details: `Completed ${deal.type} deal with ${deal.counterpartyName} for $${deal.value.toLocaleString()}`,
    impact: {
      cashChange,
      reputationChange,
    },
  }

  return {
    ...newState,
    company: {
      ...state.company,
      cash: state.company.cash + cashChange,
      reputation: Math.max(0, Math.min(100, state.company.reputation + reputationChange)),
      deals: updatedDeals,
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

// Generate incoming deal proposals from external companies
export function generateIncomingDeals(
  state: SimulationState
): Deal[] {
  const incomingDeals: Deal[] = []

  // 10% chance per tick for an external company to propose a deal
  for (const company of state.externalCompanies) {
    if (!company.openToDeals) continue
    if (Math.random() > 0.1) continue

    const dealTypes = company.preferredDealTypes.length > 0 
      ? company.preferredDealTypes 
      : ['partnership', 'sale'] as Deal['type'][]

    const dealType = dealTypes[Math.floor(Math.random() * dealTypes.length)]

    // Calculate reasonable deal value
    let dealValue: number
    switch (dealType) {
      case 'acquisition':
        dealValue = state.company.cash * (0.1 + Math.random() * 0.3)
        break
      case 'partnership':
        dealValue = Math.min(company.netWorth, state.company.cash) * (0.05 + Math.random() * 0.1)
        break
      case 'sale':
        dealValue = company.netWorth * (0.01 + Math.random() * 0.05)
        break
      case 'loan':
        dealValue = state.company.cash * (0.2 + Math.random() * 0.5)
        break
      default:
        dealValue = (company.netWorth + state.company.cash) * 0.1 * Math.random()
    }

    const deal: Deal = {
      id: `incoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: dealType,
      status: 'proposed',
      counterpartyId: company.id,
      counterpartyName: company.name,
      value: Math.round(dealValue),
      terms: generateDealTerms(dealType, company),
      proposedDate: state.currentDate,
      expirationDate: new Date(state.currentDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
      notes: [`Proposed by ${company.name}`],
    }

    incomingDeals.push(deal)
  }

  return incomingDeals
}

function generateDealTerms(type: Deal['type'], company: ExternalCompany): string {
  const templates = {
    acquisition: [
      `${company.name} proposes to acquire assets with full payment at closing.`,
      `Strategic acquisition opportunity with phased payment over 12 months.`,
      `Cash deal with performance-based earnout clause.`,
    ],
    partnership: [
      `Joint venture proposal with ${company.name} for market expansion.`,
      `Revenue sharing partnership - 60/40 split based on contribution.`,
      `Technology partnership with cross-licensing agreement.`,
    ],
    sale: [
      `${company.name} offers to purchase select portfolio assets.`,
      `Bulk property acquisition proposal with competitive pricing.`,
      `Strategic asset sale with leaseback option.`,
    ],
    loan: [
      `Credit facility offer at competitive rates from ${company.name}.`,
      `Bridge financing available with flexible terms.`,
      `Growth capital loan with favorable repayment schedule.`,
    ],
    merger: [
      `${company.name} proposes merger of equals with shared governance.`,
      `Strategic merger to create industry-leading combined entity.`,
      `Stock-based merger proposal with premium valuation.`,
    ],
  }

  const options = templates[type]
  return options[Math.floor(Math.random() * options.length)]
}

// Calculate deal ROI potential
export function calculateDealPotential(
  deal: Deal,
  state: SimulationState
): {
  expectedROI: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
} {
  const counterparty = state.externalCompanies.find(c => c.id === deal.counterpartyId)

  let expectedROI = 0
  let riskScore = 50

  switch (deal.type) {
    case 'acquisition':
      expectedROI = 8 + Math.random() * 12 // 8-20% expected return
      riskScore = 60
      break
    case 'partnership':
      expectedROI = 5 + Math.random() * 10 // 5-15%
      riskScore = 40
      break
    case 'sale':
      expectedROI = (deal.value - deal.value * 0.9) / (deal.value * 0.9) * 100 // Based on profit margin
      riskScore = 30
      break
    case 'loan':
      expectedROI = -5 - Math.random() * 5 // Cost of capital
      riskScore = 70
      break
    case 'merger':
      expectedROI = 15 + Math.random() * 20
      riskScore = 80
      break
  }

  // Adjust for counterparty reputation
  if (counterparty) {
    if (counterparty.reputation > 70) {
      riskScore -= 15
      expectedROI *= 1.1
    } else if (counterparty.reputation < 40) {
      riskScore += 20
      expectedROI *= 0.8
    }
  }

  // Adjust for market conditions
  if (state.market.economicSentiment === 'recession') {
    riskScore += 15
  } else if (state.market.economicSentiment === 'boom') {
    riskScore -= 10
    expectedROI *= 1.2
  }

  const riskLevel = riskScore < 40 ? 'low' : riskScore < 65 ? 'medium' : 'high'

  let recommendation = ''
  if (expectedROI > 15 && riskLevel !== 'high') {
    recommendation = 'Strong opportunity - consider accepting'
  } else if (expectedROI > 10 && riskLevel === 'low') {
    recommendation = 'Solid deal with manageable risk'
  } else if (expectedROI < 5) {
    recommendation = 'Limited upside - negotiate better terms'
  } else {
    recommendation = 'Evaluate carefully against strategic priorities'
  }

  return {
    expectedROI: Math.round(expectedROI * 10) / 10,
    riskLevel,
    recommendation,
  }
}
