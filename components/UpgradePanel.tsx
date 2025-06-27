
import React from 'react';
import { UPGRADE_COSTS } from '../constants';
import { UpgradeType } from '../types';
import { GateIcon, AircraftStandIcon } from './icons';

interface UpgradePanelProps {
  money: number;
  gates: number;
  stands: number;
  onUpgrade: (type: UpgradeType) => void;
}

const ICONS: Record<UpgradeType, React.ReactElement> = {
  [UpgradeType.Gate]: <GateIcon className="w-6 h-6 mr-3 text-teal-400" />,
  [UpgradeType.AircraftStand]: <AircraftStandIcon className="w-6 h-6 mr-3 text-orange-400" />,
};

const upgradeTypeTranslations: Record<UpgradeType, string> = {
  [UpgradeType.Gate]: 'Bramka',
  [UpgradeType.AircraftStand]: 'Stanowisko postojowe',
};

const UpgradePanel: React.FC<UpgradePanelProps> = ({ money, gates, stands, onUpgrade }) => {
  const assetCounts = {
    [UpgradeType.Gate]: gates,
    [UpgradeType.AircraftStand]: stands,
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-sky-300">Infrastruktura</h2>
      <div className="space-y-3">
        {Object.entries(UPGRADE_COSTS).map(([type, details]) => {
          const upgradeType = type as UpgradeType;
          const canAfford = money >= details.cost;
          return (
            <div key={type} className="bg-slate-900/70 p-3 rounded-md flex justify-between items-center border border-slate-700/50">
              <div className="flex items-center">
                {ICONS[upgradeType]}
                <div>
                  <p className="font-semibold">{upgradeTypeTranslations[upgradeType]}</p>
                  <p className="text-xs text-slate-400">Posiadane: {assetCounts[upgradeType]} | Rep: +{details.reputation}</p>
                </div>
              </div>
              <button
                onClick={() => onUpgrade(upgradeType)}
                disabled={!canAfford}
                className="px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-500 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
              >
                ${details.cost.toLocaleString()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradePanel;
