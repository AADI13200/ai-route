import { useState, useCallback } from 'react';
import { riskApi } from '../services/api';

export const useRisk = () => {
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateRisk = useCallback(async (aqi, exposureTime, healthProfile) => {
    setLoading(true);
    setError(null);

    try {
      const data = await riskApi.calculateRisk(aqi, exposureTime, healthProfile);
      setRiskScore(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to calculate risk';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRisk = useCallback(() => {
    setRiskScore(null);
    setError(null);
  }, []);

  return {
    riskScore,
    loading,
    error,
    calculateRisk,
    clearRisk
  };
};

export default useRisk;
