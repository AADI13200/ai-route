import { useState, useCallback } from 'react';
import { routeApi } from '../services/api';

export const useRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoutes = useCallback(async (source, destination, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        user_id = 'default',
        fitness_mode = false,
        transport_mode = 'driving'
      } = options;

      const data = await routeApi.getRoutes(
        source,
        destination,
        user_id,
        fitness_mode,
        transport_mode
      );

      setRoutes(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch routes';
      setError(errorMsg);
      console.error('Route fetch error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoutes = useCallback(() => {
    setRoutes([]);
    setError(null);
  }, []);

  return {
    routes,
    loading,
    error,
    fetchRoutes,
    clearRoutes
  };
};

export default useRoutes;
