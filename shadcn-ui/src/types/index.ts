export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO date string
  type: TransactionType;
  categoryId: string;
  recurring?: RecurringInfo;
  receiptURL?: string; // For storing base64 encoded images
  tags?: string[];
}

export interface RecurringInfo {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string; // ISO date string, undefined means forever
  lastProcessed?: string; // ISO date string
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  version: string; // For future migration support
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  themeMode: ThemeMode;
  currency: string;
  dateFormat: string;
  notifications: boolean;
  autoCategorization: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categorySummary: Record<string, number>;
}

export interface YearSummary {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlySummaries: MonthSummary[];
  categorySummary: Record<string, number>;
}