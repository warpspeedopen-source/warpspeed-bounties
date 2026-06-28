import { NativeModules, Platform } from 'react-native';

const { LocalAuthentication } = NativeModules;

export const authenticate = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { biometryType } = await LocalAuthentication.biometricType();
      if (biometryType === 'face') {
        // FaceID authentication
        const result = await LocalAuthentication.authenticate({
          reason: 'Authenticate to access locked note',
        });
        return result.success;
      } else if (biometryType === 'touch') {
        // Fingerprint authentication
        const result = await LocalAuthentication.authenticate({
          reason: 'Authenticate to access locked note',
        });
        return result.success;
      }
    } else {
      // Device PIN fallback
      const result = await LocalAuthentication.authenticate({
        reason: 'Authenticate to access locked note',
      });
      return result.success;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};