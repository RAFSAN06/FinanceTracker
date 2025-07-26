import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/finance-utils';
import { TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  type: 'income' | 'expense' | 'balance';
  year: number;
}

export function SummaryCard({ title, type, year }: SummaryCardProps) {
  const { transactions, preferences } = useFinance();
  
  // Filter transactions for the selected year
  const filteredTransactions = transactions.filter(t => 
    new Date(t.date).getFullYear() === year
  );
  
  // Calculate total based on type
  const calculateTotal = () => {
    switch (type) {
      case 'income':
        return filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      case 'expense':
        return filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      case 'balance':
        const income = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return income - expense;
    }
  };
  
  // Get previous year for comparison
  const calculatePreviousYearChange = () => {
    const prevYear = year - 1;
    
    const prevYearTransactions = transactions.filter(t => 
      new Date(t.date).getFullYear() === prevYear
    );
    
    let currentTotal = 0;
    let prevTotal = 0;
    
    switch (type) {
      case 'income':
        currentTotal = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        prevTotal = prevYearTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        break;
      case 'expense':
        currentTotal = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        prevTotal = prevYearTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        break;
      case 'balance':
        const currentIncome = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const currentExpense = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        currentTotal = currentIncome - currentExpense;
        
        const prevIncome = prevYearTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const prevExpense = prevYearTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        prevTotal = prevIncome - prevExpense;
        break;
    }
    
    if (prevTotal === 0) return null; // No previous year data
    
    const percentChange = ((currentTotal - prevTotal) / prevTotal) * 100;
    return {
      percentage: percentChange.toFixed(1),
      increased: percentChange > 0
    };
  };
  
  const total = calculateTotal();
  const change = calculatePreviousYearChange();
  
  // Determine icon and color based on type
  const getIconAndColor = () => {
    switch (type) {
      case 'income':
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          textColor: 'text-green-600'
        };
      case 'expense':
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          textColor: 'text-red-600'
        };
      case 'balance':
        return {
          icon: <CreditCard className="h-4 w-4" />,
          textColor: total >= 0 ? 'text-blue-600' : 'text-red-600'
        };
    }
  };
  
  const { icon, textColor } = getIconAndColor();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={textColor}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(total, preferences.currency)}
        </div>
        {change && (
          <p className={`text-xs ${change.increased ? 
            (type === 'expense' ? 'text-red-600' : 'text-green-600') : 
            (type === 'expense' ? 'text-green-600' : 'text-red-600')
          }`}>
            {change.increased ? '↑' : '↓'} {Math.abs(Number(change.percentage))}% from previous year
          </p>
        )}
      </CardContent>
    </Card>
  );
}