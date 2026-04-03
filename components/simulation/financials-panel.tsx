'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SimulationState } from '@/lib/simulation/types'
import { formatCurrency, calculateNetWorth, calculateGrowthRate } from '@/lib/simulation/utils'
import { TrendingUp, TrendingDown, Minus, DollarSign, Building2, BarChart3, Users } from 'lucide-react'

interface FinancialsPanelProps {
  state: SimulationState
}

export function FinancialsPanel({ state }: FinancialsPanelProps) {
  const company = state.company
  const netWorth = calculateNetWorth(company)
  const growthRate = calculateGrowthRate(state.financialHistory)

  const totalAssetValue = company.assets.reduce((sum, a) => sum + a.currentValue, 0)
  const totalInvestmentValue = company.investments.reduce((sum, i) => sum + i.currentPrice * i.shares, 0)
  const monthlyProfit = company.monthlyRevenue - company.monthlyExpenses

  const TrendIcon = growthRate > 2 ? TrendingUp : growthRate < -2 ? TrendingDown : Minus
  const trendColor = growthRate > 2 ? 'text-emerald-500' : growthRate < -2 ? 'text-red-500' : 'text-muted-foreground'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="font-mono text-lg font-semibold">{formatCurrency(company.cash)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className="font-mono text-lg font-semibold text-emerald-500">{formatCurrency(netWorth)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cash</span>
              <span>{((company.cash / netWorth) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(company.cash / netWorth) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Real Estate</span>
              <span>{((totalAssetValue / netWorth) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalAssetValue / netWorth) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Investments</span>
              <span>{((totalInvestmentValue / netWorth) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalInvestmentValue / netWorth) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <span className="font-mono text-emerald-500">+{formatCurrency(company.monthlyRevenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <span className="font-mono text-red-500">-{formatCurrency(company.monthlyExpenses)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Profit</span>
              <span className={`font-mono font-semibold ${monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {monthlyProfit >= 0 ? '+' : ''}{formatCurrency(monthlyProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Annualized Growth</span>
            <span className={`font-mono font-semibold ${trendColor}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Properties</span>
            <span className="font-mono">{company.assets.filter(a => a.type === 'property').length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Investments</span>
            <span className="font-mono">{company.investments.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Deals</span>
            <span className="font-mono">{company.deals.filter(d => ['proposed', 'negotiating'].includes(d.status)).length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Employees</span>
            <span className="font-mono">{company.employees}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reputation</span>
            <div className="flex items-center gap-2">
              <Progress value={company.reputation} className="h-2 w-16" />
              <span className="font-mono text-sm">{company.reputation}/100</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
