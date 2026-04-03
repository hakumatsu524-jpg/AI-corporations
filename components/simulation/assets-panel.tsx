'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SimulationState, Property, Investment, Deal } from '@/lib/simulation/types'
import { formatCurrency, formatDate } from '@/lib/simulation/utils'
import { Building2, LineChart, Handshake, TrendingUp, TrendingDown } from 'lucide-react'

interface AssetsPanelProps {
  state: SimulationState
}

export function AssetsPanel({ state }: AssetsPanelProps) {
  const properties = state.company.assets.filter((a): a is Property => a.type === 'property')
  const investments = state.company.investments
  const activeDeals = state.company.deals.filter(d => ['proposed', 'negotiating'].includes(d.status))
  const completedDeals = state.company.deals.filter(d => d.status === 'completed')

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="mx-4 w-auto">
            <TabsTrigger value="properties" className="gap-1">
              <Building2 className="h-3 w-3" />
              Properties ({properties.length})
            </TabsTrigger>
            <TabsTrigger value="investments" className="gap-1">
              <LineChart className="h-3 w-3" />
              Stocks ({investments.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-1">
              <Handshake className="h-3 w-3" />
              Deals ({activeDeals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              {properties.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No properties owned. AI agents may acquire properties when market conditions are favorable.
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map(property => {
                    const gain = ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100
                    const isProfit = gain >= 0

                    return (
                      <div
                        key={property.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-xs text-muted-foreground">{property.address}</p>
                          </div>
                          <Badge variant="outline">{property.propertyType}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Value: </span>
                            <span className="font-mono">{formatCurrency(property.currentValue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Paid: </span>
                            <span className="font-mono">{formatCurrency(property.purchasePrice)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gain: </span>
                            <span className={`font-mono ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isProfit ? '+' : ''}{gain.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Occupancy: </span>
                            <span className="font-mono">{(property.occupancyRate * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="investments" className="mt-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              {investments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No investments yet. AI agents may invest in stocks when opportunities arise.
                </div>
              ) : (
                <div className="space-y-3">
                  {investments.map(inv => {
                    const gain = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100
                    const isProfit = gain >= 0
                    const totalValue = inv.shares * inv.currentPrice

                    return (
                      <div
                        key={inv.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{inv.symbol}</span>
                            <Badge variant="outline">{inv.type}</Badge>
                          </div>
                          {isProfit ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Shares: </span>
                            <span className="font-mono">{inv.shares}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price: </span>
                            <span className="font-mono">${inv.currentPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-mono">{formatCurrency(totalValue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gain: </span>
                            <span className={`font-mono ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isProfit ? '+' : ''}{gain.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="deals" className="mt-0">
            <ScrollArea className="h-[400px] px-4 pb-4">
              {activeDeals.length === 0 && completedDeals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No deals in progress. AI agents may propose or receive deals from other companies.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeDeals.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Active Deals</h4>
                      <div className="space-y-3">
                        {activeDeals.map(deal => (
                          <DealCard key={deal.id} deal={deal} />
                        ))}
                      </div>
                    </div>
                  )}

                  {completedDeals.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Completed Deals</h4>
                      <div className="space-y-3">
                        {completedDeals.slice(-5).map(deal => (
                          <DealCard key={deal.id} deal={deal} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const statusColors: Record<string, string> = {
    proposed: 'bg-blue-500/10 text-blue-500',
    negotiating: 'bg-amber-500/10 text-amber-500',
    accepted: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-red-500/10 text-red-500',
    completed: 'bg-emerald-500/10 text-emerald-500',
    cancelled: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-medium">{deal.counterpartyName}</p>
          <p className="text-xs text-muted-foreground">{deal.type.replace('_', ' ')}</p>
        </div>
        <Badge className={statusColors[deal.status]}>{deal.status}</Badge>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-mono">{formatCurrency(deal.value)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expires:</span>
          <span className="font-mono text-xs">{formatDate(deal.expirationDate)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{deal.terms}</p>
    </div>
  )
}
