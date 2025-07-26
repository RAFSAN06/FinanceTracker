import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/finance-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MonthlyBreakdownTableProps {
  year: number;
}

export function MonthlyBreakdownTable({ year }: MonthlyBreakdownTableProps) {
  const { transactions, preferences } = useFinance();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Initialize monthly data
  const monthlyData = monthNames.map((month, index) => ({
    month,
    monthIndex: index,
    income: 0,
    expense: 0,
    balance: 0
  }));
  
  // Calculate monthly totals
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
  
  // Calculate yearly totals
  const yearlyTotals = {
    income: monthlyData.reduce((sum, month) => sum + month.income, 0),
    expense: monthlyData.reduce((sum, month) => sum + month.expense, 0),
    balance: monthlyData.reduce((sum, month) => sum + month.balance, 0)
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Income</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthlyData.map((month) => (
            <TableRow key={month.month}>
              <TableCell className="font-medium">{month.month}</TableCell>
              <TableCell className="text-right text-green-600">
                {month.income > 0 ? formatCurrency(month.income, preferences.currency) : '-'}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {month.expense > 0 ? formatCurrency(month.expense, preferences.currency) : '-'}
              </TableCell>
              <TableCell className={`text-right ${month.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(month.balance, preferences.currency)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50">
            <TableCell>Total</TableCell>
            <TableCell className="text-right text-green-600">
              {formatCurrency(yearlyTotals.income, preferences.currency)}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {formatCurrency(yearlyTotals.expense, preferences.currency)}
            </TableCell>
            <TableCell className={`text-right ${yearlyTotals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(yearlyTotals.balance, preferences.currency)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}