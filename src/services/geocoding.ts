
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
  value: string; // Unique identifier (Place ID)
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
    // Optionally throw an error or return a specific error indicator
    // throw new Error("API key missing");
    return []; // Return empty array if key is missing
  }

  // Consider adding '&components=country:IN' to restrict results to India
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchTerm)}&types=(cities)&components=country:IN&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Handle HTTP errors (like 4xx, 5xx)
      const errorBody = await response.text(); // Try to get more details
      console.error(`Error fetching suggestions: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch suggestions. Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      // Handle API-specific errors (like INVALID_REQUEST, OVER_QUERY_LIMIT)
      console.error("Google Place Autocomplete API Error:", data.status, data.error_message);
      throw new Error(data.error_message || `Place Autocomplete API Error: ${data.status}`);
    }

    if (data.status === "ZERO_RESULTS" || !data.predictions) {
      return []; // No suggestions found
    }

    // Map predictions to the Suggestion format
    return data.predictions.map((item: any) => ({
      label: item.description,
      value: item.place_id, // Use place_id as the unique value
    }));

  } catch (error) {
    console.error('Error in getSuggestions:', error);
    // Re-throw or return empty array/error object based on desired handling
    // throw error;
    return [];
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
    throw new Error("API key missing"); // Throw error for reverse geocoding as it's crucial
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error fetching reverse geocode: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch address. Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Geocoding API Error:", data.status, data.error_message);
      throw new Error(data.error_message || `Geocoding API Error: ${data.status}`);
    }

    if (data.status === "ZERO_RESULTS" || !data.results || data.results.length === 0) {
       console.warn("No results found for reverse geocoding:", { lat, lng });
       // Return default or throw error based on requirement
       return { city: "Unknown", state: "N/A" };
    }

    // Extract city and state from the first result's address components
    const components = data.results[0]?.address_components || [];

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
       // Attempt fallback using formatted_address if needed
       const formattedAddress = data.results[0]?.formatted_address || '';
       // Basic split, might need refinement
       const parts = formattedAddress.split(', ');
       return {
          city: city || parts[parts.length - 3] || 'Unknown', // Guess city
          state: state || parts[parts.length - 2]?.split(' ')[0] || 'N/A', // Guess state abbreviation
          country: country || parts[parts.length - 1] || '',
       };
    }

    return { city, state, country };

  } catch (error) {
    console.error('Error in getAddress:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
