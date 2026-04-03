// Core simulation engine - orchestrates the entire company simulation

import type {
  SimulationState,
  SimulationConfig,
  Company,
  ActionLogEntry,
  FinancialSnapshot,
  Asset,
  Property,
  Investment,
  Deal,
} from './types'
import { createInitialMarket, generateExternalCompanies, simulateMarketTick } from './market'

export function createInitialState(config: SimulationConfig): SimulationState {
  const now = new Date()

  const company: Company = {
    id: 'player_company',
    name: config.companyName,
    cash: config.startingCash,
    assets: [],
    investments: [],
    deals: [],
    reputation: 50,
    employees: 5,
    monthlyExpenses: 25000, // Base operating costs
    monthlyRevenue: 0,
    foundedDate: now,
    lastUpdated: now,
  }

  return {
    currentDate: now,
    simulationSpeed: 1,
    isRunning: false,
    company,
    market: createInitialMarket(),
    externalCompanies: generateExternalCompanies(15),
    actionLog: [{
      id: 'init',
      timestamp: now,
      agent: 'system',
      action: 'Company Founded',
      details: `${config.companyName} has been established with $${config.startingCash.toLocaleString()} in starting capital.`,
    }],
    financialHistory: [{
      date: now,
      cash: config.startingCash,
      totalAssetValue: 0,
      totalLiabilities: 0,
      netWorth: config.startingCash,
      monthlyRevenue: 0,
      monthlyExpenses: 25000,
      profitMargin: 0,
    }],
  }
}

export function advanceSimulation(
  state: SimulationState,
  config: SimulationConfig,
  daysToAdvance: number = 1
): SimulationState {
  let newState = { ...state }

  for (let i = 0; i < daysToAdvance; i++) {
    // Advance date
    const newDate = new Date(newState.currentDate)
    newDate.setDate(newDate.getDate() + 1)
    newState.currentDate = newDate

    // Update market conditions
    newState.market = simulateMarketTick(newState.market, config.marketVolatility)

    // Update asset values based on market
    newState.company = updateAssetValues(newState.company, newState.market)

    // Process monthly financials on the 1st of each month
    if (newDate.getDate() === 1) {
      newState = processMonthlyFinancials(newState)
    }

    // Update external companies (simulate their activity)
    newState.externalCompanies = simulateExternalCompanies(newState.externalCompanies, newState.market)

    // Check and update deals
    newState = updateDeals(newState)
  }

  return newState
}

function updateAssetValues(company: Company, market: { realEstateIndex: number; stockMarketIndex: number }): Company {
  const realEstateMultiplier = market.realEstateIndex / 100
  const stockMultiplier = market.stockMarketIndex / 100

  const updatedAssets = company.assets.map(asset => {
    if (asset.type === 'property') {
      const volatility = (Math.random() - 0.5) * 0.02
      return {
        ...asset,
        currentValue: asset.purchasePrice * realEstateMultiplier * (1 + volatility),
      }
    }
    return asset
  })

  const updatedInvestments = company.investments.map(inv => {
    const volatility = (Math.random() - 0.5) * 0.03
    const baseMultiplier = inv.type === 'stock' ? stockMultiplier : 1
    return {
      ...inv,
      currentPrice: inv.purchasePrice * baseMultiplier * (1 + volatility),
    }
  })

  return {
    ...company,
    assets: updatedAssets,
    investments: updatedInvestments,
    lastUpdated: new Date(),
  }
}

function processMonthlyFinancials(state: SimulationState): SimulationState {
  const company = state.company

  // Calculate income from properties
  const propertyIncome = company.assets
    .filter((a): a is Property => a.type === 'property')
    .reduce((sum, prop) => {
      const rentIncome = prop.tenants.reduce((t, tenant) => t + tenant.monthlyRent, 0)
      return sum + rentIncome * prop.occupancyRate
    }, 0)

  // Calculate dividend income
  const dividendIncome = company.investments.reduce((sum, inv) => {
    if (inv.dividendYield) {
      return sum + (inv.currentPrice * inv.shares * inv.dividendYield / 12)
    }
    return sum
  }, 0)

  const totalRevenue = propertyIncome + dividendIncome
  const totalExpenses = company.monthlyExpenses + (company.employees * 5000) // $5k per employee

  const netIncome = totalRevenue - totalExpenses
  const newCash = company.cash + netIncome

  // Create financial snapshot
  const totalAssetValue = company.assets.reduce((sum, a) => sum + a.currentValue, 0) +
    company.investments.reduce((sum, i) => sum + (i.currentPrice * i.shares), 0)

  const snapshot: FinancialSnapshot = {
    date: state.currentDate,
    cash: newCash,
    totalAssetValue,
    totalLiabilities: 0,
    netWorth: newCash + totalAssetValue,
    monthlyRevenue: totalRevenue,
    monthlyExpenses: totalExpenses,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  }

  // Log the monthly report
  const logEntry: ActionLogEntry = {
    id: `monthly_${state.currentDate.toISOString()}`,
    timestamp: state.currentDate,
    agent: 'system',
    action: 'Monthly Financial Report',
    details: `Revenue: $${totalRevenue.toLocaleString()} | Expenses: $${totalExpenses.toLocaleString()} | Net: $${netIncome.toLocaleString()}`,
    impact: { cashChange: netIncome },
  }

  return {
    ...state,
    company: {
      ...company,
      cash: newCash,
      monthlyRevenue: totalRevenue,
      monthlyExpenses: totalExpenses,
    },
    actionLog: [...state.actionLog, logEntry],
    financialHistory: [...state.financialHistory, snapshot],
  }
}

function simulateExternalCompanies(
  companies: SimulationState['externalCompanies'],
  market: SimulationState['market']
): SimulationState['externalCompanies'] {
  return companies.map(company => {
    // Simulate company growth/decline based on market
    const marketFactor = (market.stockMarketIndex + market.realEstateIndex) / 200
    const growth = (Math.random() - 0.45) * 0.02 * marketFactor

    return {
      ...company,
      netWorth: company.netWorth * (1 + growth),
      reputation: Math.max(20, Math.min(95, company.reputation + (Math.random() - 0.5) * 2)),
      openToDeals: Math.random() > 0.2,
    }
  })
}

function updateDeals(state: SimulationState): SimulationState {
  const now = state.currentDate
  const updatedDeals = state.company.deals.map(deal => {
    if (deal.status === 'proposed' || deal.status === 'negotiating') {
      if (new Date(deal.expirationDate) < now) {
        return { ...deal, status: 'cancelled' as const }
      }
    }
    return deal
  })

  return {
    ...state,
    company: {
      ...state.company,
      deals: updatedDeals,
    },
  }
}

// Action functions that agents can call

export function purchaseProperty(
  state: SimulationState,
  property: Omit<Property, 'id' | 'purchaseDate' | 'currentValue'>
): SimulationState {
  if (state.company.cash < property.purchasePrice) {
    return state // Cannot afford
  }

  const newProperty: Property = {
    ...property,
    id: `property_${Date.now()}`,
    purchaseDate: state.currentDate,
    currentValue: property.purchasePrice,
  }

  const logEntry: ActionLogEntry = {
    id: `buy_property_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'cfo',
    action: 'Property Purchased',
    details: `Acquired ${property.name} at ${property.address} for $${property.purchasePrice.toLocaleString()}`,
    impact: { cashChange: -property.purchasePrice, assetsChanged: [newProperty.id] },
  }

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash - property.purchasePrice,
      assets: [...state.company.assets, newProperty],
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

export function sellAsset(state: SimulationState, assetId: string): SimulationState {
  const asset = state.company.assets.find(a => a.id === assetId)
  if (!asset) return state

  const logEntry: ActionLogEntry = {
    id: `sell_asset_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'cfo',
    action: 'Asset Sold',
    details: `Sold ${asset.name} for $${asset.currentValue.toLocaleString()} (purchased for $${asset.purchasePrice.toLocaleString()})`,
    impact: { cashChange: asset.currentValue, assetsChanged: [assetId] },
  }

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash + asset.currentValue,
      assets: state.company.assets.filter(a => a.id !== assetId),
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

export function makeInvestment(
  state: SimulationState,
  investment: Omit<Investment, 'id' | 'purchaseDate' | 'currentPrice'>
): SimulationState {
  const totalCost = investment.purchasePrice * investment.shares
  if (state.company.cash < totalCost) {
    return state
  }

  const newInvestment: Investment = {
    ...investment,
    id: `investment_${Date.now()}`,
    purchaseDate: state.currentDate,
    currentPrice: investment.purchasePrice,
  }

  const logEntry: ActionLogEntry = {
    id: `invest_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'cfo',
    action: 'Investment Made',
    details: `Purchased ${investment.shares} shares of ${investment.symbol} at $${investment.purchasePrice.toFixed(2)} each`,
    impact: { cashChange: -totalCost },
  }

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash - totalCost,
      investments: [...state.company.investments, newInvestment],
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

export function proposeDeal(
  state: SimulationState,
  deal: Omit<Deal, 'id' | 'proposedDate' | 'status'>
): SimulationState {
  const newDeal: Deal = {
    ...deal,
    id: `deal_${Date.now()}`,
    proposedDate: state.currentDate,
    status: 'proposed',
  }

  const logEntry: ActionLogEntry = {
    id: `propose_deal_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'dealmaker',
    action: 'Deal Proposed',
    details: `Proposed ${deal.type} deal with ${deal.counterpartyName} valued at $${deal.value.toLocaleString()}`,
  }

  return {
    ...state,
    company: {
      ...state.company,
      deals: [...state.company.deals, newDeal],
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

export function hireEmployees(state: SimulationState, count: number): SimulationState {
  const hiringCost = count * 10000 // $10k hiring cost per employee

  if (state.company.cash < hiringCost) {
    return state
  }

  const logEntry: ActionLogEntry = {
    id: `hire_${Date.now()}`,
    timestamp: state.currentDate,
    agent: 'ceo',
    action: 'Employees Hired',
    details: `Hired ${count} new employee(s). Hiring cost: $${hiringCost.toLocaleString()}`,
    impact: { cashChange: -hiringCost },
  }

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash - hiringCost,
      employees: state.company.employees + count,
    },
    actionLog: [...state.actionLog, logEntry],
  }
}

export function addLogEntry(state: SimulationState, entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): SimulationState {
  return {
    ...state,
    actionLog: [
      ...state.actionLog,
      {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: state.currentDate,
      },
    ],
  }
}
