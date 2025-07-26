import { useEffect, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/finance-utils';

interface YearlySummaryChartProps {
  type?: 'income' | 'expense' | 'balance';
}

export function YearlySummaryChart({ type }: YearlySummaryChartProps = {}) {
  const { transactions } = useFinance();
  const { resolvedTheme } = useTheme();
  const { preferences } = useFinance();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Group transactions by year
    const yearlyData: Record<number, { income: number; expense: number; balance: number }> = {};

    transactions.forEach(transaction => {
      const year = new Date(transaction.date).getFullYear();
      
      if (!yearlyData[year]) {
        yearlyData[year] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (transaction.type === 'income') {
        yearlyData[year].income += transaction.amount;
        yearlyData[year].balance += transaction.amount;
      } else {
        yearlyData[year].expense += transaction.amount;
        yearlyData[year].balance -= transaction.amount;
      }
    });

    // Convert to array and sort by year
    const chartData = Object.entries(yearlyData)
      .map(([year, values]) => ({
        year: Number(year),
        ...values
      }))
      .sort((a, b) => a.year - b.year);
    
    setData(chartData);
  }, [transactions]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  const tooltipFormatter = (value: number) => formatCurrency(value, preferences.currency);

  // If specific type is provided, show only that data series
  const renderAreas = () => {
    if (type === 'income') {
      return <Area type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />;
    } else if (type === 'expense') {
      return <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />;
    } else if (type === 'balance') {
      return <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />;
    } else {
      return (
        <>
          <Area type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
          <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
        </>
      );
    }
  };

  // No data message
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatYAxis} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#fff',
              borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
              color: resolvedTheme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          />
          <Legend />
          {renderAreas()}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}