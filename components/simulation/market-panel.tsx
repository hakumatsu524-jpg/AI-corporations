'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SimulationState } from '@/lib/simulation/types'
import { getSentimentColor } from '@/lib/simulation/utils'
import { TrendingUp, TrendingDown, Minus, Globe, Building, LineChart, Percent, AlertCircle } from 'lucide-react'

interface MarketPanelProps {
  state: SimulationState
}

export function MarketPanel({ state }: MarketPanelProps) {
  const market = state.market

  const getIndexIcon = (value: number) => {
    if (value > 105) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (value < 95) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getIndexColor = (value: number) => {
    if (value > 105) return 'text-emerald-500'
    if (value < 95) return 'text-red-500'
    return 'text-foreground'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Economic Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sentiment:</span>
            <Badge variant="outline" className={getSentimentColor(market.economicSentiment)}>
              {market.economicSentiment.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Real Estate Index</span>
              </div>
              <div className="flex items-center gap-2">
                {getIndexIcon(market.realEstateIndex)}
                <span className={`font-mono font-semibold ${getIndexColor(market.realEstateIndex)}`}>
                  {market.realEstateIndex.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Stock Market Index</span>
              </div>
              <div className="flex items-center gap-2">
                {getIndexIcon(market.stockMarketIndex)}
                <span className={`font-mono font-semibold ${getIndexColor(market.stockMarketIndex)}`}>
                  {market.stockMarketIndex.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Interest Rate</span>
              </div>
              <span className="font-mono font-semibold">{market.interestRate.toFixed(2)}%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Inflation</span>
              </div>
              <span className={`font-mono font-semibold ${market.inflation > 5 ? 'text-orange-500' : ''}`}>
                {market.inflation.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {market.events.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              Active Market Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {market.events.map(event => (
                <div
                  key={event.id}
                  className="rounded-md border border-border bg-muted/50 p-2"
                >
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {market.realEstateIndex < 95 && (
              <p className="text-emerald-500">Real estate prices are below average - good buying opportunity</p>
            )}
            {market.realEstateIndex > 110 && (
              <p className="text-amber-500">Real estate prices are elevated - consider taking profits</p>
            )}
            {market.stockMarketIndex < 90 && (
              <p className="text-emerald-500">Stock market is down - potential buying opportunity</p>
            )}
            {market.stockMarketIndex > 115 && (
              <p className="text-amber-500">Stock market may be overvalued - exercise caution</p>
            )}
            {market.interestRate < 4 && (
              <p className="text-blue-500">Low interest rates favor real estate and borrowing</p>
            )}
            {market.interestRate > 7 && (
              <p className="text-blue-500">High interest rates - bonds may be attractive</p>
            )}
            {market.economicSentiment === 'recession' && (
              <p className="text-red-500">Recessionary conditions - focus on cash preservation</p>
            )}
            {market.economicSentiment === 'boom' && (
              <p className="text-emerald-500">Economic boom - aggressive growth strategies viable</p>
            )}
            {market.realEstateIndex >= 95 && market.realEstateIndex <= 110 && 
             market.stockMarketIndex >= 90 && market.stockMarketIndex <= 115 && (
              <p className="text-muted-foreground">Market conditions are stable - maintain balanced approach</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
