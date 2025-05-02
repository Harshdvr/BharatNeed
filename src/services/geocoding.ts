
/**
 * Interface representing a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Interface representing address components (City, State).
 */
export interface Address {
  city: string;
  state: string;
  country?: string; // Optional: Add country if needed
}

/**
 * Interface representing a suggested location from Place Autocomplete.
 */
export interface Suggestion {
  value: string; // Unique identifier (Place ID or Coordinates for current location)
  label: string; // Display label (Formatted Address/Description)
}

/**
 * Asynchronously retrieves a list of location suggestions using Google Place Autocomplete API.
 *
 * @param searchTerm - The term to search for.
 * @returns A promise that resolves to an array of Suggestion objects.
 */
export async function getSuggestions(searchTerm: string): Promise<Suggestion[]> {
  if (!searchTerm || searchTerm.trim().length < 3) {
    return [];
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) not found in environment variables.");
    throw new Error("API key missing"); // Throw error to indicate configuration issue
  }

  // Restrict results to India and prioritize city-level results
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchTerm)}&types=(cities)&components=country:IN&key=${apiKey}`;

  try {
    console.log(`Calling Place Autocomplete API: ${url}`); // Debug log
    const response = await fetch(url);

    // Check if the response status is OK *before* trying to parse JSON
    if (!response.ok) {
        let errorBody = 'Could not read error body';
        try {
            errorBody = await response.text(); // Try reading text first for better error details
        } catch (readError) {
           console.error("Error reading response body:", readError);
        }
        console.error(`Error fetching suggestions: ${response.status} ${response.statusText}`, errorBody);
        // Throw a more specific error based on status code if possible
        throw new Error(`Failed to fetch suggestions. Status: ${response.status}. Check API Key, CORS, or Network.`);
    }

    const data = await response.json(); // Now safe to parse JSON
    console.log("Place Autocomplete API response:", data); // Debug log

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Place Autocomplete API Error:", data.status, data.error_message);
      throw new Error(data.error_message || `Place Autocomplete API Error: ${data.status}`);
    }

    if (data.status === "ZERO_RESULTS" || !data.predictions) {
      return [];
    }

    return data.predictions.map((item: any) => ({
      label: item.description,
      value: item.place_id, // Use place_id as the unique value
    }));

  } catch (error: any) { // Catch network errors (like Failed to fetch) or errors thrown above
    console.error('Error in getSuggestions:', error);
     // Add a more specific check for network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error("Network error: Check internet connection, CORS settings, or API key restrictions (HTTP referrers).");
        // You might want to throw a more user-friendly error or return an empty array here
        throw new Error("Network error while fetching location suggestions.");
    }
    // Re-throw other errors
    throw error;
  }
}


/**
 * Asynchronously retrieves address components (city, state) for given coordinates using Google Geocoding API.
 *
 * @param location The location (latitude, longitude) for which to retrieve address data.
 * @returns A promise that resolves to an Address object containing city and state.
 */
export async function getAddress({ lat, lng }: Location): Promise<Address> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) not found.");
    throw new Error("API key missing");
  }

  // Prioritize results types for city and state
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_1&key=${apiKey}`;

  try {
    console.log(`Calling Geocoding API: ${url}`); // Debug log
    const response = await fetch(url);

     // Check if the response status is OK *before* trying to parse JSON
    if (!response.ok) {
        let errorBody = 'Could not read error body';
        try {
            errorBody = await response.text(); // Try reading text first for better error details
        } catch (readError) {
           console.error("Error reading response body:", readError);
        }
      console.error(`Error fetching reverse geocode: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch address. Status: ${response.status}. Check API Key, CORS, or Network.`);
    }

    const data = await response.json();
     console.log("Geocoding API response:", data); // Debug log

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Geocoding API Error:", data.status, data.error_message);
      throw new Error(data.error_message || `Geocoding API Error: ${data.status}`);
    }

    if (data.status === "ZERO_RESULTS" || !data.results || data.results.length === 0) {
       console.warn("No results found for reverse geocoding:", { lat, lng });
       throw new Error("Could not determine address for the current location.");
    }

    // Find the most relevant result (often the first one works well with filtered types)
    const result = data.results[0];
    const components = result?.address_components || [];

    // Find city (locality or administrative_area_level_3 often work)
    const cityComponent = components.find((c: any) =>
      c.types.includes('locality') || c.types.includes('administrative_area_level_3')
    );
    // Find state (administrative_area_level_1)
    const stateComponent = components.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    );
     // Find country (optional)
     const countryComponent = components.find((c: any) =>
       c.types.includes('country')
     );

    const city = cityComponent?.long_name || '';
    const state = stateComponent?.short_name || ''; // Use short_name for state typically (e.g., MH)
    const country = countryComponent?.short_name || '';

    if (!city || !state) {
       console.warn("Could not extract city or state from geocoding results:", components);
       // Attempt fallback using formatted_address if needed - often less reliable
       const formattedAddress = result?.formatted_address || '';
       throw new Error(`Could not determine city/state. Best guess: ${formattedAddress}`);
    }

    return { city, state, country };

  } catch (error: any) { // Catch network errors or errors thrown above
    console.error('Error in getAddress:', error);
    // Add a more specific check for network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error("Network error: Check internet connection, CORS settings, or API key restrictions (HTTP referrers).");
        throw new Error("Network error while getting address from coordinates.");
    }
    throw error; // Re-throw the error
  }
}
