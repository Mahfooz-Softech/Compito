import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface DashboardData {
  worker?: any;
  customer?: any;
  timestamp: number;
}

interface DashboardDataContextType {
  getData: (type: 'worker' | 'customer') => DashboardData | null;
  setData: (type: 'worker' | 'customer', data: any) => void;
  clearData: (type: 'worker' | 'customer') => void;
  isDataStale: (type: 'worker' | 'customer', maxAge?: number) => boolean;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataRef = useRef<{
    worker?: DashboardData;
    customer?: DashboardData;
  }>({});

  const getData = useCallback((type: 'worker' | 'customer'): DashboardData | null => {
    return dataRef.current[type] || null;
  }, []);

  const setData = useCallback((type: 'worker' | 'customer', data: any) => {
    dataRef.current[type] = {
      [type]: data,
      timestamp: Date.now()
    };
  }, []);

  const clearData = useCallback((type: 'worker' | 'customer') => {
    if (type === 'worker') {
      delete dataRef.current.worker;
    } else {
      delete dataRef.current.customer;
    }
  }, []);

  const isDataStale = useCallback((type: 'worker' | 'customer', maxAge: number = 5 * 60 * 1000) => {
    const data = dataRef.current[type];
    if (!data) return true;
    
    const age = Date.now() - data.timestamp;
    return age > maxAge;
  }, []);

  return (
    <DashboardDataContext.Provider value={{
      getData,
      setData,
      clearData,
      isDataStale
    }}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};

