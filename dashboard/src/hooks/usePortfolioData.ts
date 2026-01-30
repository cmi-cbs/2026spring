import { useState, useEffect } from 'react';
import { PortfolioConfig, PriceData, Section, PortfolioValue } from '../types';

export function usePortfolioData() {
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [configRes, pricesRes] = await Promise.all([
          fetch('./data/portfolios.json'),
          fetch('./data/prices.json')
        ]);

        if (!configRes.ok) {
          throw new Error('Failed to load portfolio configuration');
        }

        const config = await configRes.json();
        setPortfolioConfig(config);

        // Prices might not exist yet (before first GitHub Action run)
        if (pricesRes.ok) {
          const prices = await pricesRes.json();
          setPriceData(prices);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { portfolioConfig, priceData, loading, error };
}

export function calculatePortfolioValue(
  section: Section,
  prices: Record<string, number>,
  startPrices: Record<string, number>,
  initialInvestment: number
): number {
  if (section.holdings.length === 0) return 0;

  const totalVotes = section.holdings.reduce((sum, h) => sum + h.votes, 0);
  let totalValue = 0;

  for (const holding of section.holdings) {
    const weight = holding.votes / totalVotes;
    const startPrice = startPrices[holding.ticker];
    const currentPrice = prices[holding.ticker];

    if (startPrice && currentPrice) {
      const shares = (weight * initialInvestment) / startPrice;
      totalValue += shares * currentPrice;
    }
  }

  return totalValue;
}

export function calculatePortfolioHistory(
  section: Section,
  priceData: PriceData,
  startDate: string,
  initialInvestment: number
): PortfolioValue[] {
  if (section.holdings.length === 0) return [];

  const dates = Object.keys(priceData.prices).sort();
  const startPrices = priceData.prices[startDate];

  if (!startPrices) return [];

  const history: PortfolioValue[] = [];

  for (const date of dates) {
    if (date < startDate) continue;

    const prices = priceData.prices[date];
    const value = calculatePortfolioValue(section, prices, startPrices, initialInvestment);

    if (value > 0) {
      history.push({ date, value });
    }
  }

  return history;
}
