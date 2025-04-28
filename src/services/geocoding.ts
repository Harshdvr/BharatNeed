/**
 * Represents a geographical location with latitude and longitude coordinates.
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
 * Represents address information.
 */
export interface Address {
  /**
   * The city of the address.
   */
  city: string;
  /**
   * The state of the address.
   */
  state: string;
  /**
   * The country of the address.
   */
  country: string;
}

/**
 * Asynchronously retrieves address information for a given location.
 *
 * @param location The location for which to retrieve address data.
 * @returns A promise that resolves to an Address object containing city, state and country.
 */
export async function getAddress(location: Location): Promise<Address> {
  // TODO: Implement this by calling an API.

  return {
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
  };
}
