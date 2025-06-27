
import React from 'react';
import { AirportState, Weather, WeatherCode } from '../types';
import { MoneyIcon, ReputationIcon, DayIcon, AircraftStandIcon, GateIcon, SunIcon, CloudIcon, RainIcon, StormIcon, SnowIcon, FogIcon, WindIcon } from './icons';
import { WMO_WEATHER_MAP } from '../constants';

interface DashboardProps {
  stats: AirportState;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number, color: string }> = ({ icon, label, value, color }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg flex items-center shadow-lg border border-slate-700`}>
    <div className={`mr-4 p-3 rounded-md bg-slate-700/50 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const ClockStat: React.FC<{ day: number; time: Date }> = ({ day, time }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg flex items-center shadow-lg border border-slate-700`}>
        <div className={`mr-4 p-3 rounded-md bg-slate-700/50 text-sky-400`}>
            <DayIcon className="w-6 h-6"/>
        </div>
        <div>
            <p className="text-sm text-slate-400">Dzień {day}</p>
            <p className="text-2xl font-bold text-white">{time.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })} UTC</p>
        </div>
    </div>
);

const WeatherIcon: React.FC<{ iconType: WeatherCode['icon'], className?: string }> = ({ iconType, className }) => {
    switch (iconType) {
        case 'Sun': return <SunIcon className={className} />;
        case 'Cloud': return <CloudIcon className={className} />;
        case 'Rain': return <RainIcon className={className} />;
        case 'Storm': return <StormIcon className={className} />;
        case 'Snow': return <SnowIcon className={className} />;
        case 'Fog': return <FogIcon className={className} />;
        default: return <CloudIcon className={className} />;
    }
};

const WeatherStat: React.FC<{ weather: Weather | null }> = ({ weather }) => {
    if (!weather) {
        return <div className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-center animate-pulse"><p>Pobieranie pogody...</p></div>;
    }

    const weatherInfo = WMO_WEATHER_MAP[weather.weatherCode] || { icon: 'Cloud', description: 'Unknown' };

    return (
        <div className={`bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg flex items-center shadow-lg border border-slate-700 col-span-2 md:col-span-1`}>
            <div className={`mr-4 p-3 rounded-md bg-slate-700/50 text-cyan-400`}>
                 <WeatherIcon iconType={weatherInfo.icon} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-slate-400">{weather.description}</p>
                <div className="flex items-baseline gap-4">
                     <p className="text-xl font-bold text-white">{weather.temperature.toFixed(1)}°C</p>
                     <div className="flex items-center text-xs text-slate-300">
                        <WindIcon className="w-4 h-4 mr-1"/>
                        <span>{weather.windSpeed.toFixed(1)} km/h</span>
                     </div>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <ClockStat day={stats.day} time={stats.gameTime} />
      <WeatherStat weather={stats.weather} />
      <StatCard icon={<MoneyIcon className="w-6 h-6"/>} label="Finanse" value={`$${stats.money.toLocaleString()}`} color="text-green-400" />
      <StatCard icon={<ReputationIcon className="w-6 h-6"/>} label="Reputacja" value={`${stats.reputation}/100`} color="text-yellow-400" />
      <StatCard icon={<GateIcon className="w-6 h-6"/>} label="Bramki" value={stats.gates} color="text-teal-400" />
      <StatCard icon={<AircraftStandIcon className="w-6 h-6"/>} label="Stanowiska" value={stats.stands} color="text-orange-400" />
    </div>
  );
};

export default Dashboard;
