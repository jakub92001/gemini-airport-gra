
import React from 'react';
import { Vehicle, VehicleType } from '../types';
import { VEHICLE_COSTS } from '../constants';
import { FollowMeIcon, PushbackTugIcon, PassengerBusIcon, CateringTruckIcon, FuelTruckIcon, BaggageCartIcon, StairsIcon } from './icons';

interface FleetPanelProps {
  money: number;
  vehicles: Vehicle[];
  onBuy: (type: VehicleType) => void;
  onSell: (type: VehicleType) => void;
}

const ICONS: Record<VehicleType, React.ReactElement> = {
    [VehicleType.FollowMe]: <FollowMeIcon className="w-6 h-6 mr-3 text-yellow-400" />,
    [VehicleType.PushbackTug]: <PushbackTugIcon className="w-6 h-6 mr-3 text-red-400" />,
    [VehicleType.PassengerBus]: <PassengerBusIcon className="w-6 h-6 mr-3 text-blue-400" />,
    [VehicleType.CateringTruck]: <CateringTruckIcon className="w-6 h-6 mr-3 text-purple-400" />,
    [VehicleType.FuelTruck]: <FuelTruckIcon className="w-6 h-6 mr-3 text-green-400" />,
    [VehicleType.BaggageCart]: <BaggageCartIcon className="w-6 h-6 mr-3 text-indigo-400" />,
    [VehicleType.Stairs]: <StairsIcon className="w-6 h-6 mr-3 text-sky-400" />,
};

const vehicleTypeTranslations: Record<VehicleType, string> = {
    [VehicleType.FollowMe]: 'Wóz "Follow-Me"',
    [VehicleType.PushbackTug]: 'Ciągnik "Pushback"',
    [VehicleType.PassengerBus]: 'Autobus pasażerski',
    [VehicleType.CateringTruck]: 'Ciężarówka cateringowa',
    [VehicleType.FuelTruck]: 'Cysterna',
    [VehicleType.BaggageCart]: 'Wózek bagażowy',
    [VehicleType.Stairs]: 'Schody pasażerskie',
};

const FleetPanel: React.FC<FleetPanelProps> = ({ money, vehicles, onBuy, onSell }) => {
  const vehicleCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<VehicleType, number>);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-sky-300">Zarządzanie flotą naziemną</h2>
      <div className="space-y-3">
        {Object.entries(VEHICLE_COSTS).map(([type, details]) => {
          const vehicleType = type as VehicleType;
          const canAfford = money >= details.cost;
          const canSell = (vehicleCounts[vehicleType] || 0) > 0;

          return (
            <div key={type} className="bg-slate-900/70 p-3 rounded-md flex justify-between items-center border border-slate-700/50">
              <div className="flex items-center">
                {ICONS[vehicleType]}
                <div>
                  <p className="font-semibold">{vehicleTypeTranslations[vehicleType]}</p>
                  <p className="text-xs text-slate-400">Posiadane: {vehicleCounts[vehicleType] || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                    onClick={() => onSell(vehicleType)}
                    disabled={!canSell}
                    className="px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed bg-red-800 hover:bg-red-700 text-white shadow-md"
                >
                    Sprzedaj (${details.sell.toLocaleString()})
                </button>
                 <button
                    onClick={() => onBuy(vehicleType)}
                    disabled={!canAfford}
                    className="px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-500 text-white shadow-md"
                >
                    Kup (${details.cost.toLocaleString()})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FleetPanel;
