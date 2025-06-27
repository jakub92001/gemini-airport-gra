
import {
  AirportState,
  SaveData,
  Flight,
  FlightStatus,
  FlightType,
  Vehicle,
  VehicleType,
  VehicleStatus,
  ContractType,
  Contract,
} from "../../../types.ts";
import {
  MAP_LAYOUT,
  GROUND_SERVICE_MINUTES,
  FLIGHT_INCOME,
  FLIGHT_REPUTATION_BONUS,
  FLIGHT_REPUTATION_PENALTY,
} from "../../../constants.ts";
import {
  fetchWeather,
  generateContracts,
  generateFlightsForDay,
} from "../../../services/geminiService.ts";

function getPath(start: {x:number, y:number}, end: {x:number, y:number}, parkingType?: 'gate' | 'stand') {
    const path: {x:number, y:number}[] = [];
    const taxiY = parkingType === 'stand' ? MAP_LAYOUT.taxiway.standConnectorY : MAP_LAYOUT.taxiway.gateConnectorY;
    
    if (start.y !== taxiY) path.push({ x: start.x, y: taxiY });
    if (start.x !== end.x) path.push({ x: end.x, y: taxiY });
    if (end.y !== taxiY) path.push({ x: end.x, y: end.y });
    return path;
};

function addToLog(state: AirportState, message: string): AirportState {
    console.log(`[Game Log]: ${message}`);
    return {
        ...state,
        log: [...state.log.slice(-100), message],
    }
}

export async function runGameTick(saveData: SaveData, now: Date): Promise<SaveData> {
  let { gameState, activeContracts, availableContracts } = saveData;
  
  // Ensure dates are Date objects
  gameState.gameTime = new Date(gameState.gameTime);
  gameState.flights.forEach(f => f.actualTime = new Date(f.actualTime));
  
  const timeDiffMinutes = (now.getTime() - gameState.gameTime.getTime()) / (1000 * 60);
  if (timeDiffMinutes <= 0) return saveData;

  // --- New Day Check ---
  if (now.getUTCDate() !== gameState.gameTime.getUTCDate()) {
    gameState = addToLog(gameState, `Rozpoczął się nowy dzień. Dzień ${gameState.day + 1}.`);

    let contractIncome = 0;
    let contractCosts = 0;
    const updatedActiveContracts = activeContracts.map(c => ({
      ...c,
      daysRemaining: (c.daysRemaining ?? c.duration) - 1,
    }));
    
    updatedActiveContracts.forEach(c => {
      c.terms.moneyPerDay > 0 ? contractIncome += c.terms.moneyPerDay : contractCosts += c.terms.moneyPerDay;
    });
    
    const dailyIncome = contractIncome + contractCosts;
    gameState.money += dailyIncome;
    gameState = addToLog(gameState, `Przetworzono umowy. Dochód netto: ${dailyIncome.toLocaleString()} $.`);

    const expiredContracts = updatedActiveContracts.filter(c => c.daysRemaining !== undefined && c.daysRemaining <= 0);
    const remainingContracts = updatedActiveContracts.filter(c => c.daysRemaining === undefined || c.daysRemaining > 0);
    expiredContracts.forEach(c => gameState = addToLog(gameState, `Umowa z ${c.name} wygasła.`));
    activeContracts = remainingContracts;

    const [weather, newContracts, newFlightData] = await Promise.all([
      fetchWeather(gameState.location!),
      generateContracts(gameState),
      generateFlightsForDay(gameState, activeContracts.filter(c => c.type === ContractType.Airline)),
    ]);
    
    const newFlights = newFlightData.map((f: Partial<Flight>) => {
        const [hours, minutes] = f.scheduledTime!.split(':').map(Number);
        const actualTime = new Date(now);
        actualTime.setUTCHours(hours, minutes, 0, 0);
        if (actualTime < now) {
            actualTime.setDate(actualTime.getDate() + 1);
        }
        return { ...f, id: crypto.randomUUID(), status: FlightStatus.Scheduled, parking: null, position: { x: -100, y: -100 }, path: [], pathProgress: 0, servicingTimer: GROUND_SERVICE_MINUTES, actualTime, services: { followMe: false, catering: false, fuel: false, baggage: false, boarding: false, pushback: false } } as Flight;
    }).sort((a,b) => a.actualTime.getTime() - b.actualTime.getTime());

    availableContracts = [...availableContracts, ...newContracts];
    gameState.flights = [...gameState.flights, ...newFlights].sort((a,b) => a.actualTime.getTime() - b.actualTime.getTime());
    gameState.weather = weather;
    gameState.day += 1;
    gameState = addToLog(gameState, `Nowa pogoda: ${weather.description}. Otrzymano nowy harmonogram lotów i umowy.`);
  }

  // --- Vehicle Logic ---
  gameState.vehicles = gameState.vehicles.map(v => {
    if (v.path.length > 0) {
      // simplified movement, server does not need smooth animation
      v.position = v.path[v.path.length - 1];
      v.path = [];
      if(v.status === VehicleStatus.ToJob) v.status = VehicleStatus.AtJob;
      else if (v.status === VehicleStatus.Returning) {
          v.status = VehicleStatus.Idle;
          v.flightId = null;
      }
    }
    return v;
  });

  // --- Flight Logic ---
  let tempGameState = { ...gameState }; // To pass for logging
  gameState.flights = gameState.flights.map(flight => {
    const minutesToScheduled = (flight.actualTime.getTime() - now.getTime()) / (1000 * 60);

    switch(flight.status) {
        case FlightStatus.Scheduled:
            if (minutesToScheduled <= 30 && flight.type === FlightType.Arrival) {
                flight.status = FlightStatus.Inbound;
                flight.path = [MAP_LAYOUT.taxiway.runwayArrivalConnector];
                flight.position = { x: MAP_LAYOUT.width + 50, y: MAP_LAYOUT.taxiway.runwayArrivalConnector.y };
            }
            break;
        case FlightStatus.Inbound:
            if (minutesToScheduled <= 0) {
                if (flight.parking) {
                    flight.status = FlightStatus.AwaitingFollowMe;
                } else {
                    flight.status = FlightStatus.Diverted;
                    tempGameState.reputation = Math.max(0, tempGameState.reputation - FLIGHT_REPUTATION_PENALTY);
                    tempGameState = addToLog(tempGameState, `Lot ${flight.flightNumber} został przekierowany! Brak miejsca. Reputacja -${FLIGHT_REPUTATION_PENALTY}.`);
                }
            }
            break;
        case FlightStatus.AwaitingFollowMe:
            const followMeCar = tempGameState.vehicles.find(v => v.type === VehicleType.FollowMe && v.status === VehicleStatus.Idle);
            if (followMeCar) {
                followMeCar.status = VehicleStatus.ToJob;
                followMeCar.flightId = flight.id;
                const parkingPos = flight.parking!.type === 'gate' ? MAP_LAYOUT.getGatePosition(flight.parking!.id - 1, tempGameState.gates) : MAP_LAYOUT.getStandPosition(flight.parking!.id - 1, tempGameState.stands);
                followMeCar.path = [parkingPos];
                flight.status = FlightStatus.TaxiingToParking;
                flight.path = getPath(flight.position, parkingPos, flight.parking!.type);
                flight.pathProgress = 0;
            }
            break;
        case FlightStatus.TaxiingToParking:
             const assignedFollowMe = tempGameState.vehicles.find(v => v.flightId === flight.id && v.type === VehicleType.FollowMe);
             if(assignedFollowMe?.status === VehicleStatus.AtJob) {
                 flight.status = FlightStatus.Servicing;
                 assignedFollowMe.status = VehicleStatus.Returning;
                 assignedFollowMe.path = [MAP_LAYOUT.vehicleDepot];
             }
            break;
        case FlightStatus.Servicing:
            flight.servicingTimer -= timeDiffMinutes;
            if(flight.servicingTimer <= 0) {
                if (flight.type === FlightType.Departure) {
                    if (minutesToScheduled <= 0) flight.status = FlightStatus.AwaitingPushback;
                } else {
                    tempGameState.money += FLIGHT_INCOME;
                    tempGameState.reputation = Math.min(100, tempGameState.reputation + FLIGHT_REPUTATION_BONUS);
                    tempGameState = addToLog(tempGameState, `Lot ${flight.flightNumber} zakończył obsługę. +${FLIGHT_INCOME} $, +${FLIGHT_REPUTATION_BONUS} reputacji.`);
                    flight.status = FlightStatus.Completed;
                }
            }
            break;
        case FlightStatus.AwaitingPushback:
            const tug = tempGameState.vehicles.find(v => v.type === VehicleType.PushbackTug && v.status === VehicleStatus.Idle);
            if(tug) {
                tug.status = VehicleStatus.ToJob;
                tug.flightId = flight.id;
                const taxiY = flight.parking!.type === 'stand' ? MAP_LAYOUT.taxiway.standConnectorY : MAP_LAYOUT.taxiway.gateConnectorY;
                const pushbackPos = {x: flight.position.x, y: taxiY};
                tug.path = [pushbackPos];
                flight.status = FlightStatus.PushingBack;
                flight.path = [pushbackPos];
            }
            break;
        case FlightStatus.PushingBack:
            const assignedTug = tempGameState.vehicles.find(v => v.flightId === flight.id && v.type === VehicleType.PushbackTug);
            if(assignedTug?.status === VehicleStatus.AtJob) {
                flight.status = FlightStatus.TaxiingToRunway;
                assignedTug.status = VehicleStatus.Returning;
                assignedTug.path = [MAP_LAYOUT.vehicleDepot];
                flight.path = [MAP_LAYOUT.taxiway.runwayDepartureConnector];
            }
            break;
        case FlightStatus.TaxiingToRunway:
            if(flight.position.x === MAP_LAYOUT.taxiway.runwayDepartureConnector.x) {
                flight.status = FlightStatus.TakingOff;
                flight.path = [{x: -50, y: MAP_LAYOUT.taxiway.runwayDepartureConnector.y}];
            }
            break;
        case FlightStatus.TakingOff:
             if(flight.position.x === -50) {
                flight.status = FlightStatus.Departed;
             }
            break;
    }

    // Simplified movement for server-side logic
    if (flight.path.length > 0) {
      flight.position = flight.path[flight.path.length - 1];
      flight.path = [];
    }

    return flight;
  });

  gameState.reputation = tempGameState.reputation;
  gameState.money = tempGameState.money;
  gameState.log = tempGameState.log;
  gameState.vehicles = tempGameState.vehicles;
  
  gameState.flights = gameState.flights.filter(f => f.status !== FlightStatus.Completed && f.status !== FlightStatus.Departed);
  gameState.gameTime = now;

  return { gameState, activeContracts, availableContracts };
}

