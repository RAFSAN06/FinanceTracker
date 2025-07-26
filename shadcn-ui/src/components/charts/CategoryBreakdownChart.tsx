import { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { Transaction, Category } from '@/types';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/finance-utils';

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CategoryBreakdownChart({ transactions, categories }: CategoryBreakdownChartProps) {
  const { resolvedTheme } = useTheme();
  const { preferences } = useFinance();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Group transactions by category
    const categoryAmounts: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (!categoryAmounts[transaction.categoryId]) {
        categoryAmounts[transaction.categoryId] = 0;
      }
      categoryAmounts[transaction.categoryId] += transaction.amount;
    });
    
    // Create chart data with category names and colors
    const chartData = Object.entries(categoryAmounts).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Unknown',
        value: amount,
        color: category?.color || '#999999'
      };
    });
    
    // Sort by amount (descending)
    chartData.sort((a, b) => b.value - a.value);
    
    setData(chartData);
  }, [transactions, categories]);

  // No data message
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No expense data available for this period</p>
      </div>
    );
  }

  const tooltipFormatter = (value: number) => formatCurrency(value, preferences.currency);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={1}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#fff',
              borderColor: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
              color: resolvedTheme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}