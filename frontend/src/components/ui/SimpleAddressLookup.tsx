import React, { useState, useEffect } from 'react';
import { usePostcoder } from '@/hooks/usePostcoder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface SimpleAddressLookupProps {
  onAddressSelect?: (data: { phone: string; address: string; postcode: string }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SimpleAddressLookup: React.FC<SimpleAddressLookupProps> = ({
  onAddressSelect,
  placeholder = "Search by phone, address, or postcode",
  className = "",
  required = false,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'address' | 'postcode'>('postcode');
  const [showResults, setShowResults] = useState(false);
  
  // Form fields for user input
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');

  const {
    loading,
    error,
    addresses,
    selectedAddress,
    lookupByPostcode,
    lookupByComponents,
    selectAddress,
    clearError,
    reset
  } = usePostcoder();

  // Handle search based on type
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      if (searchType === 'postcode') {
        await lookupByPostcode(searchQuery.trim(), 'UK');
      } else if (searchType === 'address') {
        await lookupByComponents(undefined, searchQuery.trim(), undefined, undefined, 'UK');
      } else if (searchType === 'phone') {
        // For phone search, we'll just show a message to enter address manually
        // since we can't reverse lookup address from phone
        setShowResults(false);
        return;
      }
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Handle address selection
  const handleAddressSelect = (selectedAddr: any) => {
    selectAddress(selectedAddr);
    setShowResults(false);
    
    // Extract essential information
    const phoneNumber = phone || '';
    const addressLine = selectedAddr.summaryline || selectedAddr.addressline1 || '';
    const postcodeValue = selectedAddr.postcode || '';
    
    // Update form fields
    setPhone(phoneNumber);
    setAddress(addressLine);
    setPostcode(postcodeValue);
    
    // Call the callback with essential data
    onAddressSelect?.({
      phone: phoneNumber,
      address: addressLine,
      postcode: postcodeValue
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    if (phone && address && postcode) {
      onAddressSelect?.({
        phone,
        address,
        postcode
      });
    }
  };

  // Handle input changes
  const handleInputChange = (value: string) => {
    clearError();
    setSearchQuery(value);
  };

  // Auto-search for postcode (after 5 characters)
  useEffect(() => {
    if (searchType === 'postcode' && searchQuery.trim().length >= 5) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchType]);

  // Reset form
  const handleReset = () => {
    reset();
    setSearchQuery('');
    setShowResults(false);
    setPhone('');
    setAddress('');
    setPostcode('');
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Type Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={searchType === 'phone' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSearchType('phone')}
          className="flex-1"
        >
          <Phone className="h-4 w-4 mr-1" />
          Phone
        </Button>
        <Button
          variant={searchType === 'address' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSearchType('address')}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Address
        </Button>
        <Button
          variant={searchType === 'postcode' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSearchType('postcode')}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Postcode
        </Button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Search {searchType === 'phone' ? 'Phone Number' : searchType === 'address' ? 'Street/Town' : 'Postcode'}
        </label>
        <div className="flex gap-2">
          <Input
            placeholder={
              searchType === 'phone' ? 'e.g., +44 20 7946 0958' :
              searchType === 'address' ? 'e.g., High Street, London' :
              'e.g., SW1A 1AA'
            }
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            required={required}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={disabled || loading || !searchQuery.trim()}
            className="px-6"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {searchType === 'phone' ? 'Enter phone number to manually input address' :
           searchType === 'address' ? 'Search for addresses by street name and town' :
           'Enter postcode to find addresses automatically'}
        </p>
      </div>

      {/* Manual Input Fields */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Contact & Address Details</label>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Phone Number</label>
            <Input
              placeholder="e.g., +44 20 7946 0958"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Address</label>
            <Input
              placeholder="e.g., 10 Downing Street, London"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Postcode</label>
            <Input
              placeholder="e.g., SW1A 2AA"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={disabled || !phone.trim() || !address.trim() || !postcode.trim()}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Address Details
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <span className="text-sm text-destructive">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            ×
          </Button>
        </div>
      )}

      {/* Service Status */}
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">
            Searching address services... This may take a moment.
          </span>
        </div>
      )}

      {/* Address Results */}
      {showResults && addresses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Found {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addresses.map((addr, index) => (
              <div
                key={index}
                className={`p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedAddress?.postcode === addr.postcode ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => handleAddressSelect(addr)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{addr.summaryline || addr.addressline1}</p>
                    <p className="text-xs text-muted-foreground">{addr.postcode}</p>
                    {addr.organisation && (
                      <Badge variant="outline" className="text-xs">
                        {addr.organisation}
                      </Badge>
                    )}
                  </div>
                  {selectedAddress?.postcode === addr.postcode && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && addresses.length === 0 && !loading && !error && (
        <div className="text-center p-6 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No addresses found</p>
          <p className="text-sm">Try a different search term or enter details manually</p>
        </div>
      )}

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Form
        </Button>
      </div>
    </div>
  );
};
