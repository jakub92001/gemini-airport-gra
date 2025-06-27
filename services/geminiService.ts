import { GoogleGenAI } from "@google/genai";
import { AirportState, Contract, ContractType, Flight, FlightType, Location, Weather } from '../types';
import { WMO_WEATHER_MAP } from "../constants";

// This is a Deno-specific global. We declare it here to allow this shared
// file to be type-checked in a non-Deno (Vite/Node) environment.
declare const Deno: any;

function getApiKey(): string | null {
    let apiKey: string | undefined;

    // Check for Deno environment (used in Supabase Edge Functions)
    if (typeof Deno !== 'undefined' && Deno.env && typeof Deno.env.get === 'function') {
      apiKey = Deno.env.get("API_KEY");
    }
    // Check for Vite/browser environment
    else if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_API_KEY;
    }
    // Check for browser/Node-like environment with process.env
    else if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY;
    }

    if (!apiKey) {
        console.warn("Klucz API Gemini nie jest skonfigurowany. Funkcje AI będą wyłączone. Ustaw VITE_API_KEY (dla klienta) lub API_KEY (dla serwera) w zmiennych środowiskowych.");
        return null;
    }
    return apiKey;
}

let ai: GoogleGenAI | null = null;
let aiInitializationError: string | null = null;

const apiKey = getApiKey();

if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (e: any) {
        aiInitializationError = e.message;
        console.error("Błąd inicjalizacji Gemini AI:", aiInitializationError);
        ai = null; // Ensure ai is null on error
    }
} else {
    aiInitializationError = "Klucz API Gemini nie jest skonfigurowany. Funkcje AI są niedostępne.";
}


const MAX_RETRIES = 3;

function parseJsonFromText(text: string): any {
    let jsonStr = text.trim();

    // Try to find JSON block within markdown fences
    const fenceRegex = /^```(?:json)?\s*\n(.*?)\n\s*```$/s;
    const fenceMatch = jsonStr.match(fenceRegex);
    if (fenceMatch && fenceMatch[1]) {
      jsonStr = fenceMatch[1].trim();
    }

    // If no fences, try to find the start and end of a JSON object/array
    if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) {
        const firstBracket = jsonStr.indexOf('[');
        const firstBrace = jsonStr.indexOf('{');

        let start = -1;
        if (firstBracket === -1) start = firstBrace;
        else if (firstBrace === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstBrace);

        if (start !== -1) {
            const lastBracket = jsonStr.lastIndexOf(']');
            const lastBrace = jsonStr.lastIndexOf('}');
            const end = Math.max(lastBracket, lastBrace);

            if (end > start) {
                jsonStr = jsonStr.substring(start, end + 1);
            }
        }
    }

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Błąd parsowania odpowiedzi JSON:", e);
      console.error("Oryginalny tekst:", text);
      throw new Error("Otrzymano niepoprawnie sformatowany JSON z API.");
    }
}

export const fetchWeather = async (location: Location): Promise<Weather> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API request failed with status ${response.status}`);
        }
        const data = await response.json();
        const weatherCode = data.current.weather_code;
        const weatherInfo = WMO_WEATHER_MAP[weatherCode] || { description: 'Unknown weather', icon: 'Cloud', severity: 'Low' };

        return {
            temperature: data.current.temperature_2m,
            weatherCode: weatherCode,
            windSpeed: data.current.wind_speed_10m,
            description: weatherInfo.description,
            severity: weatherInfo.severity,
        };
    } catch (error) {
        console.error("Error fetching weather:", error);
        // Fallback weather
        return {
            temperature: 15,
            weatherCode: 3,
            windSpeed: 10,
            description: 'Zachmurzenie całkowite',
            severity: 'Low',
        };
    }
};

export const generateContracts = async (airportState: AirportState): Promise<Contract[]> => {
    const fallbackContracts = [
        { id: crypto.randomUUID(), name: "Tanie Skrzydła", type: ContractType.Airline, description: "Tania linia lotnicza szukająca nowego węzła.", terms: { moneyPerDay: 80 * airportState.gates, reputationEffect: 1, cancellationPenalty: 2 }, duration: 30 },
        { id: crypto.randomUUID(), name: "Podstawowy Dostawca Paliwa", type: ContractType.Fuel, description: "Niezawodne dostawy paliwa w standardowej cenie.", terms: { moneyPerDay: -1500, reputationEffect: 0, cancellationPenalty: 1 }, duration: 60 },
    ];

    if (!ai) {
        console.error("Nie można wygenerować umów, Gemini AI nie zostało zainicjowane.", aiInitializationError);
        return fallbackContracts;
    }

    const locationName = airportState.location?.name;
    if (!locationName) {
        console.error("Nie można wygenerować umów bez nazwy lokalizacji. Używam danych zapasowych.");
        return fallbackContracts;
    }

    // Explicitly define a variable typed as string to avoid TS2345
    const validLocationName: string = locationName;

    const prompt = `
    You are a game master for an airport management simulator. Based on the current state of the airport provided below, generate a list of 3-4 potential business contracts.
    The contracts should be a JSON array with objects following this structure: { "id": string (unique UUID), "name": string, "type": "Airline" | "Catering" | "Fuel", "description": string, "terms": { "moneyPerDay": number, "reputationEffect": number, "cancellationPenalty": number }, "duration": number (in days) }.
    - 'id' should be a unique UUID string for each contract.
    - 'moneyPerDay' is the daily cash flow delta. Positive for income (like an airline), negative for cost (like a premium catering service).
    - 'reputationEffect' is a one-time change to reputation upon signing.
    - 'cancellationPenalty' is a one-time reputation hit if the contract is cancelled early.
    - Make contract terms and names appropriate for the airport's size and reputation. A small, low-reputation airport gets offers from budget airlines, while a large, prestigious one attracts major international carriers. Use real-world airline names relevant to the airport's location: ${validLocationName}.
    - Ensure 'type' is one of the three specified values: "Airline", "Catering", "Fuel".
    - Generate a mix of contract types.

    Current Airport State:
    ${JSON.stringify({ day: airportState.day, money: airportState.money, reputation: airportState.reputation, gates: airportState.gates, stands: airportState.stands })}

    IMPORTANT: Your response must be ONLY the raw JSON array, without any surrounding text, explanations, or markdown fences (e.g. \`\`\`json).
    `;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 1.1,
                }
            });
            const contractData = parseJsonFromText(response.text);

            if (!Array.isArray(contractData)) {
                throw new Error("Invalid contract structure received from API: not an array.");
            }
            // Add client-side UUIDs to be safe
            return contractData.map(c => ({...c, id: crypto.randomUUID()}));

        } catch (error) {
            console.warn(`Attempt ${i + 1} to generate contracts failed. Retrying...`, error);
        }
    }

    console.error("Error generating contracts after all retries. Using fallback data.");
    return fallbackContracts;
}

export const generateFlightsForDay = async (airportState: AirportState, activeAirlineContracts: Contract[]): Promise<Partial<Flight>[]> => {
    const airlineNames = activeAirlineContracts.length > 0 ? activeAirlineContracts.map(c => c.name) : ["Generic Air"];
    const fallbackLocation = "the airport";
    const fallbackFlights = [
        { airline: airlineNames[0], flightNumber: `${airlineNames[0].substring(0,2).toUpperCase()} 101`, type: FlightType.Arrival, scheduledTime: "08:30", origin: "Miasto A", destination: airportState.location?.name || fallbackLocation },
        { airline: airlineNames[0], flightNumber: `${airlineNames[0].substring(0,2).toUpperCase()} 102`, type: FlightType.Departure, scheduledTime: "09:15", origin: airportState.location?.name || fallbackLocation, destination: "Miasto A" },
        { airline: airlineNames[0], flightNumber: `${airlineNames[0].substring(0,2).toUpperCase()} 203`, type: FlightType.Arrival, scheduledTime: "17:00", origin: "Miasto B", destination: airportState.location?.name || fallbackLocation },
        { airline: airlineNames[0], flightNumber: `${airlineNames[0].substring(0,2).toUpperCase()} 204`, type: FlightType.Departure, scheduledTime: "18:30", origin: airportState.location?.name || fallbackLocation, destination: "Miasto B" },
    ];

    if (!ai) {
        console.error("Nie można wygenerować lotów, Gemini AI nie zostało zainicjowane.", aiInitializationError);
        return fallbackFlights;
    }

    const locationName = airportState.location?.name;
    if (!locationName) {
        console.error("Nie można wygenerować lotów bez nazwy lokalizacji. Używam danych zapasowych.");
        return fallbackFlights;
    }

    const flightCount = Math.max(2, Math.floor((airportState.gates * 2) + (airportState.reputation / 10)));

    // Explicitly define a variable typed as string to avoid TS2345
    const validLocationName: string = locationName;

    const prompt = `
    You are a flight schedule coordinator for an airport management simulator. Based on the airport's capacity and contracted airlines, create a flight schedule for the next 24 hours.

    Airport Location: ${validLocationName}
    Contracted Airlines:
    - ${airlineNames.join(', ')}

    Instructions:
    - Generate a list of exactly ${flightCount} flights.
    - The output MUST be a JSON array of flight objects with this exact structure: { "flightNumber": string, "airline": string, "type": "Arrival" | "Departure", "scheduledTime": "HH:MM", "origin": string | null, "destination": string | null }.
    - Use ONLY the airlines from the provided list.
    - For Arrivals, the 'destination' must be '${validLocationName}' and 'origin' should be a realistic city for that airline to fly from.
    - For Departures, the 'origin' must be '${validLocationName}' and 'destination' should be a realistic city for that airline to fly to.
    - Flight numbers should be plausible for the airline (e.g., "GA 123" for Generic Air).
    - Distribute flights throughout a 24-hour period (00:00 to 23:59), with some clustering during morning (06:00-09:00) and evening (17:00-20:00) peak hours.
    - Ensure a mix of Arrivals and Departures.

    IMPORTANT: Your response must be ONLY the raw JSON array, without any surrounding text, explanations, or markdown fences (e.g. \`\`\`json).
    `;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.8,
                }
            });
            const flightData = parseJsonFromText(response.text);

            if (!Array.isArray(flightData)) {
                throw new Error("Invalid flight data received from API: not an array.");
            }
            return flightData;
        } catch (error) {
            console.warn(`Attempt ${i + 1} to generate flights failed. Retrying...`, error);
        }
    }

    console.error("Error generating flights after all retries. Using fallback data.");
    return fallbackFlights;
};
