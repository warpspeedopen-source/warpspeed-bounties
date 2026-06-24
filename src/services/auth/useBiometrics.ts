import { useState, useCallback } from 'react';
import { authenticateWithBiometrics, getAvailableBiometricType, BiometricType } from './biometrics';

export function useBiometrics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  const checkBiometricType = useCallback(async () => {
    const type = await getAvailableBiometricType();
    setBiometricType(type);
    return type;
  }, []);

  const authenticate = useCallback(async (reason?: string) => {
    const result = await authenticateWithBiometrics(reason);
    setIsAuthenticated(result.success);
    return result;
  }, []);

  const resetAuth = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, biometricType, checkBiometricType, authenticate, resetAuth };
}
