import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Section } from '../types';

interface HoldingsPieChartsProps {
  sections: Section[];
}

// Color palette for pie slices - more distinct colors
const COLORS = [
  '#6F7F99', // Columbia blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
}: LabelProps) => {
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Line from pie to label
  const lineX1 = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
  const lineY1 = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);
  const lineX2 = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
  const lineY2 = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);

  // percent from recharts is a decimal (0-1)
  const pctDisplay = (percent * 100).toFixed(1);

  return (
    <g>
      <line
        x1={lineX1}
        y1={lineY1}
        x2={lineX2}
        y2={lineY2}
        stroke="#666A70"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y}
        fill="#2A2F36"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 12}
        fill="#666A70"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif' }}
      >
        {pctDisplay}%
      </text>
    </g>
  );
};

export function HoldingsPieCharts({ sections }: HoldingsPieChartsProps) {
  return (
    <div className="container">
      <div className="pie-charts-grid">
        {sections.map((section) => {
          if (section.holdings.length === 0) {
            return (
              <div key={section.id} className="pie-chart-card empty">
                <h3>{section.name}</h3>
                <p className="instructor">{section.instructor}</p>
                <div className="empty-state">
                  <p>Coming Soon</p>
                </div>
              </div>
            );
          }

          const totalVotes = section.holdings.reduce((sum, h) => sum + h.votes, 0);
          const sortedHoldings = [...section.holdings].sort((a, b) => b.votes - a.votes);

          // Don't include 'percent' field - let recharts calculate it
          const chartData = sortedHoldings.map(h => ({
            name: h.ticker,
            company: h.company,
            value: h.votes
          }));

          return (
            <div key={section.id} className="pie-chart-card">
              <h3>{section.name}</h3>
              <p className="instructor">{section.instructor}</p>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const pct = ((data.value / totalVotes) * 100).toFixed(1);
                        return (
                          <div style={{
                            backgroundColor: '#F9F9F5',
                            border: '1px solid #E0DFD5',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                              {data.company}
                            </div>
                            <div style={{ color: '#666A70', fontSize: '0.85rem' }}>
                              {data.name} · {pct}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="holdings-count">
                {section.holdings.length} holdings
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
