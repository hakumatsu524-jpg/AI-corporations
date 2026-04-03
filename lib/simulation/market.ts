// Market simulation engine - generates realistic market conditions

import type { MarketConditions, MarketEvent, ExternalCompany } from './types'

const NEWS_EVENTS = [
  { title: 'Fed Raises Interest Rates', impact: { interest: 0.25, stocks: -5, realEstate: -3 } },
  { title: 'Fed Cuts Interest Rates', impact: { interest: -0.25, stocks: 8, realEstate: 5 } },
  { title: 'Strong Jobs Report', impact: { stocks: 3, sentiment: 10 } },
  { title: 'Weak Jobs Report', impact: { stocks: -4, sentiment: -15 } },
  { title: 'Housing Demand Surges', impact: { realEstate: 10, sentiment: 5 } },
  { title: 'Commercial Real Estate Crisis', impact: { realEstate: -15, sentiment: -10 } },
  { title: 'Tech Sector Rally', impact: { stocks: 12, sentiment: 8 } },
  { title: 'Market Correction', impact: { stocks: -8, realEstate: -3, sentiment: -12 } },
  { title: 'New Tax Incentives for Investors', impact: { stocks: 5, realEstate: 7, sentiment: 10 } },
  { title: 'Regulatory Crackdown on Financial Sector', impact: { stocks: -6, sentiment: -8 } },
  { title: 'Infrastructure Bill Passed', impact: { realEstate: 8, sentiment: 12 } },
  { title: 'Inflation Exceeds Expectations', impact: { interest: 0.15, stocks: -4, sentiment: -10 } },
]

const COMPANY_NAMES = [
  'Meridian Capital Partners', 'Apex Real Estate Holdings', 'Sterling Investment Group',
  'Quantum Financial Services', 'Horizon Property Trust', 'Atlas Wealth Management',
  'Pinnacle Realty Corp', 'Venture Capital Associates', 'Global Asset Partners',
  'Summit Financial Holdings', 'Ironclad Investments', 'Pacific Rim Properties',
  'Cornerstone Capital', 'Titan Holdings LLC', 'Evergreen Asset Management',
]

export function createInitialMarket(): MarketConditions {
  return {
    timestamp: new Date(),
    realEstateIndex: 100,
    stockMarketIndex: 100,
    interestRate: 5.25,
    inflation: 3.2,
    economicSentiment: 'stable',
    events: [],
  }
}

export function generateExternalCompanies(count: number): ExternalCompany[] {
  const companies: ExternalCompany[] = []
  const industries: ExternalCompany['industry'][] = ['finance', 'real_estate', 'tech', 'retail', 'manufacturing']
  const sizes: ExternalCompany['size'][] = ['small', 'medium', 'large', 'enterprise']
  const personalities: ExternalCompany['personality'][] = ['aggressive', 'conservative', 'opportunistic', 'collaborative']

  for (let i = 0; i < count; i++) {
    const size = sizes[Math.floor(Math.random() * sizes.length)]
    const netWorthMultiplier = { small: 1, medium: 5, large: 20, enterprise: 100 }

    companies.push({
      id: `company_${i}`,
      name: COMPANY_NAMES[i % COMPANY_NAMES.length] + (i >= COMPANY_NAMES.length ? ` ${Math.floor(i / COMPANY_NAMES.length) + 1}` : ''),
      industry: industries[Math.floor(Math.random() * industries.length)],
      size,
      netWorth: (Math.random() * 50 + 10) * 1_000_000 * netWorthMultiplier[size],
      reputation: Math.floor(Math.random() * 40 + 50),
      openToDeals: Math.random() > 0.3,
      preferredDealTypes: ['partnership', 'acquisition', 'sale'].filter(() => Math.random() > 0.5) as ExternalCompany['preferredDealTypes'],
      personality: personalities[Math.floor(Math.random() * personalities.length)],
    })
  }

  return companies
}

export function simulateMarketTick(
  current: MarketConditions,
  volatility: 'low' | 'medium' | 'high'
): MarketConditions {
  const volatilityFactor = { low: 0.5, medium: 1, high: 2 }[volatility]

  // Random daily fluctuations
  const realEstateChange = (Math.random() - 0.5) * 2 * volatilityFactor
  const stockChange = (Math.random() - 0.5) * 4 * volatilityFactor

  // Maybe generate a new event (5% chance per tick)
  const newEvents = [...current.events.filter(e => {
    const daysSinceStart = (Date.now() - e.startDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceStart < e.duration
  })]

  if (Math.random() < 0.05) {
    const eventTemplate = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)]
    const newEvent: MarketEvent = {
      id: `event_${Date.now()}`,
      type: 'news',
      title: eventTemplate.title,
      description: `Market event: ${eventTemplate.title}`,
      impact: eventTemplate.impact,
      duration: Math.floor(Math.random() * 7 + 3),
      startDate: new Date(),
    }
    newEvents.push(newEvent)
  }

  // Calculate total impact from active events
  const totalImpact = newEvents.reduce((acc, event) => ({
    realEstate: (acc.realEstate || 0) + (event.impact.realEstate || 0) / 10,
    stocks: (acc.stocks || 0) + (event.impact.stocks || 0) / 10,
    interest: (acc.interest || 0) + (event.impact.interest || 0) / 30,
    sentiment: (acc.sentiment || 0) + (event.impact.sentiment || 0),
  }), { realEstate: 0, stocks: 0, interest: 0, sentiment: 0 })

  // Update indices with bounds
  const newRealEstateIndex = Math.max(50, Math.min(200, 
    current.realEstateIndex + realEstateChange + totalImpact.realEstate
  ))
  const newStockIndex = Math.max(50, Math.min(200,
    current.stockMarketIndex + stockChange + totalImpact.stocks
  ))
  const newInterestRate = Math.max(0, Math.min(15,
    current.interestRate + totalImpact.interest
  ))

  // Determine economic sentiment
  const avgIndex = (newRealEstateIndex + newStockIndex) / 2
  let sentiment: MarketConditions['economicSentiment'] = 'stable'
  if (avgIndex > 130) sentiment = 'boom'
  else if (avgIndex > 110) sentiment = 'growth'
  else if (avgIndex < 70) sentiment = 'depression'
  else if (avgIndex < 85) sentiment = 'recession'

  return {
    timestamp: new Date(),
    realEstateIndex: newRealEstateIndex,
    stockMarketIndex: newStockIndex,
    interestRate: newInterestRate,
    inflation: Math.max(0, Math.min(15, current.inflation + (Math.random() - 0.5) * 0.1)),
    economicSentiment: sentiment,
    events: newEvents,
  }
}

export function getMarketOpportunities(market: MarketConditions): string[] {
  const opportunities: string[] = []

  if (market.realEstateIndex < 85) {
    opportunities.push('Real estate prices are low - good buying opportunity')
  }
  if (market.realEstateIndex > 120) {
    opportunities.push('Real estate prices are high - consider selling properties')
  }
  if (market.stockMarketIndex < 85) {
    opportunities.push('Stock market is down - potential buying opportunity')
  }
  if (market.interestRate < 3) {
    opportunities.push('Low interest rates - favorable for borrowing')
  }
  if (market.interestRate > 7) {
    opportunities.push('High interest rates - bonds may be attractive')
  }

  return opportunities
}

export function evaluateDealFairness(
  deal: { value: number; type: string },
  market: MarketConditions,
  counterparty: ExternalCompany
): { fairnessScore: number; recommendation: string } {
  let score = 50 // Base score

  // Adjust based on market conditions
  if (deal.type === 'acquisition' && market.economicSentiment === 'recession') {
    score += 15 // Good time to acquire
  }
  if (deal.type === 'sale' && market.economicSentiment === 'boom') {
    score += 15 // Good time to sell
  }

  // Adjust based on counterparty
  if (counterparty.reputation > 70) score += 10
  if (counterparty.personality === 'collaborative') score += 5
  if (counterparty.personality === 'aggressive') score -= 5

  return {
    fairnessScore: Math.min(100, Math.max(0, score)),
    recommendation: score > 65 ? 'Favorable deal' : score > 40 ? 'Acceptable deal' : 'Unfavorable deal',
  }
}
