/**
 * Image Preview Action Helpers
 * Handles download, share, and delete operations for preview images.
 * Bounty: Enhanced Image Preview (#6)
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import type { ImagePreviewItem, ImagePreviewAction } from './types';

// NOTE: These are placeholder implementations.
// In production, integrate with your actual native modules:
//   - react-native-fs / expo-file-system for downloads
//   - react-native-share for sharing
//   - app-specific API for deletion

/**
 * Check if the app has storage/download permissions.
 */
async function hasStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    if (Platform.Version >= 33) {
      // Android 13+ uses granular media permissions
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return granted;
    }
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted;
  } catch {
    return false;
  }
}

/**
 * Request storage permission on Android.
 */
async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Download an image to the device's photo library.
 */
export async function downloadImage(image: ImagePreviewItem): Promise<boolean> {
  try {
    const hasPermission = (await hasStoragePermission()) || (await requestStoragePermission());
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Storage permission is needed to download images.');
      return false;
    }

    // TODO: Replace with actual download logic
    // Example with react-native-fs:
    //   const destPath = `${RNFS.PicturesDirectoryPath}/${image.filename || image.id}.jpg`;
    //   await RNFS.downloadFile({ fromUrl: image.uri, toFile: destPath }).promise;
    //   await CameraRoll.save(destPath, { type: 'photo' });

    console.log(`[ImagePreview] Download triggered for: ${image.uri}`);
    Alert.alert('Download Started', 'Image is being saved to your device.');
    return true;
  } catch (error) {
    console.error('[ImagePreview] Download failed:', error);
    Alert.alert('Download Failed', 'Unable to save the image. Please try again.');
    return false;
  }
}

/**
 * Share an image via the system share sheet.
 */
export async function shareImage(image: ImagePreviewItem): Promise<boolean> {
  try {
    // TODO: Replace with actual share logic
    // Example with react-native-share:
    //   await Share.open({
    //     url: image.uri,
    //     type: image.mimeType || 'image/jpeg',
    //     filename: image.filename,
    //   });

    console.log(`[ImagePreview] Share triggered for: ${image.uri}`);
    return true;
  } catch (error) {
    console.error('[ImagePreview] Share failed:', error);
    return false;
  }
}

/**
 * Delete an image after confirmation.
 */
export async function deleteImage(
  image: ImagePreviewItem,
  onConfirmDelete: (image: ImagePreviewItem) => Promise<boolean>
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await onConfirmDelete(image);
              resolve(result);
            } catch (error) {
              console.error('[ImagePreview] Delete failed:', error);
              resolve(false);
            }
          },
        },
      ]
    );
  });
}

/**
 * Build default actions for the image preview action bar.
 * Each action checks availability and calls the appropriate handler.
 */
export function buildDefaultActions(options: {
  canDownload?: boolean;
  canShare?: boolean;
  canDelete?: boolean;
  onDeleteConfirm?: (image: ImagePreviewItem) => Promise<boolean>;
}): ImagePreviewAction[] {
  const actions: ImagePreviewAction[] = [];

  if (options.canDownload !== false) {
    actions.push({
      key: 'download',
      label: 'Download',
      icon: 'download-outline',
      available: true,
      onPress: (image) => downloadImage(image),
    });
  }

  if (options.canShare !== false) {
    actions.push({
      key: 'share',
      label: 'Share',
      icon: 'share-outline',
      available: true,
      onPress: (image) => shareImage(image),
    });
  }

  if (options.canDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: 'trash-outline',
      available: true,
      onPress: (image) => deleteImage(image, options.onDeleteConfirm!),
      confirmMessage: 'Are you sure you want to delete this image?',
    });
  }

  return actions;
}
