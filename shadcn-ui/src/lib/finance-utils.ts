import { FinanceState, Transaction, Category, MonthSummary, YearSummary, DateRange, TransactionType } from '@/types';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Get transactions within a date range
export const getTransactionsInRange = (
  transactions: Transaction[],
  dateRange: DateRange
): Transaction[] => {
  return transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return isWithinInterval(transactionDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  });
};

// Get transactions by type
export const getTransactionsByType = (
  transactions: Transaction[],
  type: TransactionType
): Transaction[] => {
  return transactions.filter(t => t.type === type);
};

// Calculate total amount by transaction type
export const calculateTotalByType = (
  transactions: Transaction[],
  type: TransactionType
): number => {
  return transactions
    .filter(t => t.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
};

// Get category breakdown for transactions
export const getCategoryBreakdown = (
  transactions: Transaction[],
  categories: Category[]
): Record<string, number> => {
  const breakdown: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const categoryId = transaction.categoryId;
    if (!breakdown[categoryId]) {
      breakdown[categoryId] = 0;
    }
    breakdown[categoryId] += transaction.amount;
  });
  
  return breakdown;
};

// Get month summary
export const getMonthSummary = (
  data: FinanceState,
  month: number,
  year: number
): MonthSummary => {
  const startDate = startOfMonth(new Date(year, month, 1));
  const endDate = endOfMonth(new Date(year, month, 1));
  
  const transactionsInMonth = getTransactionsInRange(data.transactions, { startDate, endDate });
  const incomeTransactions = getTransactionsByType(transactionsInMonth, 'income');
  const expenseTransactions = getTransactionsByType(transactionsInMonth, 'expense');
  
  const totalIncome = calculateTotalByType(transactionsInMonth, 'income');
  const totalExpense = calculateTotalByType(transactionsInMonth, 'expense');
  const balance = totalIncome - totalExpense;
  
  const categorySummary = getCategoryBreakdown(transactionsInMonth, data.categories);
  
  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance,
    categorySummary
  };
};

// Get year summary
export const getYearSummary = (
  data: FinanceState,
  year: number
): YearSummary => {
  const monthlySummaries: MonthSummary[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  
  // Generate monthly summaries
  for (let month = 0; month < 12; month++) {
    const summary = getMonthSummary(data, month, year);
    monthlySummaries.push(summary);
    totalIncome += summary.totalIncome;
    totalExpense += summary.totalExpense;
  }
  
  // Get yearly category breakdown
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 0, 1));
  const transactionsInYear = getTransactionsInRange(data.transactions, { startDate, endDate });
  const categorySummary = getCategoryBreakdown(transactionsInYear, data.categories);
  
  return {
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    monthlySummaries,
    categorySummary
  };
};

// Format currency amount
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Format date based on user preference
export const formatDate = (dateString: string, dateFormat: string = 'MM/dd/yyyy'): string => {
  try {
    const date = parseISO(dateString);
    return format(date, dateFormat);
  } catch (error) {
    return dateString; // Return original string if parsing fails
  }
};

// Get current year
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Get current month (0-based)
export const getCurrentMonth = (): number => {
  return new Date().getMonth();
};

// Auto-categorize transaction based on description (simple implementation)
export const autoCategorizeTransaction = (
  description: string,
  amount: number,
  type: TransactionType,
  categories: Category[]
): string | null => {
  // Filter categories by transaction type
  const typeCategories = categories.filter(c => c.type === type);
  
  // Simple keyword matching (this can be enhanced with ML techniques)
  const descriptionLower = description.toLowerCase();
  
  // Common keywords for various categories
  const keywordMap: Record<string, string[]> = {
    salary: ['salary', 'wage', 'paycheck', 'pay'],
    freelance: ['freelance', 'contract', 'gig', 'client'],
    gift: ['gift', 'present', 'donation'],
    housing: ['rent', 'mortgage', 'housing', 'apartment', 'house'],
    food: ['grocery', 'restaurant', 'food', 'meal', 'dinner', 'lunch'],
    transportation: ['gas', 'fuel', 'car', 'bus', 'train', 'uber', 'lyft', 'taxi'],
    utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'utility', 'bill'],
    healthcare: ['doctor', 'hospital', 'medical', 'medicine', 'pharmacy', 'health'],
    entertainment: ['movie', 'game', 'concert', 'netflix', 'spotify', 'subscription'],
    shopping: ['amazon', 'walmart', 'target', 'shop', 'store', 'buy'],
  };
  
  // Check for keyword matches
  for (const category of typeCategories) {
    const keywords = keywordMap[category.id] || [];
    if (keywords.some(keyword => descriptionLower.includes(keyword))) {
      return category.id;
    }
  }
  
  // Return default category if no match found
  const defaultCategoryId = type === 'income' ? 'other-income' : 'other-expense';
  const defaultCategory = typeCategories.find(c => c.id === defaultCategoryId);
  return defaultCategory?.id || null;
};

// Detect anomalies in spending patterns
export const detectAnomalies = (
  transactions: Transaction[],
  categories: Category[]
): { categoryId: string; amount: number; percentageChange: number }[] => {
  // Group transactions by month and category
  const monthlySpendByCategory: Record<string, Record<string, number>> = {};
  
  transactions.forEach(transaction => {
    if (transaction.type !== 'expense') return;
    
    const date = parseISO(transaction.date);
    const monthYear = format(date, 'yyyy-MM');
    
    if (!monthlySpendByCategory[monthYear]) {
      monthlySpendByCategory[monthYear] = {};
    }
    
    if (!monthlySpendByCategory[monthYear][transaction.categoryId]) {
      monthlySpendByCategory[monthYear][transaction.categoryId] = 0;
    }
    
    monthlySpendByCategory[monthYear][transaction.categoryId] += transaction.amount;
  });
  
  // Get the last two months with data
  const months = Object.keys(monthlySpendByCategory).sort();
  if (months.length < 2) return [];
  
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  
  // Compare spending and detect anomalies
  const anomalies: { categoryId: string; amount: number; percentageChange: number }[] = [];
  
  for (const categoryId in monthlySpendByCategory[currentMonth]) {
    const currentAmount = monthlySpendByCategory[currentMonth][categoryId];
    const previousAmount = monthlySpendByCategory[previousMonth]?.[categoryId] || 0;
    
    // Skip if there's no previous data or if the amount is very small
    if (previousAmount < 10) continue;
    
    const percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
    
    // Consider significant change as 50% or more increase
    if (percentageChange >= 50) {
      anomalies.push({
        categoryId,
        amount: currentAmount,
        percentageChange
      });
    }
  }
  
  return anomalies;
};

// Process recurring transactions
export const processRecurringTransactions = (
  transactions: Transaction[],
  currentDate: Date = new Date()
): Transaction[] => {
  const newTransactions: Transaction[] = [];
  const today = format(currentDate, 'yyyy-MM-dd');
  
  transactions.forEach(transaction => {
    if (!transaction.recurring) return;
    
    const { frequency, lastProcessed, endDate } = transaction.recurring;
    if (!lastProcessed) return;
    
    // Check if end date has passed
    if (endDate && today > endDate) return;
    
    const lastDate = parseISO(lastProcessed);
    let shouldGenerate = false;
    let newDate: Date | null = null;
    
    switch (frequency) {
      case 'daily':
        // Check if a day has passed since last processed
        const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        shouldGenerate = dayDiff >= 1;
        newDate = new Date(currentDate);
        break;
        
      case 'weekly':
        // Check if a week has passed since last processed
        const weekDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        shouldGenerate = weekDiff >= 1;
        newDate = new Date(lastDate.getTime() + weekDiff * 7 * 24 * 60 * 60 * 1000);
        break;
        
      case 'monthly':
        // Check if a month has passed (approximately)
        const currentMonth = currentDate.getMonth();
        const lastMonth = lastDate.getMonth();
        const monthDiff = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 + (currentMonth - lastMonth);
        shouldGenerate = monthDiff >= 1;
        
        if (shouldGenerate) {
          newDate = new Date(lastDate);
          newDate.setMonth(newDate.getMonth() + monthDiff);
        }
        break;
        
      case 'yearly':
        // Check if a year has passed
        const yearDiff = currentDate.getFullYear() - lastDate.getFullYear();
        shouldGenerate = yearDiff >= 1;
        
        if (shouldGenerate) {
          newDate = new Date(lastDate);
          newDate.setFullYear(newDate.getFullYear() + yearDiff);
        }
        break;
    }
    
    if (shouldGenerate && newDate) {
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      
      // Create new transaction
      const newTransaction: Transaction = {
        ...transaction,
        id: `${transaction.id}-${newDateStr}`,
        date: newDateStr,
        recurring: {
          ...transaction.recurring,
          lastProcessed: newDateStr
        }
      };
      
      newTransactions.push(newTransaction);
    }
  });
  
  return newTransactions;
};