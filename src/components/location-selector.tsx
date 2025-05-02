
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, LocateFixed, Check, Loader2 } from 'lucide-react'; // Added Loader2
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getSuggestions, getAddress, type Location, type Suggestion } from '@/services/geocoding'; // Adjusted imports

// Key for localStorage
const LOCATION_STORAGE_KEY = 'userSelectedLocation';

export default function LocationSelector () {
  const [open, setOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<Suggestion | null>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [isLoadingCurrent, setIsLoadingCurrent] = React.useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false); // Track client-side

  // --- Load saved location on mount (Client-side only) ---
  React.useEffect(() => {
    setIsClient(true); // Component has mounted
    const savedLocationString = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocationString) {
      try {
        const savedLocation = JSON.parse(savedLocationString);
        // Basic validation
        if (savedLocation && savedLocation.value && savedLocation.label) {
           setSelectedLocation(savedLocation);
           console.log("Loaded saved location:", savedLocation.label);
        } else {
           localStorage.removeItem(LOCATION_STORAGE_KEY); // Remove invalid data
        }
      } catch (e) {
        console.error("Error parsing saved location:", e);
        localStorage.removeItem(LOCATION_STORAGE_KEY); // Clear corrupted data
      }
    } else {
      // Optionally: Auto-detect location on first load if nothing saved
      // handleUseCurrentLocation(false); // Pass false to avoid closing popover if open
       console.log("No saved location found.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Save location to localStorage whenever it changes ---
  React.useEffect(() => {
    if (isClient && selectedLocation) { // Only run on client and if location is selected
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selectedLocation));
      console.log("Saved location:", selectedLocation.label);
    }
  }, [selectedLocation, isClient]);

  // --- Fetch suggestions based on search input ---
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    if (value.length < 3) {
      setSuggestions([]);
      setIsLoadingSuggestions(false); // Ensure loading stops
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await getSuggestions(value); // Use the function for real API calls
      setSuggestions(newSuggestions);
    } catch (error: any) {
      console.error("Error fetching suggestions:", error);
       toast({
           title: 'Error Fetching Locations',
           description: error.message || 'Could not load location suggestions.',
           variant: 'destructive'
       });
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // --- Handle selecting a location from suggestions ---
  const handleSelectLocation = (location: Suggestion) => {
    setSelectedLocation(location);
    setOpen(false);
    setSearchValue('');
    setSuggestions([]); // Clear suggestions after selection
    console.log("Selected Location:", location.label);
     // TODO: Update global state/context/trigger data refetch if needed
  };

  // --- Handle detecting and using the current location ---
  const handleUseCurrentLocation = (closePopover = true) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Current Coordinates:', { latitude, longitude });
        try {
          const geoLoc: Location = { lat: latitude, lng: longitude };
          const address = await getAddress(geoLoc); // Use the function for real API calls
          const locationLabel = `${address.city}, ${address.state}`; // Format as needed
          // Create a suggestion object for the current location
          const currentLocation: Suggestion = { value: `coords:${latitude},${longitude}`, label: locationLabel };
          setSelectedLocation(currentLocation);
          toast({
            title: 'Location Updated',
            description: `Set to current location: ${locationLabel}`,
          });
          if (closePopover) setOpen(false); // Close popover after successful detection
          setSearchValue('');
          setSuggestions([]);
        } catch (error: any) {
          console.error("Error getting address from coordinates:", error);
          toast({
            title: 'Error Fetching Address',
            description: error.message || 'Could not determine address from your location.',
            variant: 'destructive'
          });
        } finally {
          setIsLoadingCurrent(false);
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        let description = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          description = 'Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
           description = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
           description = 'Getting location timed out. Please try again.';
        }
        toast({
          title: 'Location Access Issue',
          description: description,
          variant: 'destructive'
        });
        setIsLoadingCurrent(false);
      },
      { timeout: 10000 } // Add a timeout for geolocation request
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] sm:w-[200px] justify-start h-9 text-muted-foreground hover:text-foreground"
        >
          <MapPin className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {/* Only render selectedLocation label on client */}
            {isClient && selectedLocation ? selectedLocation.label : 'Select Location...'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command shouldFilter={false}> {/* Disable default filtering */}
          <CommandInput
            placeholder='Search city, state...'
            value={searchValue}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {isLoadingSuggestions ? 'Loading...' : (searchValue.length < 3 ? 'Type more to search' : 'No location found.')}
            </CommandEmpty>
            <CommandGroup>
              {/* Use Current Location Item */}
              <CommandItem
                key="current-location"
                value="__use-current-location__" // Use a unique, non-conflicting value
                onSelect={() => handleUseCurrentLocation()} // Call the handler directly
                className="flex items-center gap-2 cursor-pointer"
                disabled={isLoadingCurrent}
              >
                {isLoadingCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                <span>{isLoadingCurrent ? 'Getting Location...' : 'Use Current Location'}</span>
              </CommandItem>

              {/* Suggestions List */}
              {suggestions.map((location) => (
                <CommandItem
                  key={location.value} // Use place_id or a unique ID as key
                  value={location.label} // Value used for filtering if enabled, label is fine here
                  onSelect={() => handleSelectLocation(location)}
                  className="flex justify-between items-center cursor-pointer gap-2"
                >
                  <span className="truncate">{location.label}</span>
                  <Check
                    className={cn(
                      'h-4 w-4',
                      selectedLocation?.value === location.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
