import { MonthData, YearData, User } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatMoney = (amount: number, currency = 'CHF') => {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// FACTORY FUNCTIONS - Critical for independent references

const createDefaultMonth = (): MonthData => ({
  entrees: {
    base: {
      'Salaire 1': 0,
      'Salaire 2': 0,
      'Allocations familiales': 0,
      'Autres': 0
    },
    custom: {}
  },
  depenses: {
    base: {
      'Loyer': 0,
      'Assurances maladie': 0,
      'Frais de garde': 0
    },
    custom: {}
  }
});

export const createDefaultYear = (year: number): YearData => {
  const months: Record<string, MonthData> = {};
  const monthKeys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  
  monthKeys.forEach(k => {
    // IMPORTANT: Create a NEW object for each month
    months[k] = createDefaultMonth();
  });

  return {
    year,
    months,
    investments: [],
    fortune: {
      bankAccounts: [],
      otherAssets: []
    }
  };
};

export const calculateMonthTotal = (section: 'entrees' | 'depenses', monthData: MonthData): number => {
  const baseTotal = Object.values(monthData[section].base).reduce((a, b) => a + b, 0);
  const customTotal = Object.values(monthData[section].custom).reduce((a, b) => a + b, 0);
  return baseTotal + customTotal;
};

export const calculateYearTotal = (section: 'entrees' | 'depenses', yearData: YearData): number => {
  let total = 0;
  Object.values(yearData.months).forEach(month => {
    total += calculateMonthTotal(section, month);
  });
  return total;
};

export const STORAGE_KEY_PREFIX = 'financeflow_v1_';

export const loadData = () => {
  const storedUsers = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
  const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
  
  // We need to construct the data map based on users and years
  // In a real app we might load lazily, but here we load all for simplicity
  const data: Record<string, Record<number, YearData>> = {};
  
  users.forEach(u => {
    data[u.id] = {};
    // Check for years in local storage. Rough check for years 2020-2030
    for(let y = 2020; y <= 2030; y++) {
      const storedYear = localStorage.getItem(`${STORAGE_KEY_PREFIX}${u.id}_${y}`);
      if(storedYear) {
        data[u.id][y] = JSON.parse(storedYear);
      }
    }
  });

  return { users, data };
};

export const saveData = (userId: string, yearData: YearData) => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_${yearData.year}`, JSON.stringify(yearData));
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
};
