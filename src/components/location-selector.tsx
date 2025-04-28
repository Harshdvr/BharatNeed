
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, LocateFixed, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAddress, type Location } from '@/services/geocoding'; // Assuming geocoding service exists

// Placeholder locations - replace with dynamic fetching/search results
const locations = [
  { value: 'mumbai', label: 'Mumbai, Maharashtra' },
  { value: 'delhi', label: 'Delhi, NCR' },
  { value: 'bangalore', label: 'Bangalore, Karnataka' },
  { value: 'pune', label: 'Pune, Maharashtra' },
  { value: 'kolkata', label: 'Kolkata, West Bengal' },
  { value: 'chennai', label: 'Chennai, Tamil Nadu' },
  { value: 'hyderabad', label: 'Hyderabad, Telangana'},
  { value: 'ahmedabad', label: 'Ahmedabad, Gujarat'},
];

// TODO: Persist selected location (e.g., localStorage, context)
export default function LocationSelector() {
  const [open, setOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<typeof locations[0] | null>(locations[0]); // Default to Mumbai
  const [searchValue, setSearchValue] = React.useState('');
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);
  const { toast } = useToast();

  const handleSelectLocation = (location: typeof locations[0]) => {
    setSelectedLocation(location);
    setOpen(false);
    setSearchValue('');
     // TODO: Update global state/context if needed
     console.log("Selected Location:", location.label);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Current Coordinates:', { latitude, longitude });
        try {
           // Replace with actual reverse geocoding API call
          const geoLoc: Location = { lat: latitude, lng: longitude };
          const address = await getAddress(geoLoc); // Use the service
          const locationLabel = `${address.city}, ${address.state}`; // Format as needed
          // Create a temporary location object or find a match
          const currentLocation = { value: 'current', label: locationLabel };
          setSelectedLocation(currentLocation);
          toast({
             title: 'Location Updated',
             description: `Set to current location: ${locationLabel}`,
           });
        } catch (error) {
            console.error("Error getting address from coordinates:", error);
            toast({
                title: 'Error Fetching Location',
                description: 'Could not determine address from your location.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingLocation(false);
            setOpen(false); // Close popover after attempting
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        let description = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
             description = 'Please allow location access in your browser settings.';
        }
        toast({
          title: 'Location Access Denied',
          description: description,
          variant: 'destructive',
        });
        setIsLoadingLocation(false);
      }
    );
  };

   // Filter locations based on search input
   const filteredLocations = React.useMemo(() => {
    if (!searchValue) return locations;
    return locations.filter(loc =>
      loc.label.toLowerCase().includes(searchValue.toLowerCase())
    );
   }, [searchValue]);


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
            {selectedLocation ? selectedLocation.label : 'Select Location...'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command shouldFilter={false} /* We handle filtering manually */ >
          <CommandInput
            placeholder="Search location..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
               <CommandItem
                    key="current-location"
                    value="use-current-location"
                    onSelect={handleUseCurrentLocation}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isLoadingLocation}
                >
                    <LocateFixed className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                    <span>{isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}</span>
                </CommandItem>
              {filteredLocations.map((location) => (
                <CommandItem
                  key={location.value}
                  value={location.label} // Use label for searching within Command
                  onSelect={() => handleSelectLocation(location)}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <span>{location.label}</span>
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
