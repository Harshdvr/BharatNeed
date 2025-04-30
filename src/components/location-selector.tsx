
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, LocateFixed, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAddress, type Location } from '@/services/geocoding'; // Assuming geocoding service exists


interface Suggestion {
    value: string;
    label: string;
  }

// TODO: Persist selected location (e.g., localStorage, context)
export default function LocationSelector () {
  const [open, setOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<Suggestion | null>(null); // Default to Mumbai
  const [searchValue, setSearchValue] = React.useState('');
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const { toast } = useToast();

  
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    if(value.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try{
      const newSuggestions = await getAddress({search: value});
      setSuggestions(newSuggestions)
    }catch(e){
      console.error("Error fetching suggestions", e)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  const handleSelectLocation = (location: Suggestion) => {
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
        description: 'Your browser does not support geolocation.',        variant: 'destructive'
      })
      return;
    }
    
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Current Coordinates:', { latitude, longitude });
        try{
           // Replace with actual reverse geocoding API call
          const geoLoc: Location = { lat: latitude, lng: longitude };
          const address = await getAddress(geoLoc); // Use the service
          const locationLabel = `${address.city}, ${address.state}`; // Format as needed
          // Create a temporary location object or find a match
          const currentLocation = { value: 'current', label: locationLabel}
          setSelectedLocation(currentLocation);
          toast({
             title: 'Location Updated',
             description: `Set to current location: ${locationLabel}`,
           });
        } catch (error) {
            console.error("Error getting address from coordinates:", error);
            toast({                title: 'Error Fetching Location',
                description: 'Could not determine address from your location.',                variant: 'destructive'
            })
        }finally{
          setIsLoadingLocation(false);
          setOpen(false) // Close popover after attempting
        }
      }, (error) => {
        console.error("Geolocation Error:", error)
        let description = 'Could not retrieve your location.';        if(error.code === error.PERMISSION_DENIED){
          description = 'Please allow location access in your browser settings.';
        }
        toast({          title: 'Location Access Denied',          description: description,          variant: 'destructive'
        })
        setIsLoadingLocation(false)
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] sm:w-[200px] justify-start h-9 text-muted-foreground hover:text-foreground">
          <MapPin className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate"> 
            {selectedLocation ? selectedLocation.label : 'Select Location...'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command shouldFilter={false} /* We handle filtering manually */ >
          <CommandInput
            placeholder='Search location...'
            value={searchValue}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {isLoadingSuggestions? 'Loading...' : 'No location found.'}
            </CommandEmpty>
            <CommandGroup>
               <CommandItem
                    key="current-location"
                    value="use-current-location"
                    onSelect={handleUseCurrentLocation}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={isLoadingLocation}>
                    <LocateFixed className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                    <span>{isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}</span>                </CommandItem>
              {suggestions.map((location) => (
                <CommandItem
                  key={location.value}
                  value={location.label}
                  onSelect={() => handleSelectLocation(location)}                  

                  className="flex justify-between items-center cursor-pointer gap-2"
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
