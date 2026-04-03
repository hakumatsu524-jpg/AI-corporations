// Utility functions for the simulation

import type { SimulationState, Company, FinancialSnapshot } from './types'

export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString()}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateNetWorth(company: Company): number {
  const assetValue = company.assets.reduce((sum, a) => sum + a.currentValue, 0)
  const investmentValue = company.investments.reduce(
    (sum, i) => sum + i.currentPrice * i.shares,
    0
  )
  return company.cash + assetValue + investmentValue
}

export function calculateGrowthRate(history: FinancialSnapshot[]): number {
  if (history.length < 2) return 0
  
  const oldest = history[0]
  const newest = history[history.length - 1]
  
  const months = Math.max(1, 
    (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (30 * 24 * 60 * 60 * 1000)
  )
  
  const totalGrowth = (newest.netWorth - oldest.netWorth) / oldest.netWorth
  const monthlyGrowth = totalGrowth / months
  const annualizedGrowth = monthlyGrowth * 12 * 100
  
  return Math.round(annualizedGrowth * 10) / 10
}

export function getCompanyHealth(state: SimulationState): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  score: number
  factors: Array<{ name: string; status: 'positive' | 'neutral' | 'negative'; detail: string }>
} {
  const company = state.company
  const netWorth = calculateNetWorth(company)
  
  const factors: Array<{ name: string; status: 'positive' | 'neutral' | 'negative'; detail: string }> = []
  let score = 50 // Base score

  // Cash reserves
  const cashRatio = company.cash / netWorth
  if (cashRatio > 0.3) {
    score += 10
    factors.push({ name: 'Cash Reserves', status: 'positive', detail: 'Strong liquidity position' })
  } else if (cashRatio < 0.1) {
    score -= 15
    factors.push({ name: 'Cash Reserves', status: 'negative', detail: 'Low liquidity - risk of cash crunch' })
  } else {
    factors.push({ name: 'Cash Reserves', status: 'neutral', detail: 'Adequate cash position' })
  }

  // Profitability
  const netIncome = company.monthlyRevenue - company.monthlyExpenses
  if (netIncome > 0) {
    score += 15
    factors.push({ name: 'Profitability', status: 'positive', detail: `Profitable: ${formatCurrency(netIncome)}/month` })
  } else if (netIncome > -company.monthlyExpenses * 0.2) {
    score -= 5
    factors.push({ name: 'Profitability', status: 'neutral', detail: 'Near break-even' })
  } else {
    score -= 20
    factors.push({ name: 'Profitability', status: 'negative', detail: `Losing ${formatCurrency(Math.abs(netIncome))}/month` })
  }

  // Asset diversification
  const propertyCount = company.assets.filter(a => a.type === 'property').length
  const investmentCount = company.investments.length
  
  if (propertyCount > 0 && investmentCount > 0) {
    score += 10
    factors.push({ name: 'Diversification', status: 'positive', detail: 'Well-diversified portfolio' })
  } else if (propertyCount === 0 && investmentCount === 0) {
    score -= 10
    factors.push({ name: 'Diversification', status: 'negative', detail: 'No income-generating assets' })
  } else {
    factors.push({ name: 'Diversification', status: 'neutral', detail: 'Partially diversified' })
  }

  // Reputation
  if (company.reputation > 70) {
    score += 10
    factors.push({ name: 'Reputation', status: 'positive', detail: 'Excellent market standing' })
  } else if (company.reputation < 40) {
    score -= 10
    factors.push({ name: 'Reputation', status: 'negative', detail: 'Poor reputation hurting deals' })
  } else {
    factors.push({ name: 'Reputation', status: 'neutral', detail: 'Average market reputation' })
  }

  // Market conditions
  if (state.market.economicSentiment === 'boom' || state.market.economicSentiment === 'growth') {
    score += 5
    factors.push({ name: 'Market Conditions', status: 'positive', detail: 'Favorable economic environment' })
  } else if (state.market.economicSentiment === 'recession' || state.market.economicSentiment === 'depression') {
    score -= 10
    factors.push({ name: 'Market Conditions', status: 'negative', detail: 'Challenging economic environment' })
  } else {
    factors.push({ name: 'Market Conditions', status: 'neutral', detail: 'Stable market conditions' })
  }

  // Determine status
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  if (score >= 75) status = 'excellent'
  else if (score >= 55) status = 'good'
  else if (score >= 40) status = 'fair'
  else if (score >= 25) status = 'poor'
  else status = 'critical'

  return { status, score: Math.max(0, Math.min(100, score)), factors }
}

export function getAgentDisplayName(agent: string): string {
  const names: Record<string, string> = {
    ceo: 'CEO',
    cfo: 'CFO',
    dealmaker: 'Deal Maker',
    analyst: 'Market Analyst',
    system: 'System',
  }
  return names[agent] || agent
}

export function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    ceo: 'text-amber-500',
    cfo: 'text-emerald-500',
    dealmaker: 'text-blue-500',
    analyst: 'text-purple-500',
    system: 'text-muted-foreground',
  }
  return colors[agent] || 'text-foreground'
}

export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    boom: 'text-emerald-500',
    growth: 'text-green-500',
    stable: 'text-blue-500',
    recession: 'text-orange-500',
    depression: 'text-red-500',
  }
  return colors[sentiment] || 'text-foreground'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-emerald-500',
    good: 'text-green-500',
    fair: 'text-yellow-500',
    poor: 'text-orange-500',
    critical: 'text-red-500',
  }
  return colors[status] || 'text-foreground'
}
