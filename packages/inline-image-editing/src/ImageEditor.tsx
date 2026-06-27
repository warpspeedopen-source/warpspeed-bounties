import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import type { ImageEditorProps, EditingMode, CropRegion, ImageAdjustments, Annotation } from '../types';
import { useEditHistory } from '../hooks/useEditHistory';
import { CropTool } from './CropTool';
import { AdjustControls } from './AdjustControls';
import { AnnotationOverlay } from './AnnotationOverlay';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Inline Image Editor for React Native.
 *
 * Features:
 * - Crop with aspect ratio presets
 * - Rotation (90° increments)
 * - Brightness & Contrast adjustment
 * - Annotations (text labels, arrows, shapes)
 * - Undo / Redo
 * - Save / Save As
 */
export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUri,
  onSave,
  onCancel,
  onSaveAs,
  maxZoom = 3,
  allowedModes,
}) => {
  // Image dimensions (simulated - in prod, use Image.getSize)
  const [imageSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 });

  const [mode, setMode] = useState<EditingMode>('none');
  const [rotation, setRotation] = useState(0);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({ brightness: 0, contrast: 0 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const { currentSnapshot, canUndo, canRedo, pushSnapshot, undo, redo } = useEditHistory();

  // ── Mode switching ──────────────────────────────────────────────
  const enterMode = useCallback(
    (newMode: EditingMode) => {
      if (newMode !== 'none') {
        // Snapshot current state before entering a tool
        pushSnapshot({
          cropRegion,
          rotation,
          adjustments,
          annotations,
        });
      }
      setMode(newMode);
    },
    [cropRegion, rotation, adjustments, annotations, pushSnapshot]
  );

  // ── Crop ────────────────────────────────────────────────────────
  const handleCropApply = useCallback(() => {
    // In production, actually crop the image
    pushSnapshot({ cropRegion, rotation, adjustments, annotations });
    setMode('none');
  }, [cropRegion, rotation, adjustments, annotations, pushSnapshot]);

  const handleCropCancel = useCallback(() => {
    // Restore previous state from undo
    const prev = undo();
    if (prev) {
      setCropRegion(prev.cropRegion);
      setRotation(prev.rotation);
      setAdjustments(prev.adjustments);
      setAnnotations(prev.annotations);
    }
    setMode('none');
  }, [undo]);

  // ── Rotation ────────────────────────────────────────────────────
  const rotateImage = useCallback(() => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    pushSnapshot({ cropRegion, rotation: newRotation, adjustments, annotations });
  }, [rotation, cropRegion, adjustments, annotations, pushSnapshot]);

  // ── Adjust ──────────────────────────────────────────────────────
  const handleAdjustApply = useCallback(
    (newAdjustments: ImageAdjustments) => {
      setAdjustments(newAdjustments);
      pushSnapshot({ cropRegion, rotation, adjustments: newAdjustments, annotations });
      setMode('none');
    },
    [cropRegion, rotation, annotations, pushSnapshot]
  );

  const handleAdjustCancel = useCallback(() => {
    const prev = undo();
    if (prev) {
      setCropRegion(prev.cropRegion);
      setRotation(prev.rotation);
      setAdjustments(prev.adjustments);
      setAnnotations(prev.annotations);
    }
    setMode('none');
  }, [undo]);

  // ── Annotations ─────────────────────────────────────────────────
  const addAnnotation = useCallback(
    (type: Annotation['type']) => {
      const newAnn: Annotation = {
        id: `ann-${Date.now()}`,
        type,
        color: '#FF3B30',
        strokeWidth: 2,
        text: type === 'text' ? 'Text' : undefined,
        position: type === 'text' ? { x: 50, y: 50 } : undefined,
        points: type === 'arrow' || type === 'freehand' ? [{ x: 50, y: 50 }, { x: 150, y: 150 }] : undefined,
        origin: type === 'rect' || type === 'circle' ? { x: 50, y: 50 } : undefined,
        size: type === 'rect' || type === 'circle' ? { width: 100, height: 80 } : undefined,
        fontSize: type === 'text' ? 16 : undefined,
      };
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      pushSnapshot({ cropRegion, rotation, adjustments, annotations: updated });
    },
    [annotations, cropRegion, rotation, adjustments, pushSnapshot]
  );

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
    pushSnapshot({ cropRegion, rotation, adjustments, annotations: [] });
  }, [cropRegion, rotation, adjustments, pushSnapshot]);

  // ── Undo / Redo ─────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) {
      setCropRegion(prev.cropRegion);
      setRotation(prev.rotation);
      setAdjustments(prev.adjustments);
      setAnnotations(prev.annotations);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) {
      setCropRegion(next.cropRegion);
      setRotation(next.rotation);
      setAdjustments(next.adjustments);
      setAnnotations(next.annotations);
    }
  }, [redo]);

  // ── Save / Save As ──────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // In production, export the edited image as a new URI
    const editedUri = imageUri;
    onSave(editedUri);
  }, [imageUri, onSave]);

  const handleSaveAs = useCallback(() => {
    if (onSaveAs) {
      const editedUri = imageUri;
      onSaveAs(editedUri);
    } else {
      Alert.alert('Save As', 'Save As is not available');
    }
  }, [imageUri, onSaveAs]);

  // ── Render ──────────────────────────────────────────────────────
  const modes: EditingMode[] = allowedModes ?? ['crop', 'rotate', 'adjust', 'annotate'];

  // Determine if the image has been modified
  const hasChanges = rotation !== 0 || adjustments.brightness !== 0 || adjustments.contrast !== 0 || annotations.length > 0;

  return (
    <View style={styles.container}>
      {/* Image preview area */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: imageSize.width,
              height: imageSize.height,
              transform: [
                { rotate: `${rotation}deg` },
                // In production, apply brightness/contrast via native module
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Crop overlay */}
        {mode === 'crop' && (
          <CropTool
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            initialCrop={cropRegion ?? undefined}
            onCropChange={setCropRegion}
            onApply={handleCropApply}
            onCancel={handleCropCancel}
          />
        )}

        {/* Annotation overlay */}
        {(mode === 'annotate' || annotations.length > 0) && mode !== 'crop' && (
          <AnnotationOverlay
            annotations={annotations}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            selectedId={selectedAnnotationId}
            onSelect={setSelectedAnnotationId}
          />
        )}
      </View>

      {/* Adjust controls panel */}
      {mode === 'adjust' && (
        <AdjustControls
          adjustments={adjustments}
          onChange={setAdjustments}
          onApply={handleAdjustApply}
          onCancel={handleAdjustCancel}
        />
      )}

      {/* Annotation toolbar */}
      {mode === 'annotate' && (
        <View style={styles.annotationToolbar}>
          <ToolButton label="Text" onPress={() => addAnnotation('text')} />
          <ToolButton label="Arrow" onPress={() => addAnnotation('arrow')} />
          <ToolButton label="Rect" onPress={() => addAnnotation('rect')} />
          <ToolButton label="Circle" onPress={() => addAnnotation('circle')} />
          <ToolButton label="Freehand" onPress={() => addAnnotation('freehand')} />
          <TouchableOpacity style={styles.doneButton} onPress={() => setMode('none')}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom toolbar */}
      <View style={styles.bottomToolbar}>
        {/* Mode buttons */}
        {mode === 'none' && (
          <View style={styles.modeRow}>
            {modes.includes('crop') && (
              <ToolButton label="Crop" onPress={() => enterMode('crop')} />
            )}
            {modes.includes('rotate') && (
              <ToolButton label="Rotate" onPress={rotateImage} />
            )}
            {modes.includes('adjust') && (
              <ToolButton label="Adjust" onPress={() => enterMode('adjust')} />
            )}
            {modes.includes('annotate') && (
              <ToolButton label="Annotate" onPress={() => enterMode('annotate')} />
            )}
          </View>
        )}

        {/* Undo / Redo / Save row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.historyButton, !canUndo && styles.disabledButton]}
            onPress={handleUndo}
            disabled={!canUndo}
          >
            <Text style={styles.historyText}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyButton, !canRedo && styles.disabledButton]}
            onPress={handleRedo}
            disabled={!canRedo}
          >
            <Text style={styles.historyText}>Redo</Text>
          </TouchableOpacity>

          <View style={styles.saveRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {onSaveAs && (
              <TouchableOpacity style={styles.saveAsButton} onPress={handleSaveAs}>
                <Text style={styles.saveAsText}>Save As</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.saveButton, !hasChanges && styles.disabledButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── Small helper component ─────────────────────────────────────────
interface ToolButtonProps {
  label: string;
  onPress: () => void;
  active?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, onPress, active }) => (
  <TouchableOpacity
    style={[styles.toolButton, active && styles.activeTool]}
    onPress={onPress}
  >
    <Text style={[styles.toolButtonText, active && styles.activeToolText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // dynamic width/height set inline
  },
  annotationToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    flexWrap: 'wrap',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomToolbar: {
    backgroundColor: '#1C1C1E',
    paddingBottom: 20,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  toolButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  activeTool: {
    backgroundColor: '#007AFF',
  },
  toolButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeToolText: {
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#38383A',
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2C2C2E',
  },
  disabledButton: {
    opacity: 0.4,
  },
  historyText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 15,
  },
  saveAsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  saveAsText: {
    color: '#007AFF',
    fontSize: 15,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ImageEditor;
