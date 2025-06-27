
import React from 'react';
import { GAME_NAME, LOCATIONS } from '../constants';
import { Location } from '../types';

interface LocationSelectorProps {
  onSelect: (location: Location) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="text-center max-w-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-5xl font-extrabold text-white mb-4">
          Witaj w <span className="text-sky-400">{GAME_NAME}</span>
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Twoja podróż jako potentata lotniskowego właśnie się rozpoczyna. Pierwszą kluczową decyzją jest wybór miejsca na budowę Twojego węzła. Twoja lokalizacja określi rzeczywiste warunki pogodowe, z jakimi będziesz się zmagać.
        </p>
        <h2 className="text-2xl font-bold text-sky-300 mb-6">Wybierz swoją lokalizację startową:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LOCATIONS.map(location => (
            <button
              key={location.name}
              onClick={() => onSelect(location)}
              className="bg-slate-700 hover:bg-sky-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/30"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
