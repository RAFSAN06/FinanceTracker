import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFinanceData, saveFinanceData, getUserPreferences, saveUserPreferences, undo, redo, canUndo, canRedo } from '@/lib/storage';
import { processRecurringTransactions } from '@/lib/finance-utils';
import { FinanceState, Transaction, Category, UserPreferences, TransactionType } from '@/types';

interface FinanceContextProps {
  // Data
  transactions: Transaction[];
  categories: Category[];
  preferences: UserPreferences;
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Helpers
  getCategoryById: (id: string) => Category | undefined;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  processRecurring: () => void;
  
  // Undo/Redo
  undoAction: () => void;
  redoAction: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const FinanceContext = createContext<FinanceContextProps | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financeData, setFinanceData] = useState<FinanceState>(getFinanceData());
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  const [undoAvailable, setUndoAvailable] = useState<boolean>(canUndo());
  const [redoAvailable, setRedoAvailable] = useState<boolean>(canRedo());
  
  // Process recurring transactions on app load and daily
  useEffect(() => {
    processRecurring();
    
    // Set up daily check for recurring transactions
    const intervalId = setInterval(processRecurring, 24 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);
  
  const processRecurring = () => {
    const newTransactions = processRecurringTransactions(financeData.transactions);
    if (newTransactions.length > 0) {
      const updatedTransactions = [...financeData.transactions];
      
      newTransactions.forEach(newTransaction => {
        // Update the recurring transaction's lastProcessed date
        const originalIndex = updatedTransactions.findIndex(
          t => t.id === newTransaction.id.split('-')[0]
        );
        
        if (originalIndex !== -1 && updatedTransactions[originalIndex].recurring) {
          updatedTransactions[originalIndex] = {
            ...updatedTransactions[originalIndex],
            recurring: {
              ...updatedTransactions[originalIndex].recurring!,
              lastProcessed: newTransaction.recurring?.lastProcessed
            }
          };
        }
        
        // Add the new instance of recurring transaction
        updatedTransactions.push(newTransaction);
      });
      
      const updatedData = {
        ...financeData,
        transactions: updatedTransactions
      };
      
      setFinanceData(updatedData);
      saveFinanceData(updatedData);
    }
  };
  
  // Add transaction
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID()
    };
    
    const updatedData = {
      ...financeData,
      transactions: [...financeData.transactions, newTransaction]
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Update transaction
  const updateTransaction = (transaction: Transaction) => {
    const updatedTransactions = financeData.transactions.map(t => 
      t.id === transaction.id ? transaction : t
    );
    
    const updatedData = {
      ...financeData,
      transactions: updatedTransactions
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Delete transaction
  const deleteTransaction = (id: string) => {
    const updatedTransactions = financeData.transactions.filter(t => t.id !== id);
    
    const updatedData = {
      ...financeData,
      transactions: updatedTransactions
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Add category
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '-')
    };
    
    const updatedData = {
      ...financeData,
      categories: [...financeData.categories, newCategory]
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Update category
  const updateCategory = (category: Category) => {
    const updatedCategories = financeData.categories.map(c => 
      c.id === category.id ? category : c
    );
    
    const updatedData = {
      ...financeData,
      categories: updatedCategories
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Delete category
  const deleteCategory = (id: string) => {
    // Don't delete if there are transactions using this category
    const hasTransactions = financeData.transactions.some(t => t.categoryId === id);
    if (hasTransactions) {
      alert('Cannot delete category that has transactions. Please reassign transactions first.');
      return;
    }
    
    const updatedCategories = financeData.categories.filter(c => c.id !== id);
    
    const updatedData = {
      ...financeData,
      categories: updatedCategories
    };
    
    setFinanceData(updatedData);
    saveFinanceData(updatedData);
    updateUndoRedoState();
  };
  
  // Update preferences
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...newPreferences
    };
    
    setPreferences(updatedPreferences);
    saveUserPreferences(updatedPreferences);
  };
  
  // Get category by ID
  const getCategoryById = (id: string) => {
    return financeData.categories.find(c => c.id === id);
  };
  
  // Get transactions by category
  const getTransactionsByCategory = (categoryId: string) => {
    return financeData.transactions.filter(t => t.categoryId === categoryId);
  };
  
  // Undo action
  const undoAction = () => {
    const previousState = undo();
    if (previousState) {
      setFinanceData(previousState);
      updateUndoRedoState();
    }
  };
  
  // Redo action
  const redoAction = () => {
    const nextState = redo();
    if (nextState) {
      setFinanceData(nextState);
      updateUndoRedoState();
    }
  };
  
  // Update undo/redo state
  const updateUndoRedoState = () => {
    setUndoAvailable(canUndo());
    setRedoAvailable(canRedo());
  };
  
  return (
    <FinanceContext.Provider
      value={{
        transactions: financeData.transactions,
        categories: financeData.categories,
        preferences,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        updatePreferences,
        getCategoryById,
        getTransactionsByCategory,
        processRecurring,
        undoAction,
        redoAction,
        canUndo: undoAvailable,
        canRedo: redoAvailable
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};