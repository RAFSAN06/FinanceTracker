import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, TrendingUp, TrendingDown, Calendar, Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/finance-utils';
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { RecentTransactions } from '@/components/transactions/RecentTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { detectAnomalies } from '@/lib/finance-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Dashboard() {
  const { transactions, categories, preferences } = useFinance();
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth'>('thisMonth');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // Calculate date ranges
  const today = new Date();
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  
  const dateRange = period === 'thisMonth' 
    ? { startDate: thisMonthStart, endDate: thisMonthEnd }
    : { startDate: lastMonthStart, endDate: lastMonthEnd };
  
  // Filter transactions for the selected period
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
  });
  
  // Calculate totals
  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expenses;
  
  // Check for spending anomalies
  const anomalies = detectAnomalies(transactions, categories);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial activity
          </p>
        </div>
        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Add Transaction</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setShowAddTransaction(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {anomalies.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Spending Alert</AlertTitle>
          <AlertDescription>
            {anomalies.map((anomaly, index) => {
              const category = categories.find(c => c.id === anomaly.categoryId);
              return (
                <div key={index} className="text-sm">
                  Your {category?.name || 'Unknown'} spending has increased by {anomaly.percentageChange.toFixed(0)}% compared to last month.
                </div>
              );
            })}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="thisMonth" className="w-full" onValueChange={(value) => setPeriod(value as 'thisMonth' | 'lastMonth')}>
        <TabsList>
          <TabsTrigger value="thisMonth">This Month</TabsTrigger>
          <TabsTrigger value="lastMonth">Last Month</TabsTrigger>
        </TabsList>
        <TabsContent value="thisMonth">
          <h2 className="text-xl font-medium mt-4 mb-2">{format(thisMonthStart, 'MMMM yyyy')}</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  <div className="text-2xl font-bold">{formatCurrency(income, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                  <div className="text-2xl font-bold">{formatCurrency(expenses, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <Wallet className="w-4 h-4 mr-2 text-blue-500" />
                  <div className="text-2xl font-bold">{formatCurrency(balance, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="lastMonth">
          <h2 className="text-xl font-medium mt-4 mb-2">{format(lastMonthStart, 'MMMM yyyy')}</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  <div className="text-2xl font-bold">{formatCurrency(income, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                  <div className="text-2xl font-bold">{formatCurrency(expenses, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center">
                  <Wallet className="w-4 h-4 mr-2 text-blue-500" />
                  <div className="text-2xl font-bold">{formatCurrency(balance, preferences.currency)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Comparison for {format(dateRange.startDate, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart transactions={filteredTransactions} />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>By category for {format(dateRange.startDate, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart 
              transactions={filteredTransactions.filter(t => t.type === 'expense')} 
              categories={categories} 
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <RecentTransactions limit={5} />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Link to="/transactions">
            <Button variant="outline" className="flex items-center">
              <span>View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}