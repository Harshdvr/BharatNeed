/**
 * Interface representing a suggestion item.
 */
 /* Represents a geographical location with latitude and longitude coordinates.
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
 * Interface representing a suggested location.
 */
export interface Suggestion {
  value: string; // Unique identifier, can be a formatted address or a location ID
  label: string; // Display label, the full address
}

/**
 * Asynchronously retrieves a list of location suggestions based on a search term.
 *
 * @param searchTerm - The term to search for.
 * @returns A promise that resolves to an array of Suggestion objects.
 */
export async function getSuggestions(searchTerm: string): Promise<Suggestion[]> {
  if (!searchTerm || searchTerm.trim() === "") {
    return [];
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key not found.");
    return [];
  }
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchTerm
      )}&key=${apiKey}`
    );

    const data = await response.json();
    if (data.status === "OK") {
      return data.results.map((result: any) => ({
        value: result.formatted_address,
        label: result.formatted_address,
      }));
    }
  } catch (error) {
      console.error('Error fetching suggestions:', error);
  }
  return [];
  
}

/**
 * Asynchronously retrieves address information for a given location, removed from scope
 *
 * @param location The location for which to retrieve address data.
 * @returns A promise that resolves to an Address object containing city, state and country.
 */
export async function getAddress(location: Location): Promise<Address> {
  // TODO: Implement this by calling an API.

}
