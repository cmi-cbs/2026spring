import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { PortfolioValue, Section } from '../types';

interface SectionComparison {
  section: Section;
  voteHistory: PortfolioValue[];
  equalHistory: PortfolioValue[];
}

interface WeightingComparisonProps {
  sectionsData: SectionComparison[];
  initialInvestment: number;
}

const SECTION_COLORS: Record<string, string> = {
  '001': '#3B82F6',
  '002': '#10B981',
  '003': '#F59E0B',
  '007': '#8B5CF6',
  '008': '#EC4899'
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function getFinalReturn(history: PortfolioValue[], initialInvestment: number): number | null {
  const lastEntry = history[history.length - 1];

  if (!lastEntry) {
    return null;
  }

  return ((lastEntry.value - initialInvestment) / initialInvestment) * 100;
}

export function WeightingComparison({ sectionsData, initialInvestment }: WeightingComparisonProps) {
  return (
    <div className="container">
      <div className="comparison-grid">
        {sectionsData.map(({ section, voteHistory, equalHistory }) => {
          const allDates = Array.from(
            new Set([...voteHistory.map(({ date }) => date), ...equalHistory.map(({ date }) => date)])
          ).sort();

          const voteMap = new Map(voteHistory.map((point) => [point.date, point.value]));
          const equalMap = new Map(equalHistory.map((point) => [point.date, point.value]));

          const chartData = allDates.map((date) => ({
            date,
            vote: voteMap.get(date) ?? null,
            equal: equalMap.get(date) ?? null
          }));

          const voteReturn = getFinalReturn(voteHistory, initialInvestment);
          const equalReturn = getFinalReturn(equalHistory, initialInvestment);
          const gap =
            voteReturn !== null && equalReturn !== null ? voteReturn - equalReturn : null;
          const sectionColor = SECTION_COLORS[section.id] || '#3B82F6';

          return (
            <div key={section.id} className="comparison-card">
              <div className="comparison-card-header">
                <div>
                  <h3>{section.name}</h3>
                  <p className="comparison-card-subtitle">{section.instructor}</p>
                </div>
                <div className="comparison-stats">
                  <span>VW {voteReturn?.toFixed(1) ?? '0.0'}%</span>
                  <span>EW {equalReturn?.toFixed(1) ?? '0.0'}%</span>
                  <span className={gap !== null && gap >= 0 ? 'positive' : 'negative'}>
                    Gap {gap !== null ? `${gap >= 0 ? '+' : ''}${gap.toFixed(1)} pp` : 'n/a'}
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DFD5" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#666A70"
                    fontSize={11}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#666A70"
                    fontSize={11}
                    width={72}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'vote' ? 'Vote-weighted' : 'Equal-weighted'
                    ]}
                    labelFormatter={(label: string) => {
                      const date = new Date(label + 'T12:00:00');
                      return date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    }}
                    contentStyle={{
                      backgroundColor: '#F9F9F5',
                      border: '1px solid #E0DFD5',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'vote' ? 'Vote-weighted' : 'Equal-weighted'
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="vote"
                    stroke={sectionColor}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="equal"
                    stroke="#1F2937"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
