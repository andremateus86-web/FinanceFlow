
export type UserType = 'individuel' | 'commun';

export interface User {
  id: string;
  name: string;
  type: UserType;
  currency: string;
  members?: string[]; // IDs of members if joint account
}

export interface CategoryGroup {
  [key: string]: number;
}

export interface MonthSection {
  base: CategoryGroup;
  custom: CategoryGroup;
}

export interface MonthData {
  entrees: MonthSection;
  depenses: MonthSection;
}

export interface Investment {
  id: string;
  name: string;
  type: 'Actions / ETF' | 'Crypto' | 'Immobilier' | 'Autres';
  investedAmount: number;
  currentValue: number;
  history?: Record<string, number>; // Keys "01" to "12", value is amount
  note?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  history?: Record<string, number>;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  history?: Record<string, number>;
}

export interface FortuneData {
  bankAccounts: BankAccount[];
  otherAssets: Asset[]; // Replaces old cash and realEstate fields
}

export interface YearData {
  year: number;
  months: Record<string, MonthData>; // Keys "01" to "12"
  investments: Investment[];
  fortune: FortuneData;
}

export interface AppState {
  users: User[];
  activeUserId: string | null;
  activeYear: number;
  data: Record<string, Record<number, YearData>>; // userId -> year -> YearData
}

export const MONTH_NAMES: Record<string, string> = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
  "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
};
