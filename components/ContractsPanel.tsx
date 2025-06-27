
import React from 'react';
import { Contract, ContractType } from '../types';
import { AirlineIcon, CateringIcon, FuelIcon, ReputationIcon, MoneyIcon, TrashIcon } from './icons';

interface ContractsPanelProps {
    availableContracts: Contract[];
    activeContracts: Contract[];
    onSign: (contract: Contract) => void;
    onCancel: (contractId: string) => void;
}

const ICONS: Record<ContractType, React.ReactElement<{ className?: string }>> = {
  [ContractType.Airline]: <AirlineIcon className="w-8 h-8 mr-4 text-blue-400" />,
  [ContractType.Catering]: <CateringIcon className="w-8 h-8 mr-4 text-purple-400" />,
  [ContractType.Fuel]: <FuelIcon className="w-8 h-8 mr-4 text-amber-400" />,
};

const contractTypeTranslations: Record<ContractType, string> = {
    [ContractType.Airline]: 'Linia lotnicza',
    [ContractType.Catering]: 'Catering',
    [ContractType.Fuel]: 'Paliwo',
};

const ContractCard: React.FC<{contract: Contract, onSign: (c: Contract) => void}> = ({ contract, onSign }) => {
    const isIncome = contract.terms.moneyPerDay >= 0;
    return (
        <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-2">
                    {ICONS[contract.type]}
                    <div>
                        <h4 className="font-bold text-white">{contract.name}</h4>
                        <p className="text-xs text-slate-400">{contractTypeTranslations[contract.type]}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-300 mb-3">{contract.description}</p>
                <div className="text-xs space-y-1 bg-slate-800/50 p-2 rounded-md">
                    <div className={`flex items-center ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                        <MoneyIcon className="w-4 h-4 mr-2" /> 
                        <span>${Math.abs(contract.terms.moneyPerDay).toLocaleString()}/dzień</span>
                    </div>
                     <div className="flex items-center text-yellow-400">
                        <ReputationIcon className="w-4 h-4 mr-2" />
                        <span>{contract.terms.reputationEffect >= 0 ? '+' : ''}{contract.terms.reputationEffect} Reputacji (przy podpisaniu)</span>
                    </div>
                    <div className="flex items-center text-sky-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>{contract.duration} dni</span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => onSign(contract)}
                className="w-full mt-3 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500"
            >
                Podpisz umowę
            </button>
        </div>
    )
}

const ActiveContractRow: React.FC<{contract: Contract, onCancel: (id: string) => void}> = ({ contract, onCancel }) => {
    const isIncome = contract.terms.moneyPerDay >= 0;
    return (
        <div className="bg-slate-900/50 p-2 rounded-md flex justify-between items-center text-sm">
            <div className="flex items-center">
                {React.cloneElement(ICONS[contract.type], {className: "w-5 h-5 mr-3"})}
                <span className="font-semibold">{contract.name}</span>
            </div>
            <div className="flex items-center space-x-4">
                 <span className={`${isIncome ? 'text-green-400' : 'text-red-400'}`}>${contract.terms.moneyPerDay.toLocaleString()}/dzień</span>
                 <span className="text-slate-400">{contract.daysRemaining} dni pozostało</span>
                 <button onClick={() => onCancel(contract.id)} className="text-red-500 hover:text-red-400 disabled:text-slate-600 disabled:cursor-not-allowed p-1">
                    <TrashIcon className="w-4 h-4" />
                 </button>
            </div>
        </div>
    )
}

const ContractsPanel: React.FC<ContractsPanelProps> = ({ availableContracts, activeContracts, onSign, onCancel }) => {
  return (
    <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2">
            <h3 className="text-lg font-bold mb-2 text-sky-300">Aktywne umowy</h3>
            <div className="space-y-2 mb-4">
                {activeContracts.length > 0 ? (
                    activeContracts.map(c => <ActiveContractRow key={c.id} contract={c} onCancel={onCancel} />)
                ) : (
                    <p className="text-sm text-slate-400 italic">Brak aktywnych umów.</p>
                )}
            </div>

            <h3 className="text-lg font-bold mb-2 text-sky-300">Dostępne oferty</h3>
            {availableContracts.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableContracts.map(contract => (
                        <ContractCard key={contract.id} contract={contract} onSign={onSign} />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 bg-slate-900/30 rounded-lg">
                    <p className="text-slate-500 italic">Brak nowych ofert umów na dzisiaj.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ContractsPanel;
