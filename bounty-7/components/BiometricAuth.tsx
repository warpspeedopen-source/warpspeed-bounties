import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { lockStore } from '../state/lockStore';
import { BiometricStatus, BiometricType } from '../types';

interface BiometricAuthProps {
  onAuthenticated: () => void;
  onFallback?: () => void;
  promptMessage?: string;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthenticated,
  onFallback,
  promptMessage = 'Authenticate to unlock note',
}) => {
  const [status, setStatus] = useState<BiometricStatus>({ isAvailable: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initBiometrics();
  }, []);

  const initBiometrics = async () => {
    setIsLoading(true);
    try {
      const [compatible, enrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);

      const isAvailable = compatible && enrolled;
      let biometryType: BiometricType = null;

      if (isAvailable) {
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'FaceID';
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
          types.includes(LocalAuthentication.AuthenticationType.IRIS)
        ) {
          biometryType = 'TouchID';
        }
      }

      const newStatus: BiometricStatus = { isAvailable, biometryType };
      setStatus(newStatus);
      lockStore.setBiometricStatus(newStatus);

      if (isAvailable) {
        handleAuthenticate();
      }
    } catch {
      setStatus({ isAvailable: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: onFallback ? 'Use PIN' : undefined,
        cancelLabel: 'Cancel',
        disableDeviceFallback: !onFallback,
      });

      if (result.success) {
        onAuthenticated();
      } else if (result.error === 'user_cancel' && onFallback) {
        onFallback();
      } else {
        setError(result.error === 'user_fallback' ? null : 'Authentication failed');
        if (result.error === 'user_fallback' && onFallback) {
          onFallback();
        }
      }
    } catch {
      setError('Biometric authentication error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.statusText}>Checking biometrics...</Text>
      </View>
    );
  }

  if (!status.isAvailable) {
    return null;
  }

  const iconName = status.biometryType === 'FaceID' ? 'ios-faceid' : 'finger-print';
  const displayName = status.biometryType ?? 'Biometrics';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.authButton}
        onPress={handleAuthenticate}
        disabled={isAuthenticating}
        accessibilityLabel={`Authenticate with ${displayName}`}
        accessibilityRole="button"
      >
        {isAuthenticating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name={iconName} size={28} color="#fff" />
            <Text style={styles.authButtonText}>
              {displayName === 'FaceID' ? 'Use Face ID' : 'Use Touch ID'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {onFallback && status.isAvailable && (
        <TouchableOpacity onPress={onFallback} style={styles.fallbackButton}>
          <Text style={styles.fallbackText}>Enter PIN Instead</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 8,
  },
  fallbackButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  fallbackText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
});
