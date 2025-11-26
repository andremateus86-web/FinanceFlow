
export enum Currency {
  CHF = 'CHF',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP'
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferredCurrency: Currency;
}

export enum ExpenseCategoryType {
  FIXED = 'Dépenses fixes',
  WORK = 'Déplacements et travail',
  OTHER = 'Autres dépenses'
}

export interface IncomeItem {
  id: string;
  userId: string;
  year: number;
  month: number; // 0-11
  categoryName: string;
  amount: number;
}

export interface ExpenseItem {
  id: string;
  userId: string;
  year: number;
  month: number; // 0-11
  mainCategory: ExpenseCategoryType;
  subCategoryName: string;
  amount: number;
}

export interface InvestmentHistoryEntry {
  date: string; // ISO date
  amount: number;
}

export interface InvestmentItem {
  id: string;
  userId: string;
  name: string;
  amount: number; // Current value
  dateCreated: string; // ISO date
  history: InvestmentHistoryEntry[];
}

export interface FortuneItem {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dateCreated: string; // ISO date
  history: InvestmentHistoryEntry[];
}

export type ViewState = 'DASHBOARD' | 'USERS' | 'CURRENCY';
export type DashboardTab = 'INCOME' | 'EXPENSE' | 'BALANCE' | 'INVESTMENT' | 'FORTUNE';

// Mock conversion rates relative to CHF
export const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.CHF]: 1,
  [Currency.EUR]: 0.96,
  [Currency.USD]: 1.10,
  [Currency.GBP]: 0.85
};