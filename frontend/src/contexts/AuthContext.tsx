import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  user_type: 'customer' | 'worker' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  city?: string;
  postcode?: string;
  postcode_p1?: string;
  postcode_p2?: string;
  postcode_p3?: string;
  country?: string;
  longitude?: number;
  latitude?: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ success: boolean; user?: User; error?: Error }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getUserType: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Memoize the fetchUserProfile function to prevent unnecessary re-renders
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await apiClient.getProfile();

      if (error) throw error;
      
      // Backend returns { user: {...}, profile: {...} }
      const { user: userData, profile: profileData } = data;
      
      if (userData && profileData) {
        setUser({
          id: userData.id,
          email: userData.email || '',
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        });
        setUserProfile(profileData);
        return profileData;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Check if user is authenticated on app load
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token and get user data
      const { data, error } = await apiClient.getProfile();
      
      if (error || !data) {
        // Token is invalid, clear it
        apiClient.setToken(null);
        setUser(null);
        setUserProfile(null);
      } else {
        // Backend returns { user: {...}, profile: {...} }
        const { user: userData, profile: profileData } = data;
        
        if (userData && profileData) {
          setUser({
            id: userData.id,
            email: userData.email || '',
            created_at: userData.created_at,
            updated_at: userData.updated_at,
          });
          setUserProfile(profileData);
        } else {
          // Invalid response format
          apiClient.setToken(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      apiClient.setToken(null);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Helper function to split UK postcodes according to exact requirements
  const splitUKPostcode = (postcode: string): { p1: string; p2: string; p3: string } => {
    if (!postcode || postcode.trim() === '') {
      return { p1: '', p2: '', p3: '' };
    }

    const trimmedPostcode = postcode.trim();
    console.log('🔍 Splitting postcode:', trimmedPostcode);
    
    // Split by space
    const parts = trimmedPostcode.split(' ');
    if (parts.length !== 2) {
      console.log('❌ Invalid postcode format (need exactly 2 parts)');
      return { p1: '', p2: '', p3: '' };
    }

    const firstPart = parts[0]; // e.g., "SW13", "M1", "GU16", "BT1"
    const secondPart = parts[1]; // e.g., "9WT", "1AE", "7JQ", "1JW"
    
    console.log('🔍 First part:', firstPart, 'Second part:', secondPart);

    // Your exact logic: Separate last character from first part
    const p1 = firstPart.substring(0, firstPart.length - 1); // Everything except last character
    const p2 = firstPart.substring(firstPart.length - 1);    // Last character only
    const p3 = secondPart;                                   // Second part as is
    
    console.log('🔍 Split result:', { p1, p2, p3 });

    return { p1, p2, p3 };
  };

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    // Split postcode before sending to database
    const postcodeParts = splitUKPostcode(userData?.postcode || '');
    
    // Prepare user data for Laravel API
    const signupData = {
      email,
      password,
      first_name: userData?.first_name || userData?.firstName || '',
      last_name: userData?.last_name || userData?.lastName || '',
      user_type: userData?.user_type || userData?.userType || 'customer',
      phone: userData?.phone || '',
      location: userData?.location || '',
      city: userData?.city || '',
      postcode: userData?.postcode || '',
      postcode_p1: postcodeParts.p1,
      postcode_p2: postcodeParts.p2,
      postcode_p3: postcodeParts.p3,
      country: userData?.country || 'UK',
      longitude: userData?.longitude || null,
      latitude: userData?.latitude || null,
    };

    try {
      console.log('🔍 AuthContext: Starting signup process...');
      console.log('📧 Email:', email);
      console.log('👤 Signup data:', signupData);

      // Register user with Laravel API
      const { data, error } = await apiClient.signUp(email, password, signupData);

      if (error) {
        throw error;
      }

      if (data && data.user) {
        console.log('✅ Signup successful, user created:', data.user.id);
        
        // Set authentication token
        if (data.token) {
          apiClient.setToken(data.token);
        }
        
        // Set user data
        setUser(data.user);
        setUserProfile(data.profile);
        setLoading(false);
        
        // Send welcome email
        try {
          await apiClient.sendWelcomeEmail({
            email: email,
            subject: 'Welcome to Compito! 🎉',
            message: 'Welcome to Compito Task Hub!',
            type: 'signup',
            user_name: signupData.first_name + ' ' + signupData.last_name,
            user_type: signupData.user_type
          });
          console.log('✅ Welcome email sent successfully');
        } catch (emailError) {
          console.log('⚠️ Email error (continuing with signup):', emailError);
        }
        
        return { success: true, user: data.user };
      } else {
        throw new Error('No user data returned from signup');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      setLoading(false);
      
      return { success: false, error: error as Error };
    }
  }, [splitUKPostcode]);

  // Memoize the signIn function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await apiClient.signIn(email, password);

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message || 'Invalid credentials',
          variant: "destructive"
        });
        return { error };
      }

      if (data && data.token) {
        // Set authentication token
        apiClient.setToken(data.token);
        
        // Set user data
        setUser(data.user);
        setUserProfile(data.profile);
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }

      return { error: null };
    } catch (error) {
      toast({
        title: "Sign In Error",
        description: 'An unexpected error occurred',
        variant: "destructive"
      });
      return { error };
    }
  }, [toast]);

  // Memoize the signOut function
  const signOut = useCallback(async () => {
    try {
      // Call Laravel logout endpoint
      await apiClient.signOut();
      
      // Clear local state
      apiClient.setToken(null);
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear local state even if API call fails
      apiClient.setToken(null);
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Signed Out",
        description: "You have been signed out.",
      });
    }
  }, [toast]);

  // Memoize the getUserType function
  const getUserType = useCallback(() => {
    return userProfile?.user_type || null;
  }, [userProfile?.user_type]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
      user,
      userProfile,
      loading,
      signUp,
      signIn,
      signOut,
      getUserType
  }), [user, userProfile, loading, signUp, signIn, signOut, getUserType]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};