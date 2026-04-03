// AI Agents that control different aspects of the company

import { tool } from 'ai'
import { z } from 'zod'
import type { SimulationState, Property, Investment, Deal, ExternalCompany, ActionLogEntry } from '../simulation/types'
import { getMarketOpportunities, evaluateDealFairness } from '../simulation/market'

// Tool implementations that work with simulation state
export function createAgentTools(state: SimulationState) {
  return {
    // Analysis Tools
    analyzeMarket: tool({
      description: 'Analyze current market conditions and identify opportunities or risks',
      inputSchema: z.object({
        focusArea: z.enum(['real_estate', 'stocks', 'interest_rates', 'overall']),
      }),
      execute: async ({ focusArea }) => {
        const market = state.market
        const opportunities = getMarketOpportunities(market)

        let analysis = ''
        switch (focusArea) {
          case 'real_estate':
            analysis = `Real Estate Index: ${market.realEstateIndex.toFixed(1)} (${market.realEstateIndex > 100 ? 'above' : 'below'} baseline). `
            analysis += market.realEstateIndex < 90 ? 'OPPORTUNITY: Prices are low.' : market.realEstateIndex > 110 ? 'CAUTION: Prices are elevated.' : 'Market is stable.'
            break
          case 'stocks':
            analysis = `Stock Market Index: ${market.stockMarketIndex.toFixed(1)}. `
            analysis += market.stockMarketIndex < 90 ? 'OPPORTUNITY: Market is down.' : market.stockMarketIndex > 115 ? 'CAUTION: Market may be overvalued.' : 'Healthy market conditions.'
            break
          case 'interest_rates':
            analysis = `Interest Rate: ${market.interestRate.toFixed(2)}%. `
            analysis += market.interestRate < 4 ? 'Low rates favor borrowing and real estate.' : market.interestRate > 7 ? 'High rates favor bonds and savings.' : 'Moderate rate environment.'
            break
          case 'overall':
            analysis = `Economic Sentiment: ${market.economicSentiment.toUpperCase()}. Real Estate: ${market.realEstateIndex.toFixed(1)}, Stocks: ${market.stockMarketIndex.toFixed(1)}, Interest: ${market.interestRate.toFixed(2)}%, Inflation: ${market.inflation.toFixed(1)}%`
            break
        }

        return {
          analysis,
          opportunities,
          activeEvents: market.events.map(e => e.title),
          recommendation: opportunities.length > 0 ? opportunities[0] : 'No immediate opportunities identified.',
        }
      },
    }),

    analyzeFinancials: tool({
      description: 'Analyze the company\'s current financial position',
      inputSchema: z.object({
        timeframe: z.enum(['current', 'monthly_trend', 'quarterly_trend']),
      }),
      execute: async ({ timeframe }) => {
        const company = state.company
        const totalAssetValue = company.assets.reduce((sum, a) => sum + a.currentValue, 0)
        const totalInvestmentValue = company.investments.reduce((sum, i) => sum + (i.currentPrice * i.shares), 0)
        const netWorth = company.cash + totalAssetValue + totalInvestmentValue

        const analysis = {
          cash: company.cash,
          totalAssetValue,
          totalInvestmentValue,
          netWorth,
          monthlyRevenue: company.monthlyRevenue,
          monthlyExpenses: company.monthlyExpenses,
          employees: company.employees,
          profitMargin: company.monthlyRevenue > 0 
            ? ((company.monthlyRevenue - company.monthlyExpenses) / company.monthlyRevenue * 100).toFixed(1) + '%'
            : 'N/A',
          propertyCount: company.assets.filter(a => a.type === 'property').length,
          investmentCount: company.investments.length,
          activeDeals: company.deals.filter(d => d.status === 'proposed' || d.status === 'negotiating').length,
        }

        let trend = 'stable'
        if (timeframe !== 'current' && state.financialHistory.length > 1) {
          const periods = timeframe === 'monthly_trend' ? 2 : 4
          const recent = state.financialHistory.slice(-periods)
          if (recent.length >= 2) {
            const growth = (recent[recent.length - 1].netWorth - recent[0].netWorth) / recent[0].netWorth * 100
            trend = growth > 5 ? 'growing' : growth < -5 ? 'declining' : 'stable'
          }
        }

        return { ...analysis, trend }
      },
    }),

    // Property Tools
    searchProperties: tool({
      description: 'Search for available properties to purchase',
      inputSchema: z.object({
        propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']),
        maxPrice: z.number(),
        minExpectedYield: z.number(),
      }),
      execute: async ({ propertyType, maxPrice, minExpectedYield }) => {
        // Generate realistic property listings based on market conditions
        const marketMultiplier = state.market.realEstateIndex / 100
        const properties = []

        const addresses = [
          '123 Main Street', '456 Oak Avenue', '789 Industrial Blvd',
          '321 Commerce Way', '555 Park Lane', '888 Business Park Dr'
        ]

        for (let i = 0; i < 3; i++) {
          const basePrice = (Math.random() * 0.8 + 0.2) * maxPrice * marketMultiplier
          const sqft = Math.floor(Math.random() * 50000 + 5000)
          const yield_ = (Math.random() * 8 + 4)

          if (basePrice <= maxPrice && yield_ >= minExpectedYield) {
            properties.push({
              name: `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} Property ${i + 1}`,
              address: addresses[Math.floor(Math.random() * addresses.length)] + `, City ${Math.floor(Math.random() * 100)}`,
              type: propertyType,
              price: Math.round(basePrice),
              squareFeet: sqft,
              expectedYield: yield_.toFixed(1) + '%',
              expectedMonthlyRent: Math.round(basePrice * (yield_ / 100) / 12),
              marketCondition: state.market.realEstateIndex > 100 ? 'seller\'s market' : 'buyer\'s market',
            })
          }
        }

        return {
          found: properties.length,
          properties,
          marketAdvice: state.market.realEstateIndex < 95 
            ? 'Good time to buy - prices below normal' 
            : state.market.realEstateIndex > 105 
            ? 'Consider waiting - prices above normal' 
            : 'Fair market conditions',
        }
      },
    }),

    purchaseProperty: tool({
      description: 'Purchase a property',
      inputSchema: z.object({
        propertyName: z.string(),
        address: z.string(),
        propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']),
        price: z.number(),
        squareFeet: z.number(),
        expectedMonthlyRent: z.number(),
      }),
      execute: async ({ propertyName, address, propertyType, price, squareFeet, expectedMonthlyRent }) => {
        if (state.company.cash < price) {
          return { success: false, error: `Insufficient funds. Have $${state.company.cash.toLocaleString()}, need $${price.toLocaleString()}` }
        }

        return {
          success: true,
          action: 'PURCHASE_PROPERTY',
          data: {
            name: propertyName,
            address,
            propertyType,
            purchasePrice: price,
            squareFeet,
            occupancyRate: 0,
            tenants: [],
            monthlyIncome: expectedMonthlyRent,
          },
          message: `Property purchase approved: ${propertyName} for $${price.toLocaleString()}`,
        }
      },
    }),

    sellAsset: tool({
      description: 'Sell an existing asset',
      inputSchema: z.object({
        assetId: z.string(),
        minimumPrice: z.number().nullable(),
      }),
      execute: async ({ assetId, minimumPrice }) => {
        const asset = state.company.assets.find(a => a.id === assetId)
        if (!asset) {
          return { success: false, error: 'Asset not found' }
        }

        const marketPrice = asset.currentValue
        if (minimumPrice && marketPrice < minimumPrice) {
          return { success: false, error: `Market price ($${marketPrice.toLocaleString()}) below minimum ($${minimumPrice.toLocaleString()})` }
        }

        return {
          success: true,
          action: 'SELL_ASSET',
          data: { assetId, salePrice: marketPrice },
          message: `Asset sale approved: ${asset.name} for $${marketPrice.toLocaleString()}`,
        }
      },
    }),

    // Investment Tools
    buyStock: tool({
      description: 'Purchase stocks',
      inputSchema: z.object({
        symbol: z.string(),
        shares: z.number(),
        maxPricePerShare: z.number(),
      }),
      execute: async ({ symbol, shares, maxPricePerShare }) => {
        // Simulate stock price based on market conditions
        const basePrice = maxPricePerShare * (0.8 + Math.random() * 0.3)
        const marketAdjustedPrice = basePrice * (state.market.stockMarketIndex / 100)
        const totalCost = marketAdjustedPrice * shares

        if (state.company.cash < totalCost) {
          return { success: false, error: `Insufficient funds. Need $${totalCost.toLocaleString()}` }
        }

        return {
          success: true,
          action: 'BUY_STOCK',
          data: {
            type: 'stock' as const,
            symbol,
            shares,
            purchasePrice: marketAdjustedPrice,
            dividendYield: Math.random() * 0.04,
          },
          message: `Stock purchase approved: ${shares} shares of ${symbol} at $${marketAdjustedPrice.toFixed(2)}/share`,
        }
      },
    }),

    sellStock: tool({
      description: 'Sell stock holdings',
      inputSchema: z.object({
        investmentId: z.string(),
        shares: z.number(),
        minPricePerShare: z.number().nullable(),
      }),
      execute: async ({ investmentId, shares, minPricePerShare }) => {
        const investment = state.company.investments.find(i => i.id === investmentId)
        if (!investment) {
          return { success: false, error: 'Investment not found' }
        }
        if (investment.shares < shares) {
          return { success: false, error: `Insufficient shares. Have ${investment.shares}, trying to sell ${shares}` }
        }

        if (minPricePerShare && investment.currentPrice < minPricePerShare) {
          return { success: false, error: `Current price ($${investment.currentPrice.toFixed(2)}) below minimum` }
        }

        return {
          success: true,
          action: 'SELL_STOCK',
          data: { investmentId, shares, salePrice: investment.currentPrice },
          message: `Stock sale approved: ${shares} shares at $${investment.currentPrice.toFixed(2)}/share`,
        }
      },
    }),

    // Deal Making Tools
    searchPartners: tool({
      description: 'Search for potential business partners',
      inputSchema: z.object({
        industry: z.enum(['finance', 'real_estate', 'tech', 'retail', 'manufacturing', 'any']),
        dealType: z.enum(['partnership', 'acquisition', 'sale', 'merger']),
        minNetWorth: z.number().nullable(),
      }),
      execute: async ({ industry, dealType, minNetWorth }) => {
        let companies = state.externalCompanies.filter(c => c.openToDeals)

        if (industry !== 'any') {
          companies = companies.filter(c => c.industry === industry)
        }
        if (minNetWorth) {
          companies = companies.filter(c => c.netWorth >= minNetWorth)
        }

        return {
          found: companies.length,
          companies: companies.slice(0, 5).map(c => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            size: c.size,
            netWorth: c.netWorth,
            reputation: c.reputation,
            personality: c.personality,
            preferredDeals: c.preferredDealTypes,
          })),
        }
      },
    }),

    proposeDeal: tool({
      description: 'Propose a deal to another company',
      inputSchema: z.object({
        counterpartyId: z.string(),
        dealType: z.enum(['partnership', 'acquisition', 'sale', 'loan', 'merger']),
        proposedValue: z.number(),
        terms: z.string(),
      }),
      execute: async ({ counterpartyId, dealType, proposedValue, terms }) => {
        const counterparty = state.externalCompanies.find(c => c.id === counterpartyId)
        if (!counterparty) {
          return { success: false, error: 'Company not found' }
        }
        if (!counterparty.openToDeals) {
          return { success: false, error: 'Company is not currently open to deals' }
        }

        const fairness = evaluateDealFairness(
          { value: proposedValue, type: dealType },
          state.market,
          counterparty
        )

        // Simulate counterparty response based on their personality
        let acceptChance = fairness.fairnessScore / 100
        if (counterparty.personality === 'aggressive') acceptChance *= 0.8
        if (counterparty.personality === 'collaborative') acceptChance *= 1.2
        if (counterparty.personality === 'conservative') acceptChance *= 0.9

        const response = Math.random() < acceptChance ? 'interested' : 'hesitant'

        return {
          success: true,
          action: 'PROPOSE_DEAL',
          data: {
            counterpartyId,
            counterpartyName: counterparty.name,
            type: dealType,
            value: proposedValue,
            terms,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          counterpartyResponse: response,
          fairnessScore: fairness.fairnessScore,
          recommendation: fairness.recommendation,
        }
      },
    }),

    // Operations
    hireEmployees: tool({
      description: 'Hire new employees',
      inputSchema: z.object({
        count: z.number(),
        department: z.enum(['operations', 'sales', 'finance', 'management']),
      }),
      execute: async ({ count, department }) => {
        const hiringCost = count * 10000
        if (state.company.cash < hiringCost) {
          return { success: false, error: `Insufficient funds for hiring. Need $${hiringCost.toLocaleString()}` }
        }

        return {
          success: true,
          action: 'HIRE_EMPLOYEES',
          data: { count, department },
          message: `Hiring approved: ${count} employees for ${department}. Cost: $${hiringCost.toLocaleString()}`,
        }
      },
    }),

    // Reporting
    reportDecision: tool({
      description: 'Report a decision to the company log',
      inputSchema: z.object({
        decision: z.string(),
        reasoning: z.string(),
        expectedOutcome: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
      }),
      execute: async ({ decision, reasoning, expectedOutcome, priority }) => {
        return {
          success: true,
          action: 'LOG_DECISION',
          data: { decision, reasoning, expectedOutcome, priority },
        }
      },
    }),

    skipTurn: tool({
      description: 'Decide to take no action this turn',
      inputSchema: z.object({
        reason: z.string(),
      }),
      execute: async ({ reason }) => {
        return {
          success: true,
          action: 'SKIP_TURN',
          reason,
        }
      },
    }),

    // Get current company assets
    listAssets: tool({
      description: 'List all company assets and investments',
      inputSchema: z.object({}),
      execute: async () => {
        return {
          assets: state.company.assets.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            purchasePrice: a.purchasePrice,
            currentValue: a.currentValue,
            gain: ((a.currentValue - a.purchasePrice) / a.purchasePrice * 100).toFixed(1) + '%',
          })),
          investments: state.company.investments.map(i => ({
            id: i.id,
            symbol: i.symbol,
            type: i.type,
            shares: i.shares,
            purchasePrice: i.purchasePrice,
            currentPrice: i.currentPrice,
            totalValue: i.shares * i.currentPrice,
            gain: ((i.currentPrice - i.purchasePrice) / i.purchasePrice * 100).toFixed(1) + '%',
          })),
          activeDeals: state.company.deals.filter(d => ['proposed', 'negotiating'].includes(d.status)).map(d => ({
            id: d.id,
            type: d.type,
            counterparty: d.counterpartyName,
            value: d.value,
            status: d.status,
          })),
        }
      },
    }),
  }
}

// Agent system prompts
export const AGENT_PROMPTS = {
  ceo: `You are the CEO of a finance and real estate investment company. Your role is to:
- Set overall company strategy and direction
- Make high-level decisions about company growth
- Approve major acquisitions and deals
- Manage company reputation and relationships
- Balance risk and growth opportunities

Current priorities:
1. Maintain healthy cash reserves (at least 20% of net worth)
2. Grow the company's asset base strategically
3. Pursue profitable partnerships and deals
4. Keep employees and operations efficient

You have access to tools to analyze the market, company financials, and make decisions. Always explain your reasoning clearly.`,

  cfo: `You are the CFO of a finance and real estate investment company. Your role is to:
- Manage company finances and cash flow
- Make investment decisions (stocks, bonds, properties)
- Optimize the company's portfolio for returns
- Monitor and manage financial risks
- Ensure profitability and sustainable growth

Guidelines:
1. Never invest more than 30% of cash in a single asset
2. Maintain diversification across asset types
3. Consider market conditions when timing purchases/sales
4. Track ROI and adjust strategy based on performance

Analyze before acting. Use data to justify decisions.`,

  dealmaker: `You are the Deal Maker / Business Development lead. Your role is to:
- Find and evaluate partnership opportunities
- Negotiate deals with other companies
- Identify acquisition targets
- Structure deals that benefit the company
- Build relationships with potential partners

Strategy:
1. Look for companies with complementary strengths
2. Evaluate deals based on strategic fit and value
3. Consider counterparty reputation and reliability
4. Negotiate terms that protect company interests

Be opportunistic but prudent. Not every deal is a good deal.`,

  analyst: `You are the Market Analyst. Your role is to:
- Monitor market conditions continuously
- Identify trends and opportunities
- Assess risks in current positions
- Provide data-driven recommendations
- Track competitor activity

Focus areas:
1. Real estate market cycles and pricing
2. Stock market trends and sectors
3. Interest rate impact on investments
4. Economic indicators and sentiment

Provide clear, actionable insights based on current data.`,
}

export type AgentRole = keyof typeof AGENT_PROMPTS
