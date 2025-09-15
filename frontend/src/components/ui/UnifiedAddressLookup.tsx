import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Postcoder JavaScript class
const POSTCODER_SCRIPT = `
class PostcoderAutocomplete {
  constructor(config) {
    this.config = config;
    this.init();
  }

  init = () => {
    this.suggestionendpoint = "https://ws.postcoder.com/pcw/autocomplete/find";
    this.retrieveendpoint = "https://ws.postcoder.com/pcw/autocomplete/retrieve";
    this.cache = [];
    this.suggestionhierarchy = [];
    this.suggestions = [];
    this.searchterm = "";
    this.selectedoptiontext = "";
    this.pathfilter = "";
    this.selectedIndex = -1;
    this.no_results_message = "No addresses found";
    this.inputdelay = 50;
    this.singlesummary = this.config.singlesummary;
    this.abortController = null;

    this.suggestionlist = document.querySelector(this.config.suggestions);
    this.input = document.querySelector(this.config.searchterm);
    this.apiKeyInput = document.querySelector(this.config.apikey);

    this.input.setAttribute("type", "search");
    this.input.setAttribute("autocomplete", "off");
    this.input.setAttribute("autocapitalize", "off");
    this.input.setAttribute("autocorrect", "off");
    this.input.setAttribute("spellcheck", "false");

    this.input.addEventListener("input", this.handleInput);
    this.input.addEventListener("focus", this.handleFocus);
    this.input.addEventListener("keydown", this.handleKeyDown);
    this.apiKeyInput.addEventListener("input", this.handleApiKeyInputChange);

    this.suggestionlist.addEventListener("click", this.handleSuggestionClick);
    document.body.addEventListener("click", this.handleDocumentClick);

    this.addresslines = 0;
    for (let i = 1; i <= 4; i++) {
      if (this.config["addressline" + i] !== "") {
        this.addresslines++;
      }
    }
  };

  getSuggestions = (event) => {
    this.searchterm = encodeURIComponent(this.input.value.trim());

    if (this.searchterm.length < 3) {
      this.hideSuggestions();
      return;
    }

    let url = this.suggestionendpoint + "?apikey=" + this.apikey + "&country=" + this.getCountry() + "&maximumresults=10" + "&query=" + this.searchterm;

    if (this.pathfilter) {
      url += "&pathfilter=" + encodeURIComponent(this.pathfilter);
    } else {
      this.selectedoptiontext = this.searchterm;
    }

    if (this.singlesummary) {
      url += "&singlesummary=true";
    }

    let index = this.cache.findIndex((c) => c.url === url);

    if (index >= 0) {
      this.suggestions = this.cache[index].suggestions;
      this.addSuggestionHierarchy(index);
      this.showSuggestions();
    } else {
      this.abortController = new AbortController();
      fetch(url, { signal: this.abortController.signal })
        .then((response) => {
          if (!response.ok) throw response;
          return response.json();
        })
        .then((json) => {
          this.suggestions = json;
          this.addCache(url);
          this.addSuggestionHierarchy(this.cache.length - 1);
          this.showSuggestions();
        })
        .catch((err) => {
          if (typeof err.text === "function") {
            err.text().then((errorMessage) => {
              console.log("Postcoder request error " + err.status + " : " + errorMessage);
            });
          } else {
            console.log(err);
          }
        });
    }
  };

  addCache = (url) => {
    let obj = {};
    obj.url = url;
    obj.suggestions = this.suggestions;
    obj.label = this.selectedoptiontext;
    this.cache.push(obj);
  };

  newSuggestionsReset = () => {
    this.hideSuggestions();
    this.pathfilter = "";
    this.suggestionlist.scrollTop = 0;
    this.selectedIndex = -1;
  };

  suggestionsHierarchyReset = () => {
    this.suggestionhierarchy = [];
  };

  addSuggestionHierarchy = (index) => {
    this.suggestionhierarchy.push(index);
  };

  handleSuggestionClick = (event) => {
    event.stopPropagation();
    let target = event.target;
    while (target.tagName.toLowerCase() !== "li") {
      target = target.parentNode;
    }
    this.selectSuggestion(target);
  };

  selectSuggestion = (target) => {
    this.selectedoptiontext = target.innerHTML;

    if (target.getAttribute("data-type") == "CACHE") {
      this.suggestions = this.cache[target.getAttribute("data-id")].suggestions;
      this.suggestionhierarchy.pop();
      this.showSuggestions();
    } else if (target.getAttribute("data-type") == "ADD") {
      this.retrieve(target.getAttribute("data-id"));
    } else {
      this.pathfilter = target.getAttribute("data-id");
      this.getSuggestions();
    }
  };

  retrieve = (id) => {
    const country = this.getCountry();
    const url = this.retrieveendpoint + "?apikey=" + this.apikey + "&country=" + country + "&query=" + this.searchterm + "&id=" + id + "&lines=" + this.addresslines + "&exclude=organisation,posttown,county,postcode,country";

    fetch(url)
      .then((response) => {
        if (!response.ok) throw response;
        return response.json();
      })
      .then((addresses) => {
        this.cache[url] = addresses[0];
        this.processResult(addresses[0]);
      })
      .catch((err) => {
        if (typeof err.text === "function") {
          err.text().then((errorMessage) => {
            console.log("Postcoder request error " + err.status + " : " + errorMessage);
          });
        } else {
          console.log(err);
        }
      });
  };

  showSuggestions = () => {
    this.newSuggestionsReset();

    if (this.suggestions.length === 0) {
      let option = document.createElement("li");
      option.innerHTML = this.no_results_message;
      this.suggestionlist.appendChild(option);
    } else {
      if (this.suggestionhierarchy.length > 1) {
        let cacheid = this.suggestionhierarchy[this.suggestionhierarchy.length - 2];
        let option = document.createElement("li");
        option.classList.add("header");
        option.innerHTML = '<i class="arrow left"></i> ' + decodeURIComponent(this.cache[cacheid].label);
        option.setAttribute("data-id", cacheid);
        option.setAttribute("data-type", "CACHE");
        this.suggestionlist.appendChild(option);
      }

      for (let i = 0; i < this.suggestions.length; i++) {
        let option = document.createElement("li");
        let suggestiontext = "";

        if (this.singlesummary) {
          suggestiontext = this.suggestions[i].summaryline;
        } else {
          suggestiontext = this.suggestions[i].summaryline + " " + '<span class="extra-info">' + this.suggestions[i].locationsummary + "</span>";
        }

        if (this.suggestions[i].count > 1) {
          let count = this.suggestions[i].count > 100 ? "100+" : this.suggestions[i].count;
          if (this.singlesummary) {
            suggestiontext += ' <span class="extra-info">(' + count + " addresses)</span>";
          } else {
            suggestiontext += " (" + count + " addresses)";
          }
        }

        option.innerHTML = suggestiontext;
        option.setAttribute("data-id", this.suggestions[i].id);
        option.setAttribute("data-type", this.suggestions[i].type);
        this.suggestionlist.appendChild(option);
      }
    }
  };

  getCountry = () => {
    return typeof this.config.countrycode !== "undefined" && this.config.countrycode !== "" ? this.config.countrycode : document.querySelector(this.config.country).value;
  };

  updateApiKey = () => {
    this.apikey = this.apiKeyInput.value;
  };

  handleApiKeyInputChange = () => {
    this.updateApiKey();
  };

  processResult = (address) => {
    this.hideSuggestions();

    let fields = ["organisation", "addressline1", "addressline2", "addressline3", "addressline4", "posttown", "county", "postcode"];

    for (let i = 0; i < fields.length; i++) {
      let field_selector = this.config[fields[i]];
      if (typeof field_selector !== "undefined" && field_selector !== "") {
        document.querySelector(field_selector).value = typeof address[fields[i]] !== "undefined" ? address[fields[i]] : "";
      }
    }
  };

  handleDocumentClick = (event) => {
    if (this.suggestionlist.contains(event.target) || this.input.contains(event.target)) {
      return;
    }
    this.hideSuggestions();
  };

  hideSuggestions = () => {
    this.suggestionlist.innerHTML = "";
  };

  handleKeyDown = (event) => {
    const { key } = event;
    switch (key) {
      case "Up":
      case "Down":
      case "ArrowUp":
      case "ArrowDown": {
        const selectedIndex = key === "ArrowUp" || key === "Up" ? this.selectedIndex - 1 : this.selectedIndex + 1;
        event.preventDefault();
        this.handleArrows(selectedIndex);
        break;
      }
      case "Tab": {
        this.handleTab(event);
        break;
      }
      case "Enter": {
        this.selectSuggestion(this.suggestionlist.querySelectorAll("li")[this.selectedIndex]);
        break;
      }
      case "Esc":
      case "Escape": {
        this.hideSuggestions();
        break;
      }
      default:
        return;
    }
  };

  handleArrows = (selectedIndex) => {
    let suggestionsCount = this.suggestions.length;
    if (this.suggestionhierarchy.length > 1) {
      suggestionsCount++;
    }

    if (this.suggestionlist.querySelectorAll("li").length > 0) {
      if (this.selectedIndex >= 0) {
        this.suggestionlist.querySelectorAll("li")[this.selectedIndex].classList.remove("selected");
      }

      this.selectedIndex = ((selectedIndex % suggestionsCount) + suggestionsCount) % suggestionsCount;
      this.suggestionlist.querySelectorAll("li")[this.selectedIndex].classList.add("selected");
      this.suggestionlist.querySelectorAll("li")[this.selectedIndex].scrollIntoView(false);
    }
  };

  handleTab = (event) => {
    if (this.selectedIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(this.suggestionlist.querySelectorAll("li")[this.selectedIndex]);
    } else {
      this.hideSuggestions();
    }
  };

  handleInput = () => {
    this.suggestionsHierarchyReset();
    clearTimeout(this.debounce);
    if (this.abortController !== null) {
      this.abortController.abort("New input detected.");
    }
    this.debounce = setTimeout(() => this.getSuggestions(), this.inputdelay);
  };

  handleFocus = () => {
    if (this.suggestions.length > 0) {
      this.showSuggestions();
    } else {
      this.getSuggestions();
    }
  };
}

// Make it globally available
window.PostcoderAutocomplete = PostcoderAutocomplete;
`;

// Declare Postcoder types for TypeScript
declare global {
  interface Window {
    PostcoderAutocomplete: any;
  }
}

interface UnifiedAddressLookupProps {
  onAddressSelect?: (data: { phone: string; address: string; postcode: string }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const UnifiedAddressLookup: React.FC<UnifiedAddressLookupProps> = ({
  onAddressSelect,
  placeholder = "Enter phone, address, or postcode to search",
  className = "",
  required = false,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [inputType, setInputType] = useState<'phone' | 'address' | 'postcode' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields for user input
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [organisation, setOrganisation] = useState('');

  // Refs for Postcoder integration
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionListRef = useRef<HTMLUListElement>(null);
  const addressLine1Ref = useRef<HTMLInputElement>(null);
  const addressLine2Ref = useRef<HTMLInputElement>(null);
  const addressLine3Ref = useRef<HTMLInputElement>(null);
  const postTownRef = useRef<HTMLInputElement>(null);
  const countyRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);
  const organisationRef = useRef<HTMLInputElement>(null);

  // Auto-detect input type
  const detectInputType = (input: string): 'phone' | 'address' | 'postcode' => {
    const trimmed = input.trim();
    
    // Check if it's a phone number (contains +, numbers, spaces, dashes, parentheses)
    if (/^[\+\d\s\-\(\)]+$/.test(trimmed) && trimmed.length >= 10) {
      return 'phone';
    }
    
    // Check if it's a UK postcode (format: AA9A 9AA or A9A 9AA or A9 9AA or A99 9AA or AA9 9AA or AA99 9AA)
    if (/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(trimmed)) {
      return 'postcode';
    }
    
    // Default to address search
    return 'address';
  };

  // Initialize Postcoder when component mounts
  useEffect(() => {
    // Load Postcoder script if not already loaded
    if (!window.PostcoderAutocomplete) {
      const script = document.createElement('script');
      script.innerHTML = POSTCODER_SCRIPT;
      script.onload = initializePostcoder;
      document.head.appendChild(script);
    } else {
      initializePostcoder();
    }
  }, []);

  const initializePostcoder = () => {
    if (!window.PostcoderAutocomplete || !searchInputRef.current || !suggestionListRef.current) return;

    try {
      // Create a hidden API key input for Postcoder
      const apiKeyInput = document.createElement('input');
      apiKeyInput.type = 'hidden';
      apiKeyInput.value = 'PCW59-Q4YAC-G2CEK-3V5YX';
      apiKeyInput.id = 'apikey';
      document.body.appendChild(apiKeyInput);

      // Create a hidden country input for Postcoder
      const countryInput = document.createElement('input');
      countryInput.type = 'hidden';
      countryInput.value = 'UK';
      countryInput.id = 'txt_country';
      document.body.appendChild(countryInput);

      // Initialize PostcoderAutocomplete
      const postcoder = new window.PostcoderAutocomplete({
        apikey: '#apikey',
        geolocate: false,
        searchterm: searchInputRef.current,
        singlesummary: true,
        suggestions: suggestionListRef.current,
        country: '#txt_country',
        countrycode: 'UK',
        organisation: organisationRef.current,
        addressline1: addressLine1Ref.current,
        addressline2: addressLine2Ref.current,
        addressline3: addressLine3Ref.current,
        addressline4: '',
        county: countyRef.current,
        posttown: postTownRef.current,
        postcode: postcodeRef.current
      });

      // Store postcoder instance for cleanup
      (window as any).postcoderInstance = postcoder;

      // Override the processResult method to handle our form updates
      const originalProcessResult = postcoder.processResult;
      postcoder.processResult = (address: any) => {
        // Call original method
        originalProcessResult.call(postcoder, address);
        
        // Update our React state
        const addressLine1 = addressLine1Ref.current?.value || '';
        const addressLine2 = addressLine2Ref.current?.value || '';
        const addressLine3 = addressLine3Ref.current?.value || '';
        const postTown = postTownRef.current?.value || '';
        const countyValue = countyRef.current?.value || '';
        const postcodeValue = postcodeRef.current?.value || '';
        const organisationValue = organisationRef.current?.value || '';
        
        // Combine address lines
        const fullAddress = [addressLine1, addressLine2, addressLine3, postTown].filter(Boolean).join(', ');
        
        // Update form fields
        setAddress(fullAddress);
        setCity(postTown);
        setCounty(countyValue);
        setPostcode(postcodeValue);
        setOrganisation(organisationValue);
        
        // Hide suggestions
        setShowResults(false);
        setLoading(false);
        
        // Call the callback with essential data
        onAddressSelect?.({
          phone: phone || '',
          address: fullAddress,
          postcode: postcodeValue
        });
      };

      // Override the showSuggestions method to show our custom UI
      const originalShowSuggestions = postcoder.showSuggestions;
      postcoder.showSuggestions = () => {
        // Call original method
        originalShowSuggestions.call(postcoder);
        
        // Show our custom results UI
        setShowResults(true);
        setLoading(false);
      };

      // Override the hideSuggestions method
      const originalHideSuggestions = postcoder.hideSuggestions;
      postcoder.hideSuggestions = () => {
        // Call original method
        originalHideSuggestions.call(postcoder);
        
        // Hide our custom results UI
        setShowResults(false);
      };

    } catch (error) {
      console.error('Failed to initialize Postcoder:', error);
      setError('Failed to initialize address lookup service');
    }
  };

  // Handle search with auto-detection
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const detectedType = detectInputType(searchQuery);
    setInputType(detectedType);
    setError(null);
    
    try {
      if (detectedType === 'postcode') {
        // For postcode, Postcoder will handle the search automatically
        setLoading(true);
        // Focus the search input to trigger Postcoder
        searchInputRef.current?.focus();
      } else if (detectedType === 'address') {
        // For address, Postcoder will handle the search automatically
        setLoading(true);
        // Focus the search input to trigger Postcoder
        searchInputRef.current?.focus();
      } else if (detectedType === 'phone') {
        // For phone, we'll just show a message to enter address manually
        setShowResults(false);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
      setLoading(false);
    }
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

  // Handle input changes with auto-search
  const handleInputChange = (value: string) => {
    setError(null);
    setSearchQuery(value);
    setInputType(null);
    
    // Auto-search for postcodes after 5 characters
    if (value.trim().length >= 5) {
      const detectedType = detectInputType(value);
      if (detectedType === 'postcode') {
        setInputType(detectedType);
        // Auto-search postcode with debounce
        setTimeout(() => {
          if (value === searchQuery) { // Only search if value hasn't changed
            handleSearch();
          }
        }, 500);
      }
    }
  };

  // Reset form
  const handleReset = () => {
    setSearchQuery('');
    setShowResults(false);
    setInputType(null);
    setPhone('');
    setAddress('');
    setPostcode('');
    setCity('');
    setCounty('');
    setOrganisation('');
    setError(null);
    setLoading(false);
    
    // Clear Postcoder output fields
    if (addressLine1Ref.current) addressLine1Ref.current.value = '';
    if (addressLine2Ref.current) addressLine2Ref.current.value = '';
    if (addressLine3Ref.current) addressLine3Ref.current.value = '';
    if (postTownRef.current) postTownRef.current.value = '';
    if (countyRef.current) countyRef.current.value = '';
    if (postcodeRef.current) postcodeRef.current.value = '';
    if (organisationRef.current) organisationRef.current.value = '';
    
    // Clear suggestions list
    if (suggestionListRef.current) suggestionListRef.current.innerHTML = '';
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get input type indicator
  const getInputTypeIndicator = () => {
    if (!inputType) return null;
    
    const indicators = {
      phone: { icon: Phone, label: 'Phone Number', color: 'text-blue-600' },
      address: { icon: MapPin, label: 'Address Search', color: 'text-green-600' },
      postcode: { icon: MapPin, label: 'Postcode Search', color: 'text-purple-600' }
    };
    
    const indicator = indicators[inputType];
    const Icon = indicator.icon;
    
    return (
      <div className={`flex items-center gap-2 text-sm ${indicator.color}`}>
        <Icon className="h-4 w-4" />
        <span>{indicator.label}</span>
      </div>
    );
  };

  // Cleanup Postcoder on unmount
  useEffect(() => {
    return () => {
      if ((window as any).postcoderInstance) {
        try {
          // Remove hidden inputs
          const apiKeyInput = document.getElementById('apikey');
          const countryInput = document.getElementById('txt_country');
          if (apiKeyInput) apiKeyInput.remove();
          if (countryInput) countryInput.remove();
        } catch (error) {
          console.error('Error cleaning up Postcoder:', error);
        }
      }
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Unified Search Bar */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Search & Select Address</label>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              placeholder={placeholder}
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
          
          {/* Input Type Indicator */}
          {inputType && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getInputTypeIndicator()}
              <span>•</span>
              <span>
                {inputType === 'phone' ? 'Enter address details manually below' :
                 inputType === 'address' ? 'Searching for addresses via Postcoder...' :
                 'Searching for postcode via Postcoder...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Postcoder Suggestions List */}
      {showResults && (
        <div className="border rounded-md bg-white shadow-lg">
          <ul 
            ref={suggestionListRef}
            className="max-h-60 overflow-y-auto"
          >
            {/* Postcoder will populate this list */}
          </ul>
        </div>
      )}

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
            <label className="text-xs text-muted-foreground">City</label>
            <Input
              placeholder="e.g., London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">County</label>
            <Input
              placeholder="e.g., Greater London"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
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

      {/* Hidden Postcoder Output Fields */}
      <div className="hidden">
        <input ref={organisationRef} type="text" />
        <input ref={addressLine1Ref} type="text" />
        <input ref={addressLine2Ref} type="text" />
        <input ref={addressLine3Ref} type="text" />
        <input ref={postTownRef} type="text" />
        <input ref={countyRef} type="text" />
        <input ref={postcodeRef} type="text" />
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <span className="text-sm text-destructive">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            ×
          </Button>
        </div>
      )}

      {/* Service Status */}
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">
            Searching Postcoder API... This may take a moment.
          </span>
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1">
              <li>• <strong>Phone:</strong> Enter phone number, then fill address manually</li>
              <li>• <strong>Address:</strong> Search for addresses via official Postcoder API</li>
              <li>• <strong>Postcode:</strong> Auto-search via official Postcoder API after 5 characters</li>
            </ul>
            <p className="mt-2 text-xs opacity-75">
              <strong>Note:</strong> Uses official Postcoder JavaScript class for accurate UK address data.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Form
        </Button>
      </div>
    </div>
  );
};
