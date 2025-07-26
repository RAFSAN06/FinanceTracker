import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { MonthlyTrendsChart } from '@/components/charts/MonthlyTrendsChart';
import { YearlySummaryChart } from '@/components/charts/YearlySummaryChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { MonthlyBreakdownTable } from '@/components/reports/MonthlyBreakdownTable';
import { SummaryCard } from '@/components/reports/SummaryCard';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentYear } from '@/lib/finance-utils';

export default function Reports() {
  const { resolvedTheme } = useTheme();
  const { transactions, categories } = useFinance();
  const currentYear = getCurrentYear();
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  
  // Get available years from transactions
  const availableYears = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  
  // If no transactions yet, add current year
  if (availableYears.length === 0) {
    availableYears.push(currentYear);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Analyze your financial data
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Tabs defaultValue="monthly" value={reportType} onValueChange={(value) => setReportType(value as 'monthly' | 'yearly')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Overview</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="monthly" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard 
            title="Total Income"
            type="income"
            year={selectedYear}
          />
          <SummaryCard 
            title="Total Expenses"
            type="expense"
            year={selectedYear}
          />
          <SummaryCard 
            title="Net Balance"
            type="balance"
            year={selectedYear}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Income vs Expenses for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyTrendsChart year={selectedYear} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown by category for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBreakdownChart 
                transactions={transactions.filter(t => 
                  t.type === 'expense' && 
                  new Date(t.date).getFullYear() === selectedYear
                )} 
                categories={categories}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Detailed monthly figures for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyBreakdownTable year={selectedYear} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="yearly" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Yearly Summary</CardTitle>
            <CardDescription>Financial overview across years</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <YearlySummaryChart />
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Trend</CardTitle>
              <CardDescription>Year-over-year income comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <YearlySummaryChart type="income" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Expense Trend</CardTitle>
              <CardDescription>Year-over-year expense comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <YearlySummaryChart type="expense" />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
  );
}