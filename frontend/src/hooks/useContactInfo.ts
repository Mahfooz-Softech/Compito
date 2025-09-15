import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export const useContactInfo = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await apiClient.get('/contact');

      if (fetchError) {
        if (fetchError.status === 404) {
          // No contact info found, create default
          await createDefaultContact();
        } else {
          throw fetchError;
        }
      } else {
        setContactInfo(data);
      }
    } catch (err) {
      console.error('Error fetching contact info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultContact = async () => {
    try {
      const { data, error: createError } = await apiClient.post('/contact', {
        email: 'info@compito.com',
        phone: '+44 20 1234 5678',
        address: '123 Business Street, London, UK, SW1A 1AA'
      });

      if (createError) throw createError;
      setContactInfo(data);
    } catch (err) {
      console.error('Error creating default contact:', err);
      setError('Failed to create default contact information');
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  return {
    contactInfo,
    loading,
    error,
    refetch: fetchContactInfo
  };
};



