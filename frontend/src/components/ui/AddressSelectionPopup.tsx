import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Search, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressData {
  formattedAddress: string;
  streetNumber?: string;
  route?: string;
  locality?: string;
  administrativeAreaLevel1?: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface AddressSelectionPopupProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const AddressSelectionPopup: React.FC<AddressSelectionPopupProps> = ({
  onAddressSelect,
  placeholder = "Enter postcode or address",
  label = "Service Address",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock address suggestions - replace with actual Google Places API
  const mockAddresses: AddressData[] = [
    {
      formattedAddress: "123 Oxford Street, London, W1D 1BS",
      streetNumber: "123",
      route: "Oxford Street",
      locality: "London",
      administrativeAreaLevel1: "Greater London",
      country: "United Kingdom",
      postalCode: "W1D 1BS",
      latitude: 51.5154,
      longitude: -0.1419,
      placeId: "mock_1"
    },
    {
      formattedAddress: "456 Regent Street, London, W1B 4DA",
      streetNumber: "456",
      route: "Regent Street",
      locality: "London",
      administrativeAreaLevel1: "Greater London",
      country: "United Kingdom",
      postalCode: "W1B 4DA",
      latitude: 51.5144,
      longitude: -0.1375,
      placeId: "mock_2"
    },
    {
      formattedAddress: "789 Piccadilly, London, W1J 9EH",
      streetNumber: "789",
      route: "Piccadilly",
      locality: "London",
      administrativeAreaLevel1: "Greater London",
      country: "United Kingdom",
      postalCode: "W1J 9EH",
      latitude: 51.5080,
      longitude: -0.1400,
      placeId: "mock_3"
    }
  ];

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter mock addresses based on query
      const filtered = mockAddresses.filter(addr => 
        addr.formattedAddress.toLowerCase().includes(query.toLowerCase()) ||
        addr.postalCode?.toLowerCase().includes(query.toLowerCase()) ||
        addr.locality?.toLowerCase().includes(query.toLowerCase())
      );

      setSuggestions(filtered);
    } catch (err) {
      setError('Failed to search addresses. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
    setSearchQuery(address.formattedAddress);
    onAddressSelect(address);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedAddress(null);
    setSearchQuery('');
    setSuggestions([]);
    setError(null);
  };

  const formatAddress = (address: AddressData) => {
    const parts = [];
    if (address.streetNumber && address.route) {
      parts.push(`${address.streetNumber} ${address.route}`);
    }
    if (address.locality) {
      parts.push(address.locality);
    }
    if (address.postalCode) {
      parts.push(address.postalCode);
    }
    return parts.join(', ');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedAddress && "text-muted-foreground"
            )}
            onClick={() => setIsOpen(true)}
          >
            <MapPin className="mr-2 h-4 w-4" />
            {selectedAddress ? (
              <span className="truncate">{formatAddress(selectedAddress)}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for address or postcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Searching...</span>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  {error}
                </div>
              )}

              {!isLoading && !error && suggestions.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {suggestions.map((address) => (
                    <button
                      key={address.placeId}
                      onClick={() => handleAddressSelect(address)}
                      className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatAddress(address)}
                          </p>
                          {address.locality && (
                            <p className="text-xs text-gray-500 mt-1">
                              {address.locality}, {address.administrativeAreaLevel1}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isLoading && !error && searchQuery && suggestions.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No addresses found. Try a different search term.
                </div>
              )}

              {selectedAddress && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Selected:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium">{formatAddress(selectedAddress)}</p>
                        {selectedAddress.postalCode && (
                          <p className="text-xs mt-1">Postcode: {selectedAddress.postalCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};





