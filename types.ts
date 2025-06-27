export interface Location {
    name: string;
    latitude: number;
    longitude: number;
}

export interface Weather {
    temperature: number;
    windSpeed: number;
    weatherCode: number;
    description: string;
    severity: 'None' | 'Low' | 'Medium' | 'High';
}

export interface WeatherCode {
    description: string;
    icon: 'Sun' | 'Cloud' | 'Rain' | 'Storm' | 'Snow' | 'Fog';
    severity: 'None' | 'Low' | 'Medium' | 'High';
}

export enum VehicleType {
    FollowMe = 'Follow-Me Car',
    PushbackTug = 'Pushback Tug',
    PassengerBus = 'Passenger Bus',
    CateringTruck = 'Catering Truck',
    FuelTruck = 'Fuel Truck',
    BaggageCart = 'Baggage Cart',
    Stairs = 'Passenger Stairs',
}

export enum VehicleStatus {
    Idle = 'Idle',
    ToJob = 'To Job',
    AtJob = 'At Job',
    Returning = 'Returning',
}

export interface Vehicle {
    id: string;
    type: VehicleType;
    status: VehicleStatus;
    position: { x: number, y: number };
    path: { x: number, y: number }[];
    pathProgress: number;
    flightId: string | null; // The flight this vehicle is assigned to
}


export interface AirportState {
  money: number;
  reputation: number;
  day: number;
  gates: number;
  stands: number;
  vehicles: Vehicle[];
  log: string[];
  gameTime: Date;
  flights: Flight[];
  location: Location | null;
  weather: Weather | null;
}

export enum UpgradeType {
  Gate = 'Gate',
  AircraftStand = 'Aircraft Stand',
}

export enum ContractType {
  Airline = 'Airline',
  Catering = 'Catering',
  Fuel = 'Fuel',
}

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  description: string;
  terms: {
    moneyPerDay: number; // Positive for income, negative for cost
    reputationEffect: number; // One-time effect on signing
    cancellationPenalty?: number; // One-time reputation hit
  };
  duration: number; // in days
  daysRemaining?: number;
}

export enum FlightType {
    Arrival = 'Arrival',
    Departure = 'Departure',
}

export enum FlightStatus {
    Scheduled = 'Scheduled',
    Inbound = 'Inbound',
    AwaitingFollowMe = 'Awaiting Follow-Me',
    TaxiingToParking = 'Taxiing to Parking',
    Servicing = 'Servicing', // Catering, Fuel, Baggage being loaded
    Boarding = 'Boarding', // Bus and stairs phase
    AwaitingPushback = 'Awaiting Pushback',
    PushingBack = 'Pushing Back',
    TaxiingToRunway = 'Taxiing to Runway',
    TakingOff = 'Taking Off',
    Departed = 'Departed',
    Delayed = 'Delayed',
    Diverted = 'Diverted',
    Cancelled = 'Cancelled',
    Completed = 'Completed',
}

export interface Flight {
    id: string;
    flightNumber: string;
    airline: string;
    type: FlightType;
    origin?: string;
    destination?: string;
    status: FlightStatus;
    scheduledTime: string;
    actualTime: Date;
    parking: { type: 'gate' | 'stand', id: number } | null;
    position: { x: number, y: number };
    path: { x: number, y: number }[];
    pathProgress: number;
    servicingTimer: number; // minutes remaining at gate/stand
    services: {
        followMe: boolean;
        catering: boolean;
        fuel: boolean;
        baggage: boolean;
        boarding: boolean;
        pushback: boolean;
    }
}

export interface SaveData {
  gameState: AirportState;
  activeContracts: Contract[];
  availableContracts: Contract[];
}