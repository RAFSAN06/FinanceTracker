import { Card } from '@/components/ui/card';
import { Transaction } from '@/types';
import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/finance-utils';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const { resolvedTheme } = useTheme();
  const { preferences } = useFinance();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Group transactions by day
    const groupedByDay: Record<string, { date: string; income: number; expense: number }> = {};

    transactions.forEach(transaction => {
      const date = transaction.date.split('T')[0];
      
      if (!groupedByDay[date]) {
        groupedByDay[date] = { date, income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        groupedByDay[date].income += transaction.amount;
      } else {
        groupedByDay[date].expense += transaction.amount;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.values(groupedByDay).sort((a, b) => a.date.localeCompare(b.date));
    
    setData(chartData);
  }, [transactions]);

  // No data message
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No data available for this period</p>
      </div>
    );
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  const tooltipFormatter = (value: number) => formatCurrency(value, preferences.currency);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            fontSize={12} 
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis fontSize={12} tickFormatter={formatYAxis} />
          <Tooltip 
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#fff',
              borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
              color: resolvedTheme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          />
          <Legend />
          <Bar name="Income" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar name="Expenses" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}