export interface Holding {
  ticker: string;
  company: string;
  votes: number;
}

export interface Section {
  id: string;
  instructor: string;
  name: string;
  holdings: Holding[];
}

export interface PortfolioConfig {
  startDate: string;
  initialInvestment: number;
  sections: Section[];
}

export interface PriceData {
  lastUpdated: string;
  prices: Record<string, Record<string, number>>;
}

export interface PortfolioValue {
  date: string;
  value: number;
}
