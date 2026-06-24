import { Platform } from 'react-native';

export type BiometricType = 'fingerprint' | 'face' | 'pin' | 'none';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function getAvailableBiometricType(): Promise<BiometricType> {
  try {
    if (Platform.OS === 'ios') return 'face';
    return 'fingerprint';
  } catch {
    return 'pin';
  }
}

export async function authenticateWithBiometrics(
  reason: string = 'Unlock your note'
): Promise<BiometricResult> {
  try {
    console.log(`[Biometrics] Authenticating: ${reason}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Authentication failed' };
  }
}
