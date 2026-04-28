import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    user_id: 'default',
    health_profile: 'normal',
    preferences: {}
  });

  const [fitnessMode, setFitnessMode] = useState(false);
  const [transportMode, setTransportMode] = useState('driving');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUserProfile = useCallback((profile) => {
    setUserProfile(prev => ({
      ...prev,
      ...profile,
      updated_at: new Date().toISOString()
    }));
  }, []);

  const toggleFitnessMode = useCallback(() => {
    setFitnessMode(prev => !prev);
  }, []);

  const setTransport = useCallback((mode) => {
    setTransportMode(mode);
  }, []);

  const value = {
    userProfile,
    updateUserProfile,
    fitnessMode,
    toggleFitnessMode,
    transportMode,
    setTransport,
    routes,
    setRoutes,
    loading,
    setLoading,
    error,
    setError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
