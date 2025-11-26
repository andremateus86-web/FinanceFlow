import React, { useState, useEffect } from 'react';
import { User, IncomeItem, ExpenseItem, EXCHANGE_RATES } from '../../types';
import { getIncomes, getExpenses } from '../../services/storage';
import { MONTHS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
  user: User;
  year: number;
}

export const BalanceSection: React.FC<Props> = ({ user, year }) => {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const rate = EXCHANGE_RATES[user.preferredCurrency];

  useEffect(() => {
    setIncomes(getIncomes(user.id).filter(i => i.year === year));
    setExpenses(getExpenses(user.id).filter(e => e.year === year));
  }, [user.id, year]);

  const getMonthData = (monthIndex: number) => {
    const inc = incomes.filter(i => i.month === monthIndex).reduce((sum, item) => sum + item.amount, 0);
    const exp = expenses.filter(e => e.month === monthIndex).reduce((sum, item) => sum + item.amount, 0);
    return {
      income: inc,
      expense: exp,
      balance: inc - exp
    };
  };

  const chartData = MONTHS.map((name, index) => {
    const { income, expense, balance } = getMonthData(index);
    return {
      name: name.substring(0, 3),
      fullDate: name,
      income: income * rate,
      expense: expense * rate,
      balance: balance * rate
    };
  });

  const currentMonthStats = getMonthData(selectedMonth);
  const annualStats = chartData.reduce((acc, curr) => ({
    balance: acc.balance + curr.balance
  }), { balance: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Balance Mensuelle</h3>
             <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
             >
               {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
             </select>
           </div>
           
           <div className="flex justify-between items-end mb-6">
             <div>
                <p className={`text-4xl font-bold ${currentMonthStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(currentMonthStats.balance * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
                </p>
                <p className="text-xs text-gray-400 mt-1">Revenus - Dépenses</p>
             </div>
           </div>

           <div className="space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-gray-500">Total Entrées</span>
               <span className="font-medium text-green-600">+{(currentMonthStats.income * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-500">Total Dépenses</span>
               <span className="font-medium text-red-600">-{(currentMonthStats.expense * rate).toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}</span>
             </div>
           </div>
        </div>

        {/* Annual Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-2">Balance Annuelle ({year})</h3>
            <p className={`text-4xl font-bold ${annualStats.balance >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
              {annualStats.balance.toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
            </p>
            <p className="text-gray-400 text-sm mt-2">Épargne potentielle cumulée sur l'année</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Évolution de la Balance</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `${val}`} />
            <Tooltip 
              cursor={{fill: '#f9fafb'}}
              formatter={(value: number) => value.toLocaleString('fr-CH', { style: 'currency', currency: user.preferredCurrency })}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? '#4ade80' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};