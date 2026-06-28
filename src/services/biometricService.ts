import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricService {
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  static async getSupportedBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get supported biometric types:', error);
      return [];
    }
  }

  static async authenticate(
    reason: string = 'Authenticate to access locked content'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.isBiometricAvailable()) {
        return { 
          success: false, 
          error: 'Biometric authentication not available' 
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  static async authenticateWithPIN(pin: string, storedPIN: string): Promise<boolean> {
    try {
      // In a real implementation, you would hash and compare the PINs securely
      return pin === storedPIN;
    } catch (error) {
      console.error('PIN authentication failed:', error);
      return false;
    }
  }

  static async requestDevicePIN(): Promise<{ success: boolean; pin?: string; error?: string }> {
    try {
      // This would typically open a PIN input modal
      // For now, we'll return a placeholder
      return {
        success: false,
        error: 'PIN input not implemented',
      };
    } catch (error) {
      console.error('Device PIN request failed:', error);
      return {
        success: false,
        error: 'Failed to request device PIN',
      };
    }
  }
}