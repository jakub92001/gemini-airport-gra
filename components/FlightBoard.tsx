
import React from 'react';
import { Flight, FlightType, FlightStatus } from '../types';

interface FlightBoardProps {
    flights: Flight[];
    onAssignParking: (flightId: string, parkingType: 'gate' | 'stand', parkingId: number) => void;
    availableGates: number[];
    availableStands: number[];
    gameTime: Date;
}

const flightStatusTranslations: Record<FlightStatus, string> = {
    [FlightStatus.Scheduled]: 'Oczekuje',
    [FlightStatus.Inbound]: 'W drodze',
    [FlightStatus.AwaitingFollowMe]: 'Oczekuje na Follow-Me',
    [FlightStatus.TaxiingToParking]: 'Kołowanie na parking',
    [FlightStatus.Servicing]: 'Serwisowanie',
    [FlightStatus.Boarding]: 'Boarding',
    [FlightStatus.AwaitingPushback]: 'Oczekuje na wypchnięcie',
    [FlightStatus.PushingBack]: 'Wypychanie',
    [FlightStatus.TaxiingToRunway]: 'Kołowanie na pas',
    [FlightStatus.TakingOff]: 'Startuje',
    [FlightStatus.Departed]: 'Odlot',
    [FlightStatus.Delayed]: 'Opóźniony',
    [FlightStatus.Diverted]: 'Przekierowany',
    [FlightStatus.Cancelled]: 'Anulowany',
    [FlightStatus.Completed]: 'Zakończony',
};

const getStatusColor = (status: FlightStatus) => {
    switch (status) {
        case FlightStatus.Departed:
        case FlightStatus.TakingOff:
             return 'text-green-400';
        case FlightStatus.Servicing:
        case FlightStatus.Boarding:
        case FlightStatus.PushingBack:
            return 'text-cyan-400';
        case FlightStatus.TaxiingToParking:
        case FlightStatus.TaxiingToRunway:
            return 'text-blue-400';
        case FlightStatus.AwaitingFollowMe:
        case FlightStatus.AwaitingPushback:
            return 'text-purple-400';
        case FlightStatus.Delayed:
        case FlightStatus.Diverted:
        case FlightStatus.Cancelled:
            return 'text-red-400 animate-pulse';
        case FlightStatus.Completed:
            return 'text-slate-500';
        case FlightStatus.Scheduled:
        case FlightStatus.Inbound:
        default:
            return 'text-yellow-400';
    }
}

const FlightRow: React.FC<{flight: Flight, onAssignParking: (flightId: string, parkingType: 'gate' | 'stand', parkingId: number) => void, availableGates: number[], availableStands: number[], gameTime: Date}> = ({ flight, onAssignParking, availableGates, availableStands, gameTime }) => {
    const minutesToScheduled = (flight.actualTime.getTime() - gameTime.getTime()) / (1000 * 60);
    const canAssign = flight.type === 'Arrival' ? minutesToScheduled > 5 : true;
    
    const handleParkingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [type, id] = e.target.value.split('-');
        onAssignParking(flight.id, type as 'gate' | 'stand', parseInt(id));
    };

    const hasParkingOptions = availableGates.length > 0 || availableStands.length > 0;
    const currentParkingValue = flight.parking ? `${flight.parking.type}-${flight.parking.id}` : "";

    return (
        <div className="grid grid-cols-6 gap-4 items-center py-2 px-3 text-sm border-b border-slate-700/50 font-mono">
            <div className="text-slate-200">{flight.scheduledTime}</div>
            <div className="text-slate-200 truncate">{flight.airline} {flight.flightNumber}</div>
            <div className="text-slate-200 truncate">{flight.type === FlightType.Arrival ? flight.origin : flight.destination}</div>
            <div className={`${getStatusColor(flight.status)} font-semibold truncate`}>{flightStatusTranslations[flight.status]}</div>
             <div className="text-slate-200 text-center">
                {flight.parking ? (
                    <span className={`px-2 py-1 rounded-full text-white font-bold text-xs ${flight.parking.type === 'gate' ? 'bg-teal-600' : 'bg-orange-600'}`}>
                        {flight.parking.type === 'gate' ? 'B' : 'S'}{flight.parking.id}
                    </span>
                ) : '-'}
            </div>
            <div>
                 {flight.status === FlightStatus.Scheduled && (
                    <select
                        onChange={handleParkingChange}
                        disabled={!canAssign || !hasParkingOptions}
                        value={currentParkingValue}
                        className="bg-slate-700 border border-slate-600 text-white text-xs rounded-md focus:ring-sky-500 focus:border-sky-500 block w-full p-1.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>{!canAssign ? 'Za późno' : hasParkingOptions ? "Przydziel..." : "Brak miejsc"}</option>
                        <optgroup label="Bramki">
                            {availableGates.map(g => <option key={`gate-${g}`} value={`gate-${g}`}>Bramka {g}</option>)}
                        </optgroup>
                         <optgroup label="Stanowiska">
                            {availableStands.map(s => <option key={`stand-${s}`} value={`stand-${s}`}>Stanowisko {s}</option>)}
                        </optgroup>
                    </select>
                 )}
            </div>
        </div>
    )
};

const FlightColumn: React.FC<{title: string, flights: Flight[], onAssignParking: (flightId: string, parkingType: 'gate' | 'stand', parkingId: number) => void, availableGates: number[], availableStands: number[], gameTime: Date}> = ({ title, flights, onAssignParking, availableGates, availableStands, gameTime }) => (
    <div className="bg-slate-900/50 rounded-lg overflow-hidden">
        <h3 className="text-xl font-bold p-3 bg-slate-900 text-sky-300 text-center">{title}</h3>
        <div className="grid grid-cols-6 gap-4 py-2 px-3 text-xs text-slate-400 font-bold uppercase border-b-2 border-slate-700">
            <span>Czas</span>
            <span>Lot</span>
            <span>Z/Do</span>
            <span>Status</span>
            <span className="text-center">Parking</span>
            <span>Akcja</span>
        </div>
        <div className="h-[25vh] overflow-y-auto">
            {flights.length > 0 ? flights.map(f => <FlightRow key={f.id} flight={f} onAssignParking={onAssignParking} availableGates={availableGates} availableStands={availableStands} gameTime={gameTime} />) : <p className="text-center p-8 text-slate-500 italic">Brak lotów w harmonogramie.</p>}
        </div>
    </div>
)

const FlightBoard: React.FC<FlightBoardProps> = ({ flights, onAssignParking, availableGates, availableStands, gameTime }) => {
    
    const arrivals = flights.filter(f => f.type === FlightType.Arrival);
    const departures = flights.filter(f => f.type === FlightType.Departure);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FlightColumn title="Przyloty" flights={arrivals} onAssignParking={onAssignParking} availableGates={availableGates} availableStands={availableStands} gameTime={gameTime} />
                <FlightColumn title="Odloty" flights={departures} onAssignParking={onAssignParking} availableGates={availableGates} availableStands={availableStands} gameTime={gameTime} />
            </div>
        </div>
    );
};

export default FlightBoard;
