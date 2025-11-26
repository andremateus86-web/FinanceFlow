import { User, IncomeItem, ExpenseItem, InvestmentItem, FortuneItem, Currency } from '../types';

const STORAGE_KEYS = {
  USERS: 'ff_users',
  INCOME: 'ff_income',
  EXPENSES: 'ff_expenses',
  INVESTMENTS: 'ff_investments',
  FORTUNE: 'ff_fortune',
  ACTIVE_USER: 'ff_active_user_id'
};

// --- Users ---
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (id: string) => {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getActiveUserId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
};

export const setActiveUserId = (id: string) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, id);
};

// --- Generic Helpers ---
function getItems<T>(key: string, userId: string): T[] {
  const raw = localStorage.getItem(key);
  const allItems: T[] = raw ? JSON.parse(raw) : [];
  // @ts-ignore - Assuming T has userId property
  return allItems.filter(item => item.userId === userId);
}

function saveItem<T>(key: string, item: T) {
  const raw = localStorage.getItem(key);
  const allItems: any[] = raw ? JSON.parse(raw) : [];
  // @ts-ignore
  const index = allItems.findIndex(i => i.id === item.id);
  if (index >= 0) {
    allItems[index] = item;
  } else {
    allItems.push(item);
  }
  localStorage.setItem(key, JSON.stringify(allItems));
}

function deleteItem(key: string, id: string) {
  const raw = localStorage.getItem(key);
  const allItems: any[] = raw ? JSON.parse(raw) : [];
  const filtered = allItems.filter(i => i.id !== id);
  localStorage.setItem(key, JSON.stringify(filtered));
}

// --- Specific Data Access ---
export const getIncomes = (userId: string) => getItems<IncomeItem>(STORAGE_KEYS.INCOME, userId);
export const saveIncome = (item: IncomeItem) => saveItem(STORAGE_KEYS.INCOME, item);
export const deleteIncome = (id: string) => deleteItem(STORAGE_KEYS.INCOME, id);

export const getExpenses = (userId: string) => getItems<ExpenseItem>(STORAGE_KEYS.EXPENSES, userId);
export const saveExpense = (item: ExpenseItem) => saveItem(STORAGE_KEYS.EXPENSES, item);
export const deleteExpense = (id: string) => deleteItem(STORAGE_KEYS.EXPENSES, id);

export const getInvestments = (userId: string) => getItems<InvestmentItem>(STORAGE_KEYS.INVESTMENTS, userId);
export const saveInvestment = (item: InvestmentItem) => saveItem(STORAGE_KEYS.INVESTMENTS, item);
export const deleteInvestment = (id: string) => deleteItem(STORAGE_KEYS.INVESTMENTS, id);

export const getFortuneItems = (userId: string) => getItems<FortuneItem>(STORAGE_KEYS.FORTUNE, userId);
export const saveFortuneItem = (item: FortuneItem) => saveItem(STORAGE_KEYS.FORTUNE, item);
export const deleteFortuneItem = (id: string) => deleteItem(STORAGE_KEYS.FORTUNE, id);

// Initialize default user if empty
export const initStorage = () => {
  if (getUsers().length === 0) {
    const defaultUser: User = {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@financeflow.ch',
      preferredCurrency: Currency.CHF
    };
    saveUser(defaultUser);
    setActiveUserId(defaultUser.id);
  }
};