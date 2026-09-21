/**
 * Simple wrapper around Expo SecureStore for encrypted key/value storage.
 * All values are stored as strings.
 */

import * as SecureStore from 'expo-secure-store';

export const setSecureItem = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const deleteSecureItem = async (key: string) => {
  await SecureStore.deleteItemAsync(key);
};
