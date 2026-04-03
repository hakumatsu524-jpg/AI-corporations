// Core simulation types for the AI-controlled company

export interface Company {
  id: string
  name: string
  cash: number
  assets: Asset[]
  investments: Investment[]
  deals: Deal[]
  reputation: number // 0-100
  employees: number
  monthlyExpenses: number
  monthlyRevenue: number
  foundedDate: Date
  lastUpdated: Date
}

export interface Asset {
  id: string
  type: 'property' | 'stock' | 'bond' | 'equipment' | 'intellectual_property'
  name: string
  purchasePrice: number
  currentValue: number
  purchaseDate: Date
  monthlyIncome?: number
  monthlyExpense?: number
  metadata: Record<string, unknown>
}

export interface Property extends Asset {
  type: 'property'
  address: string
  propertyType: 'residential' | 'commercial' | 'industrial' | 'land'
  squareFeet: number
  occupancyRate: number
  tenants: Tenant[]
}

export interface Tenant {
  id: string
  name: string
  monthlyRent: number
  leaseEndDate: Date
  paymentReliability: number // 0-100
}

export interface Investment {
  id: string
  type: 'stock' | 'bond' | 'mutual_fund' | 'crypto' | 'private_equity'
  symbol: string
  shares: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: Date
  dividendYield?: number
}

export interface Deal {
  id: string
  type: 'acquisition' | 'partnership' | 'sale' | 'loan' | 'merger'
  status: 'proposed' | 'negotiating' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  counterpartyId: string
  counterpartyName: string
  value: number
  terms: string
  proposedDate: Date
  expirationDate: Date
  notes: string[]
}

export interface MarketConditions {
  timestamp: Date
  realEstateIndex: number // 0-200 (100 = normal)
  stockMarketIndex: number // 0-200
  interestRate: number // percentage
  inflation: number // percentage
  economicSentiment: 'boom' | 'growth' | 'stable' | 'recession' | 'depression'
  events: MarketEvent[]
}

export interface MarketEvent {
  id: string
  type: 'news' | 'regulation' | 'disaster' | 'opportunity' | 'trend'
  title: string
  description: string
  impact: {
    realEstate?: number // -50 to +50
    stocks?: number
    interest?: number
    sentiment?: number
  }
  duration: number // in simulation days
  startDate: Date
}

export interface ExternalCompany {
  id: string
  name: string
  industry: 'finance' | 'real_estate' | 'tech' | 'retail' | 'manufacturing'
  size: 'small' | 'medium' | 'large' | 'enterprise'
  netWorth: number
  reputation: number
  openToDeals: boolean
  preferredDealTypes: Deal['type'][]
  personality: 'aggressive' | 'conservative' | 'opportunistic' | 'collaborative'
}

export interface SimulationState {
  currentDate: Date
  simulationSpeed: number // days per tick
  isRunning: boolean
  company: Company
  market: MarketConditions
  externalCompanies: ExternalCompany[]
  actionLog: ActionLogEntry[]
  financialHistory: FinancialSnapshot[]
}

export interface ActionLogEntry {
  id: string
  timestamp: Date
  agent: 'ceo' | 'cfo' | 'dealmaker' | 'analyst' | 'system'
  action: string
  details: string
  impact?: {
    cashChange?: number
    reputationChange?: number
    assetsChanged?: string[]
  }
}

export interface FinancialSnapshot {
  date: Date
  cash: number
  totalAssetValue: number
  totalLiabilities: number
  netWorth: number
  monthlyRevenue: number
  monthlyExpenses: number
  profitMargin: number
}

export interface AgentDecision {
  agent: 'ceo' | 'cfo' | 'dealmaker' | 'analyst'
  action: string
  reasoning: string
  parameters: Record<string, unknown>
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedImpact: {
    cashChange?: number
    riskLevel?: number
    timeToComplete?: number
  }
}

export interface SimulationConfig {
  companyName: string
  startingCash: number
  simulationSpeedMs: number
  maxAgentActionsPerTick: number
  enableExternalDeals: boolean
  marketVolatility: 'low' | 'medium' | 'high'
}
