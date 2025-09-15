import React, { useState, useEffect } from 'react';
import { usePostcoder } from '@/hooks/usePostcoder';
import { AddressLookupResult } from '@/lib/postcoderService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Building, Home, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AddressLookupProps {
  onAddressSelect?: (address: AddressLookupResult) => void;
  placeholder?: string;
  className?: string;
  showCountrySelector?: boolean;
  defaultCountry?: string;
  required?: boolean;
  disabled?: boolean;
}

export const AddressLookup: React.FC<AddressLookupProps> = ({
  onAddressSelect,
  placeholder = "Enter postcode or street address",
  className = "",
  showCountrySelector = true,
  defaultCountry = "UK",
  required = false,
  disabled = false
}) => {
  const [searchType, setSearchType] = useState<'postcode' | 'street'>('postcode');
  const [postcode, setPostcode] = useState('');
  const [street, setStreet] = useState('');
  const [town, setTown] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [showResults, setShowResults] = useState(false);

  const {
    loading,
    error,
    addresses,
    selectedAddress,
    lookupByPostcode,
    lookupByStreet,
    selectAddress,
    clearError,
    reset
  } = usePostcoder();

  // Countries supported by Postcoder
  const supportedCountries = [
    { code: 'UK', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'IE', name: 'Ireland' }
  ];

  // Handle search
  const handleSearch = async () => {
    if (searchType === 'postcode') {
      if (!postcode.trim()) return;
      await lookupByPostcode(postcode.trim(), country);
    } else {
      if (!street.trim() || !town.trim()) return;
      await lookupByStreet(street.trim(), town.trim(), country);
    }
    setShowResults(true);
  };

  // Handle address selection
  const handleAddressSelect = (address: AddressLookupResult) => {
    selectAddress(address);
    setShowResults(false);
    onAddressSelect?.(address);
    
    // Auto-fill form fields if they exist
    if (searchType === 'postcode') {
      setPostcode(address.postcode);
    } else {
      setStreet(address.street);
      setTown(address.posttown);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    clearError();
    if (field === 'postcode') setPostcode(value);
    if (field === 'street') setStreet(value);
    if (field === 'town') setTown(value);
    if (field === 'country') setCountry(value);
  };

  // Reset form
  const handleReset = () => {
    reset();
    setPostcode('');
    setStreet('');
    setTown('');
    setShowResults(false);
    setSelectedAddress(null);
  };

  // Auto-search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format address for display
  const formatAddress = (address: AddressLookupResult) => {
    const parts = [
      address.number,
      address.street,
      address.dependentstreet,
      address.posttown,
      address.county,
      address.postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Type Selector */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={searchType === 'postcode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('postcode')}
          disabled={disabled}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Postcode
        </Button>
        <Button
          type="button"
          variant={searchType === 'street' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('street')}
          disabled={disabled}
        >
          <Building className="h-4 w-4 mr-2" />
          Street & Town
        </Button>
      </div>

      {/* Search Form */}
      <div className="space-y-3">
        {searchType === 'postcode' ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter postcode (e.g., SW1A 1AA)"
              value={postcode}
              onChange={(e) => handleInputChange('postcode', e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              required={required}
              className="flex-1"
            />
            {showCountrySelector && (
              <Select value={country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCountries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              onClick={handleSearch} 
              disabled={disabled || loading || !postcode.trim()}
              className="px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Street name"
                value={street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                required={required}
                className="flex-1"
              />
              {showCountrySelector && (
                <Select value={country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCountries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Town/City"
                value={town}
                onChange={(e) => handleInputChange('town', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                required={required}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={disabled || loading || !street.trim() || !town.trim()}
                className="px-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            ×
          </Button>
        </div>
      )}

      {/* Address Results */}
      {showResults && addresses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="h-4 w-4" />
              Found {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addresses.map((address, index) => (
              <div
                key={index}
                className={`p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedAddress?.id === address.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{formatAddress(address)}</p>
                    {address.organisation && (
                      <Badge variant="outline" className="text-xs">
                        {address.organisation}
                      </Badge>
                    )}
                  </div>
                  {selectedAddress?.id === address.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Address Display */}
      {selectedAddress && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Selected Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{formatAddress(selectedAddress)}</p>
              {selectedAddress.organisation && (
                <p className="text-sm text-muted-foreground">
                  Organisation: {selectedAddress.organisation}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Change Address
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowResults(true)}>
                  Show All Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && addresses.length === 0 && !loading && !error && (
        <div className="text-center p-6 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No addresses found</p>
          <p className="text-sm">Try a different search term or location</p>
        </div>
      )}
    </div>
  );
};