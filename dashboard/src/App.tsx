import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { TabSelector } from './components/TabSelector';
import { HoldingsPieCharts } from './components/HoldingsPieCharts';
import { PerformanceChart } from './components/PerformanceChart';
import {
  usePortfolioData,
  calculatePortfolioHistory
} from './hooks/usePortfolioData';

type Tab = 'holdings' | 'performance';

function App() {
  const { portfolioConfig, priceData, loading, error } = usePortfolioData();
  const [activeTab, setActiveTab] = useState<Tab>('holdings');

  // Calculate portfolio history for all sections (for performance chart)
  const allSectionsHistory = useMemo(() => {
    if (!portfolioConfig || !priceData) return [];

    return portfolioConfig.sections
      .filter((section) => section.holdings.length > 0)
      .map((section) => ({
        section,
        history: calculatePortfolioHistory(
          section,
          priceData,
          portfolioConfig.startDate,
          portfolioConfig.initialInvestment
        )
      }));
  }, [portfolioConfig, priceData]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p>Loading portfolio data...</p>
      </div>
    );
  }

  if (error || !portfolioConfig) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Error Loading Data</h2>
        <p style={{ color: '#666A70', marginTop: '8px' }}>
          {error || 'Failed to load portfolio configuration'}
        </p>
      </div>
    );
  }

  return (
    <>
      <Header lastUpdated={priceData?.lastUpdated || null} />

      <TabSelector activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === 'holdings' && (
        <HoldingsPieCharts sections={portfolioConfig.sections} />
      )}

      {activeTab === 'performance' && (
        <PerformanceChart
          sectionsData={allSectionsHistory}
          initialInvestment={portfolioConfig.initialInvestment}
          priceData={priceData}
          startDate={portfolioConfig.startDate}
        />
      )}
    </>
  );
}

export default App;
