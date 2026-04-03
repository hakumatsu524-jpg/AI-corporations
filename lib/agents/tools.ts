// Tools that AI agents can use to control the company

import { tool } from 'ai'
import { z } from 'zod'

// Analysis Tools
export const analyzeMarketTool = tool({
  description: 'Analyze current market conditions and identify opportunities or risks',
  inputSchema: z.object({
    focusArea: z.enum(['real_estate', 'stocks', 'interest_rates', 'overall']).describe('Area to focus analysis on'),
  }),
  // Execute function will be provided by the simulation context
})

export const analyzeCompanyFinancials = tool({
  description: 'Analyze the company\'s current financial position including cash flow, assets, and investments',
  inputSchema: z.object({
    timeframe: z.enum(['current', 'monthly_trend', 'quarterly_trend']).describe('Timeframe for analysis'),
  }),
})

export const evaluateAsset = tool({
  description: 'Evaluate a specific asset or investment opportunity',
  inputSchema: z.object({
    assetType: z.enum(['property', 'stock', 'bond']).describe('Type of asset to evaluate'),
    assetId: z.string().nullable().describe('ID of existing asset, or null for new opportunity'),
    proposedValue: z.number().nullable().describe('Proposed purchase price for new assets'),
  }),
})

// Real Estate Tools
export const searchProperties = tool({
  description: 'Search for available properties on the market to potentially acquire',
  inputSchema: z.object({
    propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']).describe('Type of property to search for'),
    maxPrice: z.number().describe('Maximum purchase price'),
    minExpectedYield: z.number().describe('Minimum expected annual yield percentage'),
  }),
})

export const purchasePropertyTool = tool({
  description: 'Purchase a property from the market',
  inputSchema: z.object({
    propertyName: z.string().describe('Name/identifier of the property'),
    address: z.string().describe('Property address'),
    propertyType: z.enum(['residential', 'commercial', 'industrial', 'land']),
    price: z.number().describe('Purchase price'),
    squareFeet: z.number().describe('Property size in square feet'),
    expectedMonthlyRent: z.number().describe('Expected monthly rental income'),
  }),
})

export const sellAssetTool = tool({
  description: 'Sell an existing asset or property',
  inputSchema: z.object({
    assetId: z.string().describe('ID of the asset to sell'),
    minimumPrice: z.number().nullable().describe('Minimum acceptable price, or null for market price'),
  }),
})

export const setPropertyRent = tool({
  description: 'Adjust the rental price for a property',
  inputSchema: z.object({
    propertyId: z.string().describe('ID of the property'),
    newMonthlyRent: z.number().describe('New monthly rent amount'),
  }),
})

// Investment Tools
export const buyStockTool = tool({
  description: 'Purchase stocks or other securities',
  inputSchema: z.object({
    symbol: z.string().describe('Stock symbol (e.g., AAPL, GOOGL)'),
    shares: z.number().describe('Number of shares to purchase'),
    maxPricePerShare: z.number().describe('Maximum price per share willing to pay'),
  }),
})

export const sellStockTool = tool({
  description: 'Sell existing stock holdings',
  inputSchema: z.object({
    investmentId: z.string().describe('ID of the investment to sell'),
    shares: z.number().describe('Number of shares to sell'),
    minPricePerShare: z.number().nullable().describe('Minimum acceptable price per share'),
  }),
})

export const buyBondsTool = tool({
  description: 'Purchase bonds for stable income',
  inputSchema: z.object({
    bondType: z.enum(['treasury', 'corporate', 'municipal']).describe('Type of bond'),
    amount: z.number().describe('Amount to invest in bonds'),
    expectedYield: z.number().describe('Expected annual yield percentage'),
  }),
})

// Deal Making Tools
export const searchPartners = tool({
  description: 'Search for potential business partners or companies to make deals with',
  inputSchema: z.object({
    industry: z.enum(['finance', 'real_estate', 'tech', 'retail', 'manufacturing', 'any']).describe('Industry to search in'),
    dealType: z.enum(['partnership', 'acquisition', 'sale', 'merger']).describe('Type of deal looking for'),
    minNetWorth: z.number().nullable().describe('Minimum net worth of potential partners'),
  }),
})

export const proposeDealTool = tool({
  description: 'Propose a deal to another company',
  inputSchema: z.object({
    counterpartyId: z.string().describe('ID of the company to propose deal to'),
    dealType: z.enum(['partnership', 'acquisition', 'sale', 'loan', 'merger']),
    proposedValue: z.number().describe('Proposed deal value'),
    terms: z.string().describe('Terms and conditions of the deal'),
  }),
})

export const negotiateDealTool = tool({
  description: 'Negotiate an existing deal',
  inputSchema: z.object({
    dealId: z.string().describe('ID of the deal to negotiate'),
    counterOffer: z.number().nullable().describe('Counter offer amount, or null to accept current terms'),
    newTerms: z.string().nullable().describe('New proposed terms, or null to keep current'),
  }),
})

export const respondToDealTool = tool({
  description: 'Accept or reject a deal proposal',
  inputSchema: z.object({
    dealId: z.string().describe('ID of the deal'),
    response: z.enum(['accept', 'reject', 'counter']).describe('Response to the deal'),
    counterValue: z.number().nullable().describe('Counter value if responding with counter'),
  }),
})

// Operations Tools
export const hireEmployeesTool = tool({
  description: 'Hire new employees to grow the company',
  inputSchema: z.object({
    count: z.number().describe('Number of employees to hire'),
    department: z.enum(['operations', 'sales', 'finance', 'management']).describe('Department to hire for'),
  }),
})

export const adjustOperations = tool({
  description: 'Adjust company operations to optimize costs or revenue',
  inputSchema: z.object({
    action: z.enum(['cut_costs', 'increase_marketing', 'expand_operations', 'streamline']),
    intensity: z.enum(['light', 'moderate', 'aggressive']).describe('How aggressively to implement the action'),
  }),
})

// Strategic Planning Tools
export const setCompanyStrategy = tool({
  description: 'Set the overall company strategy for the coming period',
  inputSchema: z.object({
    primaryFocus: z.enum(['growth', 'stability', 'profit_maximization', 'market_expansion', 'diversification']),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    targetMetrics: z.object({
      targetCashReserve: z.number().describe('Target cash reserve to maintain'),
      targetPropertyCount: z.number().describe('Target number of properties'),
      targetMonthlyRevenue: z.number().describe('Target monthly revenue'),
    }),
  }),
})

export const requestAnalysis = tool({
  description: 'Request detailed analysis from the analyst agent',
  inputSchema: z.object({
    analysisType: z.enum(['market_opportunity', 'risk_assessment', 'competitor_analysis', 'financial_health']),
    specificQuestion: z.string().describe('Specific question or area to analyze'),
  }),
})

// Reporting Tools (used at end of agent turn)
export const reportDecision = tool({
  description: 'Report a decision and its reasoning to the company log',
  inputSchema: z.object({
    decision: z.string().describe('The decision that was made'),
    reasoning: z.string().describe('Reasoning behind the decision'),
    expectedOutcome: z.string().describe('Expected outcome of the decision'),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  }),
})

export const skipTurn = tool({
  description: 'Decide to take no action this turn and explain why',
  inputSchema: z.object({
    reason: z.string().describe('Reason for not taking action'),
  }),
})
