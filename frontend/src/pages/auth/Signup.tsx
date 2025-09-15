import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleMapsAutocomplete, AddressData } from '@/components/ui/GoogleMapsAutocomplete';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'customer',
    phone: '',
    dateOfBirth: '',
    agreeToTerms: false
  });

  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Monitor userData state changes
  useEffect(() => {
    console.log('🔄 userData state changed:', userData);
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('📝 Input change:', { name, value });
    setUserData(prev => {
      const newState = {
        ...prev,
        [name]: value
      };
      console.log('🔄 New userData state:', newState);
      return newState;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log('📝 Select change:', { name, value });
    setUserData(prev => {
      const newState = {
        ...prev,
        [name]: value
      };
      console.log('🔄 New userData state:', newState);
      return newState;
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setUserData(prev => ({
      ...prev,
      agreeToTerms: checked
    }));
  };

  const handleAddressSelect = (address: AddressData) => {
    setAddressData(address);
    console.log('Address selected:', address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log all the data being sent
    console.log('🔍 DEBUG - User Data being sent:', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      userType: userData.userType,
      phone: userData.phone,
      addressData: addressData
    });
    
    if (!addressData) {
      toast({
        title: "Address Required",
        description: "Please select your address before creating an account.",
        variant: "destructive",
      });
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!userData.agreeToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userMetadata = {
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        user_type: userData.userType,
        phone: userData.phone.trim(),
        location: addressData.formattedAddress,
        city: addressData.administrativeAreaLevel1 || addressData.locality || '',
        postcode: addressData.postalCode || '',
        country: addressData.country || 'UK',
        longitude: addressData.longitude,
        latitude: addressData.latitude
      };

      console.log('📤 Sending user metadata to signUp:', userMetadata);

      const success = await signUp(
        userData.email,
        userData.password,
        userMetadata
      );

      if (success.success) {
        toast({
          title: "Account Created Successfully!",
          description: "Please check your email to verify your account.",
        });
        // Redirect to email confirmation page
        navigate('/email-confirmation');
      } else if (success.error) {
        toast({
          title: "Signup Failed",
          description: success.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
          <CardDescription className="text-gray-600">
            Join our platform and start your journey today
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={userData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Create a strong password"
                  minLength={8}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={userData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm your password"
                  minLength={8}
                />
              </div>
            </div>

            {/* Account Type Selection */}
            <div>
              <Label className="text-base font-medium mb-4 block">Choose Your Account Type *</Label>
              <p className="text-sm text-gray-600 mb-4">Select the type of account that best describes how you'll use our platform</p>
              
              {/* Current Selection Indicator */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Currently selected:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userData.userType === 'customer' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {userData.userType === 'customer' ? '👤 Customer' : '🔧 Worker'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectChange('userType', 'customer')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    userData.userType === 'customer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-25'
                  }`}
                >
                  {userData.userType === 'customer' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-3">👤</div>
                    <div className="font-bold text-lg">Customer</div>
                    <div className="text-sm text-gray-500 mt-2">Book services from workers</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSelectChange('userType', 'worker')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    userData.userType === 'worker'
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-lg ring-2 ring-green-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-25'
                  }`}
                >
                  {userData.userType === 'worker' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-3">🔧</div>
                    <div className="font-bold text-lg">Worker</div>
                    <div className="text-sm text-gray-500 mt-2">Provide services to customers</div>
                  </div>
                </button>
              </div>
              
              {/* Account Type Description */}
              {userData.userType === 'customer' && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">👤</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Customer Account</h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        Browse services, book appointments, and connect with skilled workers in your area. 
                        Get quotes, manage bookings, and leave reviews for completed work.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {userData.userType === 'worker' && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🔧</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">Worker Account</h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        Create your service profile, set your rates, and start receiving booking requests from customers. 
                        Manage your schedule, track earnings, and build your reputation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={userData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
               
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              <GoogleMapsAutocomplete
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing your address..."
                label="Address *"
                showMap={true}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={userData.agreeToTerms}
                onCheckedChange={handleCheckboxChange}
                required
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                I agree to the{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                {" and "}
                <Link to="/terms-of-service" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !addressData}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;