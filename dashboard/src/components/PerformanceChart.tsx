import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  LabelList
} from 'recharts';
import { Section, PortfolioValue, PriceData } from '../types';

interface SectionHistory {
  section: Section;
  history: PortfolioValue[];
}

interface PerformanceChartProps {
  sectionsData: SectionHistory[];
  initialInvestment: number;
  priceData: PriceData | null;
  startDate: string;
}

// Colors for each section line - vibrant colors for sections
const SECTION_COLORS: Record<string, string> = {
  '001': '#3B82F6',  // Bright blue
  '002': '#10B981',  // Emerald green
  '003': '#F59E0B',  // Amber
  '007': '#8B5CF6',  // Purple
  '008': '#EC4899',  // Pink
  'SPY': '#1F2937',  // Dark charcoal for benchmark
};

// Helper to add business days to a date
function addBusinessDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

// Helper to round to nice tick values
function getNiceTickValues(min: number, max: number, targetTicks: number = 5): number[] {
  const range = max - min;
  const roughStep = range / (targetTicks - 1);

  // Round to nice step values (50, 100, 200, 250, 500, etc.)
  const niceSteps = [50, 100, 200, 250, 500, 1000];
  let step = niceSteps[0];
  for (const s of niceSteps) {
    if (s >= roughStep) {
      step = s;
      break;
    }
  }

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax; v += step) {
    ticks.push(v);
  }
  return ticks;
}

export function PerformanceChart({ sectionsData, initialInvestment, priceData, startDate }: PerformanceChartProps) {
  if (sectionsData.length === 0 || sectionsData.every(s => s.history.length === 0)) {
    return (
      <div className="container">
        <div className="chart-container">
          <h3>Portfolio Performance Comparison</h3>
          <div className="empty-state">
            <p>No price data available yet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get all unique dates from sections
  const allDates = new Set<string>();
  sectionsData.forEach(({ history }) => {
    history.forEach(({ date }) => allDates.add(date));
  });

  const sortedDates = Array.from(allDates).sort();
  const lastDataDate = sortedDates[sortedDates.length - 1];

  // Add future dates to extend the x-axis (5 more business days)
  const futureDates: string[] = [];
  let currentDate = lastDataDate;
  for (let i = 0; i < 5; i++) {
    currentDate = addBusinessDays(currentDate, 1);
    futureDates.push(currentDate);
  }
  const allXAxisDates = [...sortedDates, ...futureDates];

  // Calculate SPY benchmark values (starting at $10k on start date)
  const spyStartPrice = priceData?.prices[startDate]?.SPY;
  const spyValues: Record<string, number> = {};

  if (spyStartPrice && priceData) {
    const spyShares = initialInvestment / spyStartPrice;
    sortedDates.forEach(date => {
      const spyPrice = priceData.prices[date]?.SPY;
      if (spyPrice) {
        spyValues[date] = spyShares * spyPrice;
      }
    });
  }

  // Calculate final returns for labels
  const finalReturns: Record<string, number> = {};
  sectionsData.forEach(({ section, history }) => {
    const lastEntry = history[history.length - 1];
    if (lastEntry) {
      finalReturns[section.id] = ((lastEntry.value - initialInvestment) / initialInvestment) * 100;
    }
  });
  if (spyValues[lastDataDate]) {
    finalReturns['SPY'] = ((spyValues[lastDataDate] - initialInvestment) / initialInvestment) * 100;
  }

  // Create combined data with all x-axis dates
  const chartData = allXAxisDates.map(date => {
    const point: Record<string, string | number | null> = { date };
    const isDataDate = sortedDates.includes(date);
    const isLastDataDate = date === lastDataDate;

    sectionsData.forEach(({ section, history }) => {
      if (isDataDate) {
        const entry = history.find(h => h.date === date);
        if (entry) {
          point[section.id] = entry.value;
          // Add return label only for last data point
          if (isLastDataDate) {
            point[`${section.id}_return`] = finalReturns[section.id];
          }
        }
      } else {
        point[section.id] = null;
      }
    });

    // Add SPY benchmark
    if (isDataDate && spyValues[date]) {
      point['SPY'] = spyValues[date];
      if (isLastDataDate) {
        point['SPY_return'] = finalReturns['SPY'];
      }
    } else if (!isDataDate) {
      point['SPY'] = null;
    }

    return point;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate Y-axis domain with nice round numbers
  let minValue = initialInvestment;
  let maxValue = initialInvestment;
  sectionsData.forEach(({ history }) => {
    history.forEach(({ value }) => {
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    });
  });
  // Include SPY in range calculation
  Object.values(spyValues).forEach(value => {
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;
  });

  // Get nice tick values
  const yTicks = getNiceTickValues(minValue * 0.98, maxValue * 1.02);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  // Custom label renderer for YTD returns
  const renderReturnLabel = (props: { x?: number; y?: number; value?: number; index?: number }, dataKey: string) => {
    const { x, y, value, index } = props;
    if (value === undefined || value === null || x === undefined || y === undefined) return null;

    // Only show label on the last data point
    const lastDataIndex = sortedDates.length - 1;
    if (index !== lastDataIndex) return null;

    const returnValue = finalReturns[dataKey];
    if (returnValue === undefined) return null;

    const sign = returnValue >= 0 ? '+' : '';
    const color = SECTION_COLORS[dataKey] || '#3B82F6';

    return (
      <text
        x={x + 8}
        y={y}
        fill={color}
        fontSize={11}
        fontWeight={600}
        dominantBaseline="middle"
      >
        {sign}{returnValue.toFixed(1)}%
      </text>
    );
  };

  return (
    <div className="container">
      <div className="chart-container">
        <h3>Portfolio Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={450}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 70, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0DFD5" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666A70"
              fontSize={12}
              tickMargin={10}
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={formatCurrency}
              stroke="#666A70"
              fontSize={12}
              width={80}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (value === null) return [null, null];
                if (name === 'SPY') {
                  return [formatCurrency(value), 'S&P 500'];
                }
                const section = sectionsData.find(s => s.section.id === name)?.section;
                return [formatCurrency(value), section?.name || name];
              }}
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
              formatter={(value: string) => {
                if (value === 'SPY') return 'S&P 500';
                const section = sectionsData.find(s => s.section.id === value)?.section;
                return section?.name || value;
              }}
            />
            <ReferenceLine
              y={initialInvestment}
              stroke="#666A70"
              strokeDasharray="5 5"
              label={{
                value: `Initial ($${(initialInvestment / 1000).toFixed(0)}k)`,
                position: 'right',
                fill: '#666A70',
                fontSize: 12
              }}
            />
            {/* S&P 500 benchmark line - thicker dashed line, no dots */}
            {Object.keys(spyValues).length > 0 && (
              <Line
                type="monotone"
                dataKey="SPY"
                stroke={SECTION_COLORS['SPY']}
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 5, fill: '#1F2937' }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="SPY"
                  content={(props) => renderReturnLabel(props as { x?: number; y?: number; value?: number; index?: number }, 'SPY')}
                />
              </Line>
            )}
            {/* Section lines - solid with dots */}
            {sectionsData.map(({ section }) => (
              <Line
                key={section.id}
                type="monotone"
                dataKey={section.id}
                stroke={SECTION_COLORS[section.id] || '#3B82F6'}
                strokeWidth={2.5}
                dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey={section.id}
                  content={(props) => renderReturnLabel(props as { x?: number; y?: number; value?: number; index?: number }, section.id)}
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
