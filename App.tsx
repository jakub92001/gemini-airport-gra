
import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AirportState, UpgradeType, Contract, ContractType, Flight, VehicleType, Location, SaveData, VehicleStatus } from './types';
import { INITIAL_AIRPORT_STATE, GAME_NAME, UPGRADE_COSTS, VEHICLE_COSTS, LOCATIONS } from './constants';
import { generateContracts, generateFlightsForDay, fetchWeather } from './services/geminiService';
import Dashboard from './components/Dashboard';
import AirportMapView from './components/AirportMapView';
import UpgradePanel from './components/UpgradePanel';
import LogPanel from './components/LogPanel';
import ContractsPanel from './components/ContractsPanel';
import FlightBoard from './components/FlightBoard';
import LocationSelector from './components/LocationSelector';
import FleetPanel from './components/FleetPanel';
import { supabase } from './supabase';
import Auth from './components/Auth';


type MainPanelTab = 'upgrades' | 'contracts' | 'log' | 'fleet';
type GamePhase = 'loading_save' | 'location_selection' | 'playing';

const upgradeTypeTranslations: Record<UpgradeType, string> = {
    [UpgradeType.Gate]: 'Bramka',
    [UpgradeType.AircraftStand]: 'Stanowisko postojowe',
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


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<AirportState>(INITIAL_AIRPORT_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('loading_save');
  const [activeMainTab, setActiveMainTab] = useState<MainPanelTab>('upgrades');
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);

  useEffect(() => {
    if (!supabase) { // Guard against uninitialized client
        setIsLoading(false);
        return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(!session) {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
          // Reset game if user logs out
          setGameState(INITIAL_AIRPORT_STATE);
          setAvailableContracts([]);
          setActiveContracts([]);
          setGamePhase('loading_save');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const addToLog = useCallback((message: string) => {
    // This is a fire-and-forget call for the client, server is the source of truth for logs
    setGameState(prev => ({ ...prev, log: [...prev.log.slice(-100), message] }));
  }, []);

  const loadGame = useCallback(async () => {
    if (!session || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('save_data')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        const saveData: SaveData = data.save_data;
        // Re-hydrate Date objects
        saveData.gameState.gameTime = new Date(saveData.gameState.gameTime);
        saveData.gameState.flights.forEach(f => {
          f.actualTime = new Date(f.actualTime);
        });

        setGameState(saveData.gameState);
        setActiveContracts(saveData.activeContracts || []);
        setAvailableContracts(saveData.availableContracts || []);
        if(gamePhase !== 'playing') setGamePhase('playing');
      } else {
        setGamePhase('location_selection');
      }
    } catch (error) {
      console.error('Błąd wczytywania gry:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToLog(`Błąd wczytywania zapisanej gry: ${errorMessage}. Zaczynam od nowa.`);
      setGamePhase('location_selection');
    } finally {
        if (isLoading) setIsLoading(false);
    }
  }, [session, addToLog, gamePhase, isLoading]);

  // Initial load effect
  useEffect(() => {
    if (session && gamePhase === 'loading_save') {
      loadGame();
    }
  }, [session, loadGame, gamePhase]);
  
  // Game state polling effect
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const pollInterval = setInterval(() => {
        loadGame();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [gamePhase, loadGame]);

  const saveGame = useCallback(async (stateToSave: AirportState, contractsToSave: Contract[], availableContractsToSave: Contract[]) => {
    if (!session || !supabase || isSaving) return;
    setIsSaving(true);
    
    const currentSaveData: SaveData = {
      gameState: stateToSave,
      activeContracts: contractsToSave,
      availableContracts: availableContractsToSave,
    };
    
    try {
      const { error } = await supabase
        .from('game_saves')
        .upsert({ user_id: session.user.id, save_data: currentSaveData, updated_at: new Date().toISOString() });
      if (error) throw error;
      // addToLog("Postępy zapisano pomyślnie!"); // Maybe too noisy
    } catch(error) {
      console.error("Błąd zapisywania gry:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToLog(`Nie udało się zapisać postępów: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [session, addToLog, isSaving]);


  const handleStartGame = useCallback(async (location: Location) => {
    addToLog(`Lokalizacja ustawiona na ${location.name}. Pobieranie początkowych danych...`);
    
    const initialTime = new Date();
    initialTime.setSeconds(0, 0);

    const weather = await fetchWeather(location);
    addToLog(`Aktualna pogoda w ${location.name}: ${weather.description}, ${weather.temperature}°C.`);

    const newGameState = { ...INITIAL_AIRPORT_STATE, location, weather, gameTime: initialTime };

    // In the new architecture, we let the server-side function handle flight/contract generation on the first tick.
    // For a smoother start, we can pre-populate a few.
    const initialContracts = await generateContracts(newGameState);

    setGameState(newGameState);
    setAvailableContracts(initialContracts);
    setActiveContracts([]);
    setGamePhase('playing');

    // Perform initial save
    await saveGame(newGameState, [], initialContracts);

  }, [addToLog, saveGame]);

  const handleUserAction = useCallback(async (action: (prevState: AirportState) => AirportState, newActiveContracts?: Contract[], newAvailableContracts?: Contract[]) => {
    const newState = action(gameState);
    const finalActive = newActiveContracts ?? activeContracts;
    const finalAvailable = newAvailableContracts ?? availableContracts;
    
    setGameState(newState);
    if(newActiveContracts) setActiveContracts(newActiveContracts);
    if(newAvailableContracts) setAvailableContracts(newAvailableContracts);

    await saveGame(newState, finalActive, finalAvailable);
  }, [gameState, activeContracts, availableContracts, saveGame]);

  const handleUpgrade = useCallback((type: UpgradeType) => {
    const cost = UPGRADE_COSTS[type].cost;
    const reputation = UPGRADE_COSTS[type].reputation;

    if (gameState.money < cost) {
        addToLog("Niewystarczające środki na zakup ulepszenia.");
        return;
    }

    addToLog(`Zakupiono nową ${upgradeTypeTranslations[type]} za ${cost.toLocaleString()} $.`);
    handleUserAction(prev => ({
        ...prev,
        money: prev.money - cost,
        reputation: Math.min(100, prev.reputation + reputation),
        gates: prev.gates + (type === UpgradeType.Gate ? 1 : 0),
        stands: prev.stands + (type === UpgradeType.AircraftStand ? 1 : 0),
    }));
  }, [gameState.money, handleUserAction, addToLog]);

  const handleBuyVehicle = useCallback((type: VehicleType) => {
    const cost = VEHICLE_COSTS[type].cost;
    if (gameState.money < cost) {
        addToLog("Niewystarczające środki na zakup pojazdu.");
        return;
    }
    addToLog(`Zakupiono nowy ${vehicleTypeTranslations[type]} za ${cost.toLocaleString()} $.`);
    handleUserAction(prev => ({
        ...prev,
        money: prev.money - cost,
        vehicles: [...prev.vehicles, {
            id: crypto.randomUUID(),
            type,
            status: VehicleStatus.Idle,
            flightId: null,
            position: {x: 850, y: 50}, // Start at depot
            path: [],
            pathProgress: 0
        }]
    }));
  }, [gameState.money, handleUserAction, addToLog]);

  const handleSellVehicle = useCallback((type: VehicleType) => {
      const sellPrice = VEHICLE_COSTS[type].sell;
      const vehicleIndex = gameState.vehicles.findIndex(v => v.type === type && v.status === 'Idle');
      if (vehicleIndex === -1) {
          addToLog(`Brak dostępnego bezczynnego ${vehicleTypeTranslations[type]} do sprzedaży.`);
          return;
      }
      addToLog(`Sprzedano ${vehicleTypeTranslations[type]} za ${sellPrice.toLocaleString()} $.`);
      handleUserAction(prev => {
          const newVehicles = [...prev.vehicles];
          newVehicles.splice(vehicleIndex, 1);
          return {
              ...prev,
              money: prev.money + sellPrice,
              vehicles: newVehicles
          }
      });
  }, [gameState.vehicles, handleUserAction, addToLog]);
  
  const handleSignContract = useCallback((contract: Contract) => {
    addToLog(`Podpisano ${contract.duration}-dniową umowę z ${contract.name}. Reputacja zmieniona o ${contract.terms.reputationEffect}.`);
    const newActive = [...activeContracts, { ...contract, daysRemaining: contract.duration }];
    const newAvailable = availableContracts.filter(c => c.id !== contract.id);

    handleUserAction(prev => ({
        ...prev,
        reputation: Math.max(0, Math.min(100, prev.reputation + contract.terms.reputationEffect)),
    }), newActive, newAvailable);
  }, [activeContracts, availableContracts, handleUserAction, addToLog]);
  
  const handleCancelContract = useCallback((contractId: string) => {
      const contract = activeContracts.find(c => c.id === contractId);
      if(!contract) return;
      
      const penalty = contract.terms.cancellationPenalty || 0;
      addToLog(`Anulowano umowę z ${contract.name}. Kara reputacji: -${penalty}.`);

      const newActive = activeContracts.filter(c => c.id !== contractId);
      handleUserAction(prev => ({
          ...prev,
          reputation: Math.max(0, prev.reputation - penalty),
      }), newActive, availableContracts);

  }, [activeContracts, availableContracts, handleUserAction, addToLog]);

  const handleAssignParking = useCallback((flightId: string, parkingType: 'gate' | 'stand', parkingId: number) => {
    let logMessage = "";
    handleUserAction(prev => {
        const newFlights = [...prev.flights];
        const assignedFlightIndex = newFlights.findIndex(f => f.id === flightId);

        if (assignedFlightIndex === -1) return prev;
        
        const oldParking = newFlights[assignedFlightIndex].parking;
        if(oldParking){
            const oldPairedDepartureIndex = newFlights.findIndex(f => f.type === 'Departure' && f.parking?.type === oldParking.type && f.parking?.id === oldParking.id && f.airline === newFlights[assignedFlightIndex].airline);
            if(oldPairedDepartureIndex !== -1) newFlights[oldPairedDepartureIndex].parking = null;
        }


        const assignedFlight = { ...newFlights[assignedFlightIndex], parking: { type: parkingType, id: parkingId } };
        newFlights[assignedFlightIndex] = assignedFlight;
        
        logMessage = `Przypisano ${parkingType === 'gate' ? 'bramkę' : 'stanowisko'} ${parkingId} do lotu ${assignedFlight.flightNumber}.`;

        if (assignedFlight.type === 'Arrival') {
            const departureFlightIndex = newFlights
                .map((f, index) => ({...f, originalIndex: index}))
                .filter(f => 
                    f.type === 'Departure' &&
                    f.airline === assignedFlight.airline &&
                    f.status === 'Scheduled' &&
                    f.parking === null &&
                    new Date(f.actualTime) > new Date(assignedFlight.actualTime)
                )
                .sort((a,b) => new Date(a.actualTime).getTime() - new Date(b.actualTime).getTime())
                [0]?.originalIndex;


            if (departureFlightIndex !== undefined) {
                newFlights[departureFlightIndex].parking = { type: parkingType, id: parkingId };
                logMessage += ` Miejsce parkingowe zarezerwowane dla odpowiadającego odlotu ${newFlights[departureFlightIndex].flightNumber}.`;
            }
        }
        addToLog(logMessage);
        return {
            ...prev,
            flights: newFlights
        };
    });
  }, [handleUserAction, addToLog]);

  const handleLogout = async () => {
    if (!supabase) return;
    addToLog("Wylogowywanie...");
    await supabase.auth.signOut();
  }
  
  if (isLoading) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }
  
  if (gamePhase === 'loading_save') {
     return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
                <p className="text-xl text-sky-300">Wczytywanie zapisanych danych...</p>
            </div>
        </div>
    );
  }

  if (gamePhase === 'location_selection') {
    return <LocationSelector onSelect={handleStartGame} />;
  }

  const tabButtonStyle = "px-4 py-2 font-semibold transition-colors duration-200 rounded-t-md focus:outline-none w-full text-sm sm:text-base";
  const activeTabClass = "bg-slate-800/60 text-sky-300";
  const inactiveTabClass = "bg-slate-900/50 text-slate-400 hover:bg-slate-800/70";
  
  const getOccupiedGates = () => new Set(gameState.flights.filter(f => f.parking?.type === 'gate' && f.status !== 'Completed' && f.status !== 'Departed').map(f => f.parking!.id));
  const getOccupiedStands = () => new Set(gameState.flights.filter(f => f.parking?.type === 'stand' && f.status !== 'Completed' && f.status !== 'Departed').map(f => f.parking!.id));

  const occupiedGates = getOccupiedGates();
  const availableGates = Array.from({length: gameState.gates}, (_, i) => i + 1).filter(g => !occupiedGates.has(g));

  const occupiedStands = getOccupiedStands();
  const availableStands = Array.from({length: gameState.stands}, (_, i) => i + 1).filter(g => !occupiedStands.has(g));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 lg:p-6 font-sans">
      <div className="max-w-8xl mx-auto space-y-4">
        <header className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-white">{gameState.location?.name} International</h1>
            <div className="flex items-center gap-4">
                {isSaving && (
                    <div className="flex items-center gap-2 text-sky-400 animate-pulse">
                        <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-sky-400"></div>
                        Zapisywanie...
                    </div>
                )}
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 bg-red-800 hover:bg-red-700 text-white shadow-md"
                >
                    Wyloguj
                </button>
            </div>
        </header>
        
        <main className="space-y-6">
          <Dashboard stats={gameState} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-rows-[min-content,1fr] gap-6">
               <FlightBoard 
                flights={gameState.flights} 
                onAssignParking={handleAssignParking}
                availableGates={availableGates}
                availableStands={availableStands}
                gameTime={new Date(gameState.gameTime)}
              />
            </div>
            
            <div className="flex flex-col space-y-6">
                <AirportMapView gameState={gameState} />
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700">
                    <div className="flex border-b border-slate-700">
                        <button onClick={() => setActiveMainTab('upgrades')} className={`${tabButtonStyle} ${activeMainTab === 'upgrades' ? activeTabClass : inactiveTabClass}`}>Infra</button>
                        <button onClick={() => setActiveMainTab('fleet')} className={`${tabButtonStyle} ${activeMainTab === 'fleet' ? activeTabClass : inactiveTabClass}`}>Flota</button>
                        <button onClick={() => setActiveMainTab('contracts')} className={`${tabButtonStyle} ${activeMainTab === 'contracts' ? activeTabClass : inactiveTabClass}`}>Umowy</button>
                        <button onClick={() => setActiveMainTab('log')} className={`${tabButtonStyle} ${activeMainTab === 'log' ? activeTabClass : inactiveTabClass}`}>Dziennik</button>
                    </div>
                    <div className="p-4 h-[22rem] overflow-y-auto">
                      {activeMainTab === 'upgrades' && <UpgradePanel money={gameState.money} gates={gameState.gates} stands={gameState.stands} onUpgrade={handleUpgrade} />}
                      {activeMainTab === 'fleet' && <FleetPanel money={gameState.money} vehicles={gameState.vehicles} onBuy={handleBuyVehicle} onSell={handleSellVehicle} />}
                      {activeMainTab === 'contracts' && <ContractsPanel availableContracts={availableContracts} activeContracts={activeContracts} onSign={handleSignContract} onCancel={handleCancelContract} />}
                      {activeMainTab === 'log' && <LogPanel log={gameState.log} />}
                    </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
