 ```diff
--- /dev/null
+++ b/src/components/NoteLockScreen.tsx
@@ -0,0 +1,256 @@
+import React, { useState, useCallback, useEffect } from 'react';
+import {
+  View,
+  Text,
+  StyleSheet,
+  TouchableOpacity,
+  TextInput,
+  Platform,
+  ActivityIndicator,
+} from 'react-native';
+import * as LocalAuthentication from 'expo-local-authentication';
+import { NoteLockScreenProps } from '../types/note-lock.types';
+import { LockState } from '../types/note.types';
+
+const PIN_LENGTH = 4;
+
+export const NoteLockScreen: React.FC<NoteLockScreenProps> = ({
+  noteTitle,
+  lockState,
+  onAuthenticate,
+  onCancel,
+  theme = 'light',
+}) => {
+  const [pin, setPin] = useState('');
+  const [error, setError] = useState<string | null>(null);
+  const [isAuthenticating, setIsAuthenticating] = useState(false);
+  const [biometricType, setBiometricType] = useState<string | null>(null);
+
+  const isDark = theme === 'dark';
+
+  useEffect(() => {
+    checkBiometricSupport();
+  }, []);
+
+  const checkBiometricSupport = async () => {
+    const hasHardware = await LocalAuthentication.hasHardwareAsync();
+    if (!hasHardware) return;
+
+    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
+    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
+      setBiometricType('Face ID');
+    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
+      setBiometricType('Touch ID');
+    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
+      setBiometricType('Iris');
+    }
+  };
+
+  const handleBiometricAuth = useCallback(async () => {
+    setIsAuthenticating(true);
+    setError(null);
+
+    try {
+      const result = await LocalAuthentication.authenticateAsync({
+        promptMessage: 'Authenticate to unlock note',
+        fallbackLabel: 'Use PIN',
+        cancelLabel: 'Cancel',
+        disableDeviceFallback: false,
+      });
+
+      if (result.success) {
+        onAuthenticate('biometric');
+      } else {
+        setError('Authentication failed. Please try again.');
+      }
+    } catch (err) {
+      setError('Biometric authentication error. Please use PIN.');
+    } finally {
+      setIsAuthenticating(false);
+    }
+  }, [onAuthenticate]);
+
+  const handlePinSubmit = useCallback(() => {
+    if (pin.length !== PIN_LENGTH) {
+      setError(`PIN must be ${PIN_LENGTH} digits`);
+      return;
+    }
+
+    setIsAuthenticating(true);
+    setError(null);
+
+    // Simulate async validation - in real app, this would hash and compare
+    setTimeout(() => {
+      onAuthenticate('pin', pin);
+      setIsAuthenticating(false);
+    }, 100);
+  }, [pin, onAuthenticate]);
+
+  const handlePinDigit = useCallback((digit: string) => {
+    if (pin.length < PIN_LENGTH) {
+      setPin(prev => {
+        const newPin = prev + digit;
+        if (newPin.length === PIN_LENGTH) {
+          // Auto-submit when PIN is complete
+          setTimeout(() => {
+            // Validation will happen in effect or we can call directly
+          }, 0);
+        }
+        return newPin;
+      });
+      setError(null);
+    }
+  }, [pin]);
+
+  const handleBackspace = useCallback(() => {
+    setPin(prev => prev.slice(0, -1));
+    setError(null);
+  }, []);
+
+  const handleClear = useCallback(() => {
+    setPin('');
+    setError(null);
+  }, []);
+
+  const renderPinDots = () => {
+    return (
+      <View style={styles.pinDotsContainer}>
+        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
+          <View
+            key={index}
+            style={[
+              styles.pinDot,
+              {
+                backgroundColor: isDark ? '#fff' : '#000',
+                opacity: index < pin.length ? 1 : 0.2,
+              },
+            ]}
+          />
+        ))}
+      </View>
+    );
+  };
+
+  return (
+    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
+      <View style={styles.content}>
+        <View style={styles.lockIconContainer}>
+          <Text style={[styles.lockIcon, { color: isDark ? '#fff' : '#000' }]}>🔒</Text>
+        </View>
+
+        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
+          {noteTitle || 'Locked Note'}
+        </Text>
+
+        <Text style={[styles.subtitle, { color: isDark ? '#aaa' : '#666' }]}>
+          {lockState === LockState.BIOMETRIC && biometricType
+            ? `Use ${biometricType} or enter PIN`
+            : 'Enter PIN to unlock'}
+        </Text>
+
+        {error && (
+          <Text style={styles.errorText}>{error}</Text>
+        )}
+
+        {renderPinDots()}
+
+        <View style={styles.keypadContainer}>
+          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
+            <TouchableOpacity
+              key={num}
+              style={styles.keypadButton}
+              onPress={() => handlePinDigit(num.toString())}
+              disabled={isAuthenticating}
+            >
+              <Text style={[styles.keypadButtonText, { color: isDark ? '#fff' : '#000' }]}>
+                {num}
+              </Text>
+            </TouchableOpacity>
+          ))}
+          <TouchableOpacity
+            style={styles.keypadButton}
+            onPress={handleBiometricAuth}
+            disabled={isAuthenticating || !biometricType}
+          >
+            <Text style={[styles.keypadButtonText, { color: isDark ? '#fff' : '#000', fontSize: 20 }]}>
+              {biometricType === 'Face ID' ? '👤' : '👆'}
+            </Text>
+         