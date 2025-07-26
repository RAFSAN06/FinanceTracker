import { useEffect, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/finance-utils';

interface MonthlyTrendsChartProps {
  year: number;
}

export function MonthlyTrendsChart({ year }: MonthlyTrendsChartProps) {
  const { transactions } = useFinance();
  const { resolvedTheme } = useTheme();
  const { preferences } = useFinance();
  const [data, setData] = useState<any[]>([]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    // Initialize data for all months
    const monthlyData = monthNames.map((month, index) => ({
      name: month,
      income: 0,
      expense: 0,
      balance: 0,
      monthIndex: index
    }));

    // Process transactions for the selected year
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === year) {
        const monthIndex = transactionDate.getMonth();
        const amount = transaction.amount;

        if (transaction.type === 'income') {
          monthlyData[monthIndex].income += amount;
          monthlyData[monthIndex].balance += amount;
        } else {
          monthlyData[monthIndex].expense += amount;
          monthlyData[monthIndex].balance -= amount;
        }
      }
    });

    setData(monthlyData);
  }, [transactions, year]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  const tooltipFormatter = (value: number) => formatCurrency(value, preferences.currency);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" />
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
          <Bar name="Income" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar name="Expense" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar name="Balance" dataKey="balance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}