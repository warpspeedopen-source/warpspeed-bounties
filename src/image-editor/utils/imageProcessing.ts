/**
 * Image Processing Utilities
 * 
 * Core image manipulation functions for crop, rotate, and adjustments.
 * Uses react-native-image-editor and react-native-canvas for processing.
 */

import {
  CropRegion,
  RotationAngle,
  ImageAdjustments,
  Dimensions,
  EditResult,
  EditMetadata,
  EditorTool,
  Annotation,
  DEFAULT_ADJUSTMENTS,
} from '../types';

// ─── Platform-adaptive imports ──────────────────────────────────
// In production these would be actual RN modules
// Here we define the interface and provide implementations

export interface ImageProcessor {
  crop(uri: string, region: CropRegion, outputSize: Dimensions): Promise<string>;
  rotate(uri: string, angle: RotationAngle): Promise<string>;
  applyAdjustments(uri: string, adjustments: ImageAdjustments): Promise<string>;
  renderAnnotations(
    baseUri: string,
    annotations: Annotation[],
    canvasSize: Dimensions,
    imageSize: Dimensions
  ): Promise<string>;
  save(uri: string, filename: string): Promise<string>;
  getImageSize(uri: string): Promise<Dimensions>;
  composite(layers: string[], size: Dimensions): Promise<string>;
}

// ─── Crop ──────────────────────────────────────────────────────

/**
 * Compute crop region from normalized coordinates (0-1)
 */
export function computeCropRegion(
  normalizedRegion: CropRegion,
  imageSize: Dimensions
): CropRegion {
  return {
    x: Math.round(normalizedRegion.x * imageSize.width),
    y: Math.round(normalizedRegion.y * imageSize.height),
    width: Math.round(normalizedRegion.width * imageSize.width),
    height: Math.round(normalizedRegion.height * imageSize.height),
    aspectRatio: normalizedRegion.aspectRatio,
  };
}

/**
 * Constrain a crop region to maintain the given aspect ratio
 */
export function constrainCropAspectRatio(
  region: CropRegion,
  aspectRatio: string
): CropRegion {
  if (aspectRatio === 'free') return region;

  const [w, h] = aspectRatio.split('/').map(Number);
  if (!w || !h) return region;

  const targetRatio = w / h;
  const currentRatio = region.width / region.height;

  if (currentRatio > targetRatio) {
    // Too wide, reduce width
    const newWidth = region.height * targetRatio;
    return {
      ...region,
      x: region.x + (region.width - newWidth) / 2,
      width: newWidth,
    };
  } else {
    // Too tall, reduce height
    const newHeight = region.width / targetRatio;
    return {
      ...region,
      y: region.y + (region.height - newHeight) / 2,
      height: newHeight,
    };
  }
}

/**
 * Ensure crop region stays within image bounds
 */
export function clampCropRegion(
  region: CropRegion,
  imageSize: Dimensions
): CropRegion {
  const x = Math.max(0, Math.min(region.x, imageSize.width - region.width));
  const y = Math.max(0, Math.min(region.y, imageSize.height - region.height));
  const width = Math.min(region.width, imageSize.width - x);
  const height = Math.min(region.height, imageSize.height - y);

  return { ...region, x, y, width, height };
}

/**
 * Check if two crop regions are equal
 */
export function cropRegionsEqual(a: CropRegion | null, b: CropRegion | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.aspectRatio === b.aspectRatio
  );
}

// ─── Rotation ──────────────────────────────────────────────────

/**
 * Add rotation angle (wraps at 360)
 */
export function addRotation(current: RotationAngle, delta: number): RotationAngle {
  const result = ((current + delta) % 360 + 360) % 360;
  return result as RotationAngle;
}

/**
 * Get image dimensions after rotation
 */
export function getRotatedDimensions(
  dimensions: Dimensions,
  angle: RotationAngle
): Dimensions {
  if (angle === 90 || angle === 270) {
    return { width: dimensions.height, height: dimensions.width };
  }
  return dimensions;
}

// ─── Adjustments ───────────────────────────────────────────────

/**
 * Validate adjustment values are in range
 */
export function clampAdjustments(adjustments: ImageAdjustments): ImageAdjustments {
  return {
    brightness: Math.max(-100, Math.min(100, adjustments.brightness)),
    contrast: Math.max(-100, Math.min(100, adjustments.contrast)),
    saturation: Math.max(-100, Math.min(100, adjustments.saturation)),
  };
}

/**
 * Check if adjustments have been modified from defaults
 */
export function areAdjustmentsModified(adjustments: ImageAdjustments): boolean {
  return (
    adjustments.brightness !== DEFAULT_ADJUSTMENTS.brightness ||
    adjustments.contrast !== DEFAULT_ADJUSTMENTS.contrast ||
    adjustments.saturation !== DEFAULT_ADJUSTMENTS.saturation
  );
}

/**
 * Reset adjustments to defaults
 */
export function resetAdjustments(): ImageAdjustments {
  return { ...DEFAULT_ADJUSTMENTS };
}

// ─── CSS Filter string generation (for canvas rendering) ───────

/**
 * Generate a CSS filter string from adjustments
 * Used for real-time preview rendering
 */
export function adjustmentsToFilterString(adjustments: ImageAdjustments): string {
  const filters: string[] = [];

  if (adjustments.brightness !== 0) {
    const value = 1 + adjustments.brightness / 100;
    filters.push(`brightness(${value.toFixed(2)})`);
  }

  if (adjustments.contrast !== 0) {
    const value = 1 + adjustments.contrast / 100;
    filters.push(`contrast(${value.toFixed(2)})`);
  }

  if (adjustments.saturation !== 0) {
    const value = 1 + adjustments.saturation / 100;
    filters.push(`saturate(${value.toFixed(2)})`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

// ─── Pixel-level adjustments (for native image processing) ─────

/**
 * Apply brightness adjustment to a pixel value (0-255)
 */
export function applyBrightness(value: number, brightness: number): number {
  const delta = (brightness / 100) * 255;
  return Math.max(0, Math.min(255, value + delta));
}

/**
 * Apply contrast adjustment to a pixel value (0-255)
 */
export function applyContrast(value: number, contrast: number): number {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return Math.max(0, Math.min(255, factor * (value - 128) + 128));
}

/**
 * Apply saturation adjustment to RGB values
 */
export function applySaturation(
  r: number,
  g: number,
  b: number,
  saturation: number
): [number, number, number] {
  const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
  const factor = 1 + saturation / 100;

  return [
    Math.max(0, Math.min(255, gray + factor * (r - gray))),
    Math.max(0, Math.min(255, gray + factor * (g - gray))),
    Math.max(0, Math.min(255, gray + factor * (b - gray))),
  ];
}

// ─── Edit Result Assembly ──────────────────────────────────────

/**
 * Build the final EditResult with metadata
 */
export function buildEditResult(
  editedUri: string,
  originalUri: string,
  state: {
    adjustments: ImageAdjustments;
    rotation: RotationAngle;
    annotations: Annotation[];
    isDirty: boolean;
  }
): EditResult {
  const appliedTools: EditorTool[] = [];

  if (state.rotation !== 0) appliedTools.push('rotate');
  if (areAdjustmentsModified(state.adjustments)) appliedTools.push('adjust');
  if (state.annotations.length > 0) {
    const types = new Set(state.annotations.map((a) => a.type));
    types.forEach((t) => appliedTools.push(t as EditorTool));
  }

  const metadata: EditMetadata = {
    editedAt: new Date().toISOString(),
    originalUri,
    appliedTools,
    adjustments: state.adjustments,
    rotation: state.rotation,
    hadAnnotations: state.annotations.length > 0,
  };

  return {
    editedUri,
    wasModified: state.isDirty,
    metadata,
  };
}
