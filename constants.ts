import { ExpenseCategoryType } from './types';

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salaire 1',
  'Salaire 2',
  'Allocations familiales',
  'Autres entrées'
];

export const DEFAULT_EXPENSE_CATEGORIES: Record<ExpenseCategoryType, string[]> = {
  [ExpenseCategoryType.FIXED]: ['Loyer', 'Assurance maladie', 'Frais de garde', 'Impots', 'Media', 'Autres'],
  [ExpenseCategoryType.WORK]: ['Essence', 'Repas midi', 'Transports publics'],
  [ExpenseCategoryType.OTHER]: ['Courses alimentaires', 'Loisirs', 'Cadeaux', 'Divers']
};

export const YEARS_RANGE = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i); // Current year +/- 2