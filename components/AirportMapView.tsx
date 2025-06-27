import React from 'react';
import { AirportState, Flight, FlightType, FlightStatus, Vehicle, VehicleType } from '../types';
import { MAP_LAYOUT } from '../constants';
import { PlaneIcon, FollowMeIcon, PushbackTugIcon, PassengerBusIcon, CateringTruckIcon, FuelTruckIcon, BaggageCartIcon, StairsIcon } from './icons';

interface AirportMapViewProps {
    gameState: AirportState;
}

const VehicleIcon: React.FC<{vehicle: Vehicle}> = ({ vehicle }) => {
    const props = {
        className: "w-5 h-5 absolute transition-all duration-1000 linear text-yellow-300",
        style: {
            left: `${vehicle.position.x - 10}px`,
            top: `${vehicle.position.y - 10}px`,
        }
    }
    switch(vehicle.type) {
        case VehicleType.FollowMe: return <FollowMeIcon {...props} />;
        case VehicleType.PushbackTug: return <PushbackTugIcon {...props} />;
        case VehicleType.PassengerBus: return <PassengerBusIcon {...props} />;
        case VehicleType.CateringTruck: return <CateringTruckIcon {...props} />;
        case VehicleType.FuelTruck: return <FuelTruckIcon {...props} />;
        case VehicleType.BaggageCart: return <BaggageCartIcon {...props} />;
        case VehicleType.Stairs: return <StairsIcon {...props} />;
        default: return null;
    }
}

const AirportMapView: React.FC<AirportMapViewProps> = ({ gameState }) => {
    const { gates, stands, flights, vehicles } = gameState;

    const renderFlight = (flight: Flight) => {
        if (flight.status === FlightStatus.Scheduled || flight.status === FlightStatus.Completed) return null;

        const rotation = (flight.status === FlightStatus.Inbound || flight.status === FlightStatus.AwaitingFollowMe || flight.status === FlightStatus.TaxiingToParking) ? 180 : 0;
        
        return (
            <PlaneIcon 
                key={flight.id}
                className="w-8 h-8 text-white absolute transition-all duration-1000 linear"
                style={{
                    left: `${flight.position.x - 16}px`,
                    top: `${flight.position.y - 16}px`,
                    transform: `rotate(${rotation}deg)`
                }}
            />
        )
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700 h-full min-h-[400px]">
            <svg width="100%" height="100%" viewBox={`0 0 ${MAP_LAYOUT.width} ${MAP_LAYOUT.height}`} className="relative bg-green-900/30 rounded-md">
                {/* Taxiways */}
                <path d={`M ${MAP_LAYOUT.taxiway.mainPath[0].x} ${MAP_LAYOUT.taxiway.mainPath[0].y} L ${MAP_LAYOUT.taxiway.mainPath[1].x} ${MAP_LAYOUT.taxiway.mainPath[1].y}`} stroke="#64748b" strokeWidth="20" />
                <path d={`M ${MAP_LAYOUT.taxiway.runwayArrivalConnector.x} ${MAP_LAYOUT.taxiway.runwayArrivalConnector.y} L ${MAP_LAYOUT.taxiway.runwayArrivalConnector.x} ${MAP_LAYOUT.taxiway.mainPath[0].y}`} stroke="#64748b" strokeWidth="10" />
                <path d={`M ${MAP_LAYOUT.taxiway.runwayDepartureConnector.x} ${MAP_LAYOUT.taxiway.runwayDepartureConnector.y} L ${MAP_LAYOUT.taxiway.runwayDepartureConnector.x} ${MAP_LAYOUT.taxiway.mainPath[1].y}`} stroke="#64748b" strokeWidth="10" />

                {/* Runway */}
                <rect x={MAP_LAYOUT.runway.x} y={MAP_LAYOUT.runway.y} width={MAP_LAYOUT.runway.width} height={MAP_LAYOUT.runway.height} fill="#475569" />
                {[...Array(8)].map((_, i) => (<rect key={i} x={150 + i * 100} y={320} width={50} height={10} fill="#a0aec0"/>))}

                {/* Terminal */}
                <rect x={MAP_LAYOUT.terminal.x} y={MAP_LAYOUT.terminal.y} width={MAP_LAYOUT.terminal.width} height={MAP_LAYOUT.terminal.height} fill="#64748b" rx="10" />
                <text x={MAP_LAYOUT.terminal.x + 10} y={MAP_LAYOUT.terminal.y + 25} fontSize="16" fill="white" className="font-bold">TERMINAL 1</text>
                
                {/* Gates */}
                {Array.from({ length: gates }).map((_, i) => {
                    const pos = MAP_LAYOUT.getGatePosition(i, gates);
                    return (
                        <g key={`gate-${i}`}>
                           <rect x={pos.x} y={MAP_LAYOUT.terminal.y + MAP_LAYOUT.terminal.height} width={10} height={pos.y - (MAP_LAYOUT.terminal.y + MAP_LAYOUT.terminal.height) - MAP_LAYOUT.taxiway.gateConnectorY + 250} fill="#52525b" />
                           <rect x={pos.x - 15} y={pos.y} width={40} height={20} fill="#71717a" rx="5" />
                           <text x={pos.x + 5} y={pos.y + 15} textAnchor="middle" fontSize="12" fill="white">{i + 1}</text>
                           <path d={`M ${pos.x+5} ${pos.y} L ${pos.x+5} ${MAP_LAYOUT.taxiway.gateConnectorY}`} stroke="#64748b" strokeWidth="10" />
                        </g>
                    )
                })}

                {/* Stands */}
                {Array.from({ length: stands }).map((_, i) => {
                    const pos = MAP_LAYOUT.getStandPosition(i, stands);
                    return (
                        <g key={`stand-${i}`}>
                           <rect x={pos.x - 25} y={pos.y - 10} width={50} height={20} fill="#71717a" rx="5" />
                           <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="12" fill="white">S{i + 1}</text>
                           <path d={`M ${pos.x} ${pos.y} L ${pos.x} ${MAP_LAYOUT.taxiway.standConnectorY}`} stroke="#64748b" strokeWidth="10" />
                        </g>
                    )
                })}

                {/* Vehicle Depot */}
                <rect x={MAP_LAYOUT.vehicleDepot.x - 20} y={MAP_LAYOUT.vehicleDepot.y - 10} width={120} height={50} fill="#475569" rx="5" stroke="#64748b" strokeWidth="2" />
                <text x={MAP_LAYOUT.vehicleDepot.x + 40} y={MAP_LAYOUT.vehicleDepot.y + 20} textAnchor="middle" fontSize="12" fill="white">VEHICLE DEPOT</text>
                
                <foreignObject x="0" y="0" width={MAP_LAYOUT.width} height={MAP_LAYOUT.height}>
                    <div className="w-full h-full relative">
                        {flights.map(renderFlight)}
                        {vehicles.map(v => <VehicleIcon key={v.id} vehicle={v} />)}
                    </div>
                </foreignObject>
            </svg>
        </div>
    );
};

export default AirportMapView;