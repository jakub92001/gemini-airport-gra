

import { AirportState, Location, WeatherCode, VehicleType, UpgradeType, VehicleStatus } from './types';

export const LOCATIONS: Location[] = [
    { name: 'Krakow', latitude: 50.06, longitude: 19.94 },
    { name: 'Warszawa', latitude: 52.23, longitude: 21.01 },
    { name: 'Gdansk', latitude: 54.35, longitude: 18.64 },
];

export const GAME_NAME = "Lotnisko Gemini";

// Core game loop timing
export const TICK_INTERVAL_MS = 1000; // 1 second per tick
export const GAME_MINUTES_PER_TICK = 1; // Each tick advances game time by 1 minute

// Gameplay balance
export const GROUND_SERVICE_MINUTES = 60; // How long a flight is serviced
export const FLIGHT_INCOME = 750;
export const FLIGHT_REPUTATION_BONUS = 1;
export const FLIGHT_REPUTATION_PENALTY = 5;
export const WEATHER_DELAY_CHANCE_LOW = 0.1;
export const WEATHER_DELAY_CHANCE_MEDIUM = 0.3;
export const WEATHER_DELAY_CHANCE_HIGH = 0.6;


export const INITIAL_AIRPORT_STATE: AirportState = {
  money: 150000,
  reputation: 50,
  day: 1,
  gates: 4,
  stands: 2,
  vehicles: [
    { id: crypto.randomUUID(), type: VehicleType.FollowMe, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.PushbackTug, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.Stairs, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.PassengerBus, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.CateringTruck, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.FuelTruck, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
    { id: crypto.randomUUID(), type: VehicleType.BaggageCart, status: VehicleStatus.Idle, flightId: null, position: {x: 850, y: 50}, path:[], pathProgress: 0},
  ],
  log: ["Witamy w Lotnisku Gemini! Twoje lotnisko w Krakowie jest gotowe do operacji."],
  gameTime: new Date(),
  flights: [],
  location: null,
  weather: null,
};

export const UPGRADE_COSTS: Record<UpgradeType, { cost: number; reputation: number }> = {
  [UpgradeType.Gate]: { cost: 25000, reputation: 2 },
  [UpgradeType.AircraftStand]: { cost: 15000, reputation: 1 },
};

export const VEHICLE_COSTS: Record<VehicleType, { cost: number; sell: number; }> = {
    [VehicleType.FollowMe]: { cost: 5000, sell: 2000 },
    [VehicleType.PushbackTug]: { cost: 7500, sell: 3000 },
    [VehicleType.PassengerBus]: { cost: 12000, sell: 5000 },
    [VehicleType.CateringTruck]: { cost: 8000, sell: 3200 },
    [VehicleType.FuelTruck]: { cost: 10000, sell: 4000 },
    [VehicleType.BaggageCart]: { cost: 4000, sell: 1500 },
    [VehicleType.Stairs]: { cost: 6000, sell: 2500 },
}

export const DEFAULT_LOCATION: Location = { name: 'Krakow', latitude: 50.06, longitude: 19.94 };

export const MAP_LAYOUT = {
    width: 1000,
    height: 600,
    runway: { x: 100, y: 300, width: 800, height: 50 },
    terminal: { x: 250, y: 100, width: 500, height: 80 },
    vehicleDepot: { x: 850, y: 50 },
    taxiway: {
        mainPath: [{x: 900, y: 250}, {x: 100, y: 250}],
        runwayArrivalConnector: {x: 900, y: 325},
        runwayDepartureConnector: {x: 100, y: 325},
        gateConnectorY: 210,
        standConnectorY: 410,
    },
    getGatePosition: (gateIndex: number, totalGates: number) => {
        const spacing = 450 / totalGates;
        return {
            x: 275 + (gateIndex * spacing),
            y: 180,
        }
    },
    getStandPosition: (standIndex: number, totalStands: number) => {
        const spacing = 800 / (totalStands + 1);
        return {
            x: 150 + (standIndex * spacing),
            y: 450,
        }
    }
};

export const WMO_WEATHER_MAP: Record<number, WeatherCode> = {
    0: { description: 'Czyste niebo', icon: 'Sun', severity: 'None' },
    1: { description: 'Głównie bezchmurnie', icon: 'Sun', severity: 'None' },
    2: { description: 'Częściowe zachmurzenie', icon: 'Cloud', severity: 'None' },
    3: { description: 'Zachmurzenie całkowite', icon: 'Cloud', severity: 'Low' },
    45: { description: 'Mgła', icon: 'Fog', severity: 'Medium' },
    48: { description: 'Mgła osadzająca szadź', icon: 'Fog', severity: 'Medium' },
    51: { description: 'Lekka mżawka', icon: 'Rain', severity: 'Low' },
    53: { description: 'Umiarkowana mżawka', icon: 'Rain', severity: 'Low' },
    55: { description: 'Gęsta mżawka', icon: 'Rain', severity: 'Low' },
    61: { description: 'Lekki deszcz', icon: 'Rain', severity: 'Low' },
    63: { description: 'Umiarkowany deszcz', icon: 'Rain', severity: 'Medium' },
    65: { description: 'Silny deszcz', icon: 'Rain', severity: 'High' },
    80: { description: 'Lekkie przelotne opady deszczu', icon: 'Rain', severity: 'Low' },
    81: { description: 'Umiarkowane przelotne opady deszczu', icon: 'Rain', severity: 'Medium' },
    82: { description: 'Gwałtowne przelotne opady deszczu', icon: 'Rain', severity: 'High' },
    71: { description: 'Lekkie opady śniegu', icon: 'Snow', severity: 'Medium' },
    73: { description: 'Umiarkowane opady śniegu', icon: 'Snow', severity: 'High' },
    75: { description: 'Silne opady śniegu', icon: 'Snow', severity: 'High' },
    77: { description: 'Ziarna śniegu', icon: 'Snow', severity: 'Medium' },
    85: { description: 'Lekkie przelotne opady śniegu', icon: 'Snow', severity: 'Medium' },
    86: { description: 'Silne przelotne opady śniegu', icon: 'Snow', severity: 'High' },
    95: { description: 'Burza', icon: 'Storm', severity: 'High' },
    96: { description: 'Burza z lekkim gradem', icon: 'Storm', severity: 'High' },
    99: { description: 'Burza z silnym gradem', icon: 'Storm', severity: 'High' },
};