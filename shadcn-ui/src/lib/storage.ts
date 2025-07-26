import { FinanceState, Transaction, Category, UserPreferences, ThemeMode } from '@/types';

// Storage keys
const FINANCE_DATA_KEY = 'finance-tracker-data';
const USER_PREFS_KEY = 'finance-tracker-prefs';
const THEME_KEY = 'finance-tracker-theme';
const UNDO_STACK_KEY = 'finance-tracker-undo';
const REDO_STACK_KEY = 'finance-tracker-redo';

// Default categories
const defaultCategories: Category[] = [
  { id: 'salary', name: 'Salary', type: 'income', color: '#4CAF50' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: '#8BC34A' },
  { id: 'gift', name: 'Gifts', type: 'income', color: '#CDDC39' },
  { id: 'other-income', name: 'Other Income', type: 'income', color: '#FFC107' },
  
  { id: 'housing', name: 'Housing', type: 'expense', color: '#F44336' },
  { id: 'food', name: 'Food', type: 'expense', color: '#FF5722' },
  { id: 'transportation', name: 'Transportation', type: 'expense', color: '#FF9800' },
  { id: 'utilities', name: 'Utilities', type: 'expense', color: '#9C27B0' },
  { id: 'healthcare', name: 'Healthcare', type: 'expense', color: '#3F51B5' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', color: '#2196F3' },
  { id: 'shopping', name: 'Shopping', type: 'expense', color: '#009688' },
  { id: 'other-expense', name: 'Other Expenses', type: 'expense', color: '#795548' },
];

// Default finance state
const defaultFinanceState: FinanceState = {
  transactions: [],
  categories: defaultCategories,
  version: '1.0.0',
};

// Default user preferences
const defaultUserPreferences: UserPreferences = {
  themeMode: 'system',
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  notifications: true,
  autoCategorization: true,
};

// History stack for undo/redo functionality
const MAX_HISTORY_SIZE = 50;

// Get finance data from local storage
export const getFinanceData = (): FinanceState => {
  try {
    const data = localStorage.getItem(FINANCE_DATA_KEY);
    if (!data) return defaultFinanceState;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading finance data:', error);
    return defaultFinanceState;
  }
};

// Save finance data to local storage
export const saveFinanceData = (data: FinanceState): void => {
  try {
    // Save to undo stack before updating
    saveToUndoStack(getFinanceData());
    
    // Save new data
    localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving finance data:', error);
  }
};

// Get user preferences from local storage
export const getUserPreferences = (): UserPreferences => {
  try {
    const prefs = localStorage.getItem(USER_PREFS_KEY);
    if (!prefs) return defaultUserPreferences;
    return { ...defaultUserPreferences, ...JSON.parse(prefs) };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return defaultUserPreferences;
  }
};

// Save user preferences to local storage
export const saveUserPreferences = (prefs: UserPreferences): void => {
  try {
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

// Get theme mode from local storage
export const getThemeMode = (): ThemeMode => {
  try {
    const theme = localStorage.getItem(THEME_KEY) as ThemeMode;
    if (!theme) return 'system';
    return theme;
  } catch (error) {
    console.error('Error loading theme mode:', error);
    return 'system';
  }
};

// Save theme mode to local storage
export const saveThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (error) {
    console.error('Error saving theme mode:', error);
  }
};

// Export finance data as JSON
export const exportData = (): string => {
  const data = getFinanceData();
  return JSON.stringify(data, null, 2);
};

// Import finance data from JSON
export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData) as FinanceState;
    // Validate data structure
    if (!data.transactions || !data.categories || !data.version) {
      throw new Error('Invalid data format');
    }
    saveFinanceData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Export finance data as CSV
export const exportDataAsCSV = (): string => {
  const data = getFinanceData();
  const headers = ['id', 'date', 'type', 'category', 'description', 'amount', 'tags', 'recurring', 'receiptURL'];
  const rows = data.transactions.map(t => {
    const category = data.categories.find(c => c.id === t.categoryId);
    return [
      t.id,
      t.date,
      t.type,
      category?.name || t.categoryId,
      t.description,
      t.amount,
      t.tags?.join(';') || '',
      t.recurring ? `${t.recurring.frequency}${t.recurring.endDate ? ';' + t.recurring.endDate : ''}` : '',
      t.receiptURL || ''
    ];
  });
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// Undo/Redo functionality
const saveToUndoStack = (state: FinanceState): void => {
  try {
    const undoStack = getUndoStack();
    undoStack.push(state);
    
    // Limit stack size
    if (undoStack.length > MAX_HISTORY_SIZE) {
      undoStack.shift();
    }
    
    localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(undoStack));
    
    // Clear redo stack on new action
    localStorage.setItem(REDO_STACK_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error saving to undo stack:', error);
  }
};

const getUndoStack = (): FinanceState[] => {
  try {
    const stack = localStorage.getItem(UNDO_STACK_KEY);
    if (!stack) return [];
    return JSON.parse(stack);
  } catch (error) {
    console.error('Error loading undo stack:', error);
    return [];
  }
};

const getRedoStack = (): FinanceState[] => {
  try {
    const stack = localStorage.getItem(REDO_STACK_KEY);
    if (!stack) return [];
    return JSON.parse(stack);
  } catch (error) {
    console.error('Error loading redo stack:', error);
    return [];
  }
};

export const canUndo = (): boolean => {
  return getUndoStack().length > 0;
};

export const canRedo = (): boolean => {
  return getRedoStack().length > 0;
};

export const undo = (): FinanceState | null => {
  const undoStack = getUndoStack();
  if (undoStack.length === 0) return null;
  
  const currentState = getFinanceData();
  const previousState = undoStack.pop() || defaultFinanceState;
  
  // Save current state to redo stack
  const redoStack = getRedoStack();
  redoStack.push(currentState);
  
  // Update storage
  localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(undoStack));
  localStorage.setItem(REDO_STACK_KEY, JSON.stringify(redoStack));
  localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(previousState));
  
  return previousState;
};

export const redo = (): FinanceState | null => {
  const redoStack = getRedoStack();
  if (redoStack.length === 0) return null;
  
  const currentState = getFinanceData();
  const nextState = redoStack.pop() || defaultFinanceState;
  
  // Save current state to undo stack
  const undoStack = getUndoStack();
  undoStack.push(currentState);
  
  // Update storage
  localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(undoStack));
  localStorage.setItem(REDO_STACK_KEY, JSON.stringify(redoStack));
  localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(nextState));
  
  return nextState;
};