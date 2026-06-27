import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Annotation } from '../types';

interface AnnotationOverlayProps {
  annotations: Annotation[];
  imageWidth: number;
  imageHeight: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * Renders annotations (arrows, text, shapes, freehand drawings)
 * on top of the image using absolute positioning.
 * In a real implementation, this would use react-native-svg Path/Polyline etc.
 */
export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  imageWidth,
  imageHeight,
  selectedId,
  onSelect,
}) => {
  return (
    <View style={[styles.overlay, { width: imageWidth, height: imageHeight }]}>
      {annotations.map((ann) => (
        <View
          key={ann.id}
          style={[
            styles.annotation,
            { borderColor: selectedId === ann.id ? '#007AFF' : 'transparent' },
          ]}
          onTouchEnd={() => onSelect(ann.id === selectedId ? null : ann.id)}
        >
          {/* Render different annotation types */}
          {ann.type === 'text' && ann.text && ann.position && (
            <View style={[styles.textBox, { left: ann.position.x, top: ann.position.y }]}>
              <View
                style={[
                  styles.textBackground,
                  {
                    backgroundColor: ann.color + '33',
                    borderColor: ann.color,
                  },
                ]}
              >
                <Text style={{ color: ann.color, fontSize: ann.fontSize ?? 16 }}>
                  {ann.text}
                </Text>
              </View>
            </View>
          )}

          {/* Arrow / freehand placeholder - would use SVG in production */}
          {ann.type === 'arrow' && ann.points && ann.points.length >= 2 && (
            <View
              style={[
                styles.lineIndicator,
                {
                  left: Math.min(ann.points[0].x, ann.points[ann.points.length - 1].x),
                  top: Math.min(ann.points[0].y, ann.points[ann.points.length - 1].y),
                  width: Math.abs(ann.points[ann.points.length - 1].x - ann.points[0].x),
                  height: Math.abs(ann.points[ann.points.length - 1].y - ann.points[0].y),
                  borderColor: ann.color,
                },
              ]}
            />
          )}

          {/* Rect / Circle */}
          {(ann.type === 'rect' || ann.type === 'circle') && ann.origin && ann.size && (
            <View
              style={[
                ann.type === 'circle' ? styles.circleShape : styles.rectShape,
                {
                  left: ann.origin.x,
                  top: ann.origin.y,
                  width: ann.size.width,
                  height: ann.size.height,
                  borderColor: ann.color,
                  backgroundColor: ann.color + '1A',
                },
              ]}
            />
          )}

          {/* Freehand path placeholder */}
          {ann.type === 'freehand' && ann.points && ann.points.length > 1 && (
            <View
              style={[
                styles.freehandIndicator,
                {
                  left: ann.points[0].x,
                  top: ann.points[0].y,
                  borderColor: ann.color,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
};

// Need to import Text
import { Text } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  annotation: {
    position: 'absolute',
    borderWidth: 1,
  },
  textBox: {
    position: 'absolute',
  },
  textBackground: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  lineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  rectShape: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 2,
  },
  circleShape: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 999,
  },
  freehandIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});

export default AnnotationOverlay;
