
import React, { useState } from 'react';
import { User, DashboardTab } from '../../types';
import { YEARS_RANGE } from '../../constants';
import { IncomeSection } from './IncomeSection';
import { ExpenseSection } from './ExpenseSection';
import { BalanceSection } from './BalanceSection';
import { InvestmentSection } from './InvestmentSection';
import { FortuneView } from '../FortuneView';
import { Calendar } from 'lucide-react';

interface Props {
  user: User;
}

export const Dashboard: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('INCOME');
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'INCOME', label: 'Entrées' },
    { id: 'EXPENSE', label: 'Dépenses' },
    { id: 'BALANCE', label: 'Balance' },
    { id: 'INVESTMENT', label: 'Investissements' },
    { id: 'FORTUNE', label: 'Fortune' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'INCOME': return <IncomeSection user={user} year={year} />;
      case 'EXPENSE': return <ExpenseSection user={user} year={year} />;
      case 'BALANCE': return <BalanceSection user={user} year={year} />;
      case 'INVESTMENT': return <InvestmentSection user={user} year={year} />;
      case 'FORTUNE': return <FortuneView user={user} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
           <p className="text-gray-500 mt-1">Gérez vos finances pour {user.name}.</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           <Calendar className="text-gray-400 ml-2" size={18} />
           <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer py-2 pl-2 pr-8"
            >
              {YEARS_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all
                ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};
