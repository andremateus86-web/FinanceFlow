import React, { useState } from 'react';
import { YearData, User, MONTH_NAMES } from '../types';
import { calculateYearTotal, calculateMonthTotal, formatMoney } from '../utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Wallet, TrendingDown, TrendingUp, PiggyBank, Eye, EyeOff } from 'lucide-react';

interface DashboardProps {
  data: YearData;
  user: User;
}

const StatCard: React.FC<{ 
  title: string; 
  amount: number; 
  currency: string; 
  icon: React.ReactNode; 
  color: string;
  isHidden: boolean; 
}> = ({ title, amount, currency, icon, color, isHidden }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-slate-800">
        {isHidden ? <span className="tracking-widest text-slate-400">••••••</span> : formatMoney(amount, currency)}
      </p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, user }) => {
  const [privacyMode, setPrivacyMode] = useState(false);

  const totalIncome = calculateYearTotal('entrees', data);
  const totalExpenses = calculateYearTotal('depenses', data);
  const balance = totalIncome - totalExpenses;
  
  // Calculate current net worth
  const bankTotal = data.fortune.bankAccounts.reduce((a, b) => a + b.balance, 0);
  const investTotal = data.investments.reduce((a, b) => a + b.currentValue, 0);
  const otherAssetsTotal = (data.fortune.otherAssets || []).reduce((a, b) => a + b.value, 0);
  
  const netWorth = bankTotal + otherAssetsTotal + investTotal;

  // Prepare chart data
  const chartData = Object.keys(MONTH_NAMES).sort().map(key => {
    const m = data.months[key];
    return {
      name: MONTH_NAMES[key].substring(0, 3),
      Entrées: calculateMonthTotal('entrees', m),
      Dépenses: calculateMonthTotal('depenses', m),
      Balance: calculateMonthTotal('entrees', m) - calculateMonthTotal('depenses', m)
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble - {data.year}</h2>
        <button 
          onClick={() => setPrivacyMode(!privacyMode)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm text-sm"
          title={privacyMode ? "Afficher les montants" : "Masquer les montants"}
        >
          {privacyMode ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>{privacyMode ? 'Afficher' : 'Masquer'} les chiffres</span>
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Entrées Annuelles" 
          amount={totalIncome} 
          currency={user.currency} 
          icon={<TrendingUp size={24} />} 
          color="bg-emerald-500" 
          isHidden={privacyMode}
        />
        <StatCard 
          title="Dépenses Annuelles" 
          amount={totalExpenses} 
          currency={user.currency} 
          icon={<TrendingDown size={24} />} 
          color="bg-rose-500" 
          isHidden={privacyMode}
        />
        <StatCard 
          title="Balance" 
          amount={balance} 
          currency={user.currency} 
          icon={<Wallet size={24} />} 
          color="bg-blue-500" 
          isHidden={privacyMode}
        />
        <StatCard 
          title="Fortune Nette" 
          amount={netWorth} 
          currency={user.currency} 
          icon={<PiggyBank size={24} />} 
          color="bg-violet-500" 
          isHidden={privacyMode}
        />
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Évolution Mensuelle</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b'}} 
              tickFormatter={(val) => privacyMode ? '' : val}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => privacyMode ? '••••••' : formatMoney(value, user.currency)}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Bar dataKey="Entrées" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};