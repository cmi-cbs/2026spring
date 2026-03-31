import { useState, useEffect } from 'react';
import { PortfolioConfig, PriceData, Section, PortfolioValue } from '../types';

export type WeightingMethod = 'vote' | 'equal';

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

function getHoldingWeight(section: Section, ticker: string, weighting: WeightingMethod): number {
  if (weighting === 'equal') {
    return 1 / section.holdings.length;
  }

  const totalVotes = section.holdings.reduce((sum, h) => sum + h.votes, 0);
  const holding = section.holdings.find((item) => item.ticker === ticker);

  if (!holding || totalVotes === 0) {
    return 0;
  }

  return holding.votes / totalVotes;
}

function getLatestAvailablePrice(
  priceData: PriceData,
  sortedDates: string[],
  targetDate: string,
  ticker: string
): number | null {
  const targetIndex = sortedDates.indexOf(targetDate);

  if (targetIndex === -1) {
    return null;
  }

  for (let i = targetIndex; i >= 0; i--) {
    const price = priceData.prices[sortedDates[i]]?.[ticker];
    if (typeof price === 'number') {
      return price;
    }
  }

  return null;
}

export function calculatePortfolioValue(
  section: Section,
  priceData: PriceData,
  currentDate: string,
  startDate: string,
  initialInvestment: number,
  weighting: WeightingMethod = 'vote'
): number {
  if (section.holdings.length === 0) return 0;

  const sortedDates = Object.keys(priceData.prices).sort();
  let totalValue = 0;

  for (const holding of section.holdings) {
    const weight = getHoldingWeight(section, holding.ticker, weighting);
    const startPrice = getLatestAvailablePrice(priceData, sortedDates, startDate, holding.ticker);
    const currentPrice = getLatestAvailablePrice(priceData, sortedDates, currentDate, holding.ticker);

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
  initialInvestment: number,
  weighting: WeightingMethod = 'vote'
): PortfolioValue[] {
  if (section.holdings.length === 0) return [];

  const dates = Object.keys(priceData.prices).sort();
  if (!dates.includes(startDate)) return [];

  const history: PortfolioValue[] = [];

  for (const date of dates) {
    if (date < startDate) continue;

    const value = calculatePortfolioValue(
      section,
      priceData,
      date,
      startDate,
      initialInvestment,
      weighting
    );

    if (value > 0) {
      history.push({ date, value });
    }
  }

  return history;
}
