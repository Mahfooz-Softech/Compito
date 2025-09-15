import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { usePostcoder } from '@/hooks/usePostcoder';
import { Search, MapPin, Building, Home, Loader2, ChevronRight, Info, ArrowLeft } from 'lucide-react';

interface PostcodeSearchProps {
  onAddressSelect: (address: any) => void;
  onPostcodeSelect?: (postcode: string) => void;
  className?: string;
}

export const PostcodeSearch: React.FC<PostcodeSearchProps> = ({
  onAddressSelect,
  onPostcodeSelect,
  className = ''
}) => {
  const {
    loading,
    error,
    postcodeAreas,
    selectedPostcodeArea,
    addresses,
    searchPostcodesByArea,
    selectPostcodeArea,
    retrieveAddressesByPostcode,
    navigateToPreviousSuggestions,
    navigateToMoreSpecificSuggestions,
    clearError
  } = usePostcoder();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState<'search' | 'postcodes' | 'addresses'>('search');
  const [selectedPostcode, setSelectedPostcode] = useState<string>('');

  // Handle postcode area search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    await searchPostcodesByArea(searchQuery.trim());
    setCurrentStep('postcodes');
  }, [searchQuery, searchPostcodesByArea]);

  // Handle postcode area selection
  const handlePostcodeAreaSelect = useCallback(async (postcodeArea: any) => {
    console.log('Selected postcode area:', postcodeArea);
    
    selectPostcodeArea(postcodeArea);
    
    // Store the selected area for reference
    setSelectedPostcode(postcodeArea.summaryline);
    
    if (onPostcodeSelect) {
      // Pass the full summaryline as the postcode for display purposes
      onPostcodeSelect(postcodeArea.summaryline);
    }
    
    // Check the type to determine action (exact implementation from PostcoderAutocomplete)
    if (postcodeArea.type === 'ADD') {
      // If the type is an address, retrieve it using the id
      console.log('Retrieving addresses for area:', postcodeArea.id);
      await retrieveAddressesByPostcode(postcodeArea.id);
      setCurrentStep('addresses');
    } else {
      // Get more suggestions, using the id as pathfilter
      console.log('Getting more specific suggestions for:', postcodeArea.id);
      await navigateToMoreSpecificSuggestions(postcodeArea.id);
      // Stay on postcodes step to show more specific suggestions
    }
  }, [selectPostcodeArea, retrieveAddressesByPostcode, navigateToMoreSpecificSuggestions, onPostcodeSelect]);

  // Handle address selection
  const handleAddressSelect = useCallback((address: any) => {
    console.log('Raw address object received:', address);
    
    // Format the complete address with all components
    const addressParts = [
      address.addressline1,
      address.addressline2,
      address.addressline3,
      address.addressline4
    ].filter(Boolean);
    
    console.log('Initial address parts:', addressParts);
    
    // Add street, posttown, and county if they exist
    if (address.street && !addressParts.includes(address.street)) {
      addressParts.push(address.street);
      console.log('Added street:', address.street);
    }
    if (address.posttown && !addressParts.includes(address.posttown)) {
      addressParts.push(address.posttown);
      console.log('Added posttown:', address.posttown);
    }
    if (address.county && !addressParts.includes(address.county)) {
      addressParts.push(address.county);
      console.log('Added county:', address.county);
    }
    if (address.postcode && !addressParts.includes(address.postcode)) {
      addressParts.push(address.postcode);
      console.log('Added postcode:', address.postcode);
    }
    
    console.log('Final address parts:', addressParts);
    
    // Create a properly formatted address object
    const formattedAddress = {
      ...address,
      formattedAddress: addressParts.join(', '),
      displayAddress: addressParts.join(', ')
    };
    
    console.log('Formatted address:', formattedAddress);
    onAddressSelect(formattedAddress);
  }, [onAddressSelect]);

  // Reset to search step
  const handleBackToSearch = useCallback(() => {
    setCurrentStep('search');
    setSearchQuery('');
    setSelectedPostcode('');
    clearError();
  }, [clearError]);

  // Reset to postcode selection
  const handleBackToPostcodes = useCallback(() => {
    setCurrentStep('postcodes');
    setSelectedPostcode('');
    clearError();
  }, [clearError]);

  // Navigate to previous suggestions (exact implementation of CACHE navigation)
  const handleBackToPreviousSuggestions = useCallback(async () => {
    await navigateToPreviousSuggestions();
    // Stay on postcodes step to show previous suggestions
  }, [navigateToPreviousSuggestions]);

  // Handle Enter key in search
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Step */}
      {currentStep === 'search' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="postcode-search">Search for a postcode area</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="postcode-search"
                  placeholder="Enter city, town, or area name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Postcode Areas Step */}
      {currentStep === 'postcodes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select a postcode area</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleBackToSearch}>
                Back to Search
              </Button>
            </div>
          </div>
          
          {postcodeAreas.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Found postcode areas using Postcoder API
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {postcodeAreas.map((area, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePostcodeAreaSelect(area)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{area.summaryline}</div>
                      <div className="text-sm text-muted-foreground">{area.locationsummary}</div>
                      {area.count > 1 && (
                        <Badge variant="secondary" className="mt-1">
                          {area.count > 100 ? '100+' : area.count} addresses
                        </Badge>
                      )}
                      {area.type && (
                        <Badge variant="outline" className="ml-2">
                          {area.type === 'ADD' ? 'Address' : 'Area'}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Addresses Step */}
      {currentStep === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Select an address</h3>
              <p className="text-sm text-muted-foreground">
                Postcode: <span className="font-medium">{selectedPostcode}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Found {addresses.length} addresses for this postcode
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleBackToPostcodes}>
                Back to Postcodes
              </Button>
            </div>
          </div>
          
          {addresses.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Found addresses using Postcoder API
                </span>
              </div>
            </div>
          )}
          
          {addresses.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  No addresses found for postcode: {selectedPostcode}
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {addresses.map((address, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAddressSelect(address)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {address.buildingname || address.premise ? (
                        <Building className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Home className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {address.addressline1 || address.summaryline}
                      </div>
                      {address.addressline2 && (
                        <div className="text-sm text-muted-foreground">{address.addressline2}</div>
                      )}
                      {address.addressline3 && (
                        <div className="text-sm text-muted-foreground">{address.addressline3}</div>
                      )}
                      {address.addressline4 && (
                        <div className="text-sm text-muted-foreground">{address.addressline4}</div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {[
                          address.street,
                          address.posttown,
                          address.county,
                          address.postcode
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
