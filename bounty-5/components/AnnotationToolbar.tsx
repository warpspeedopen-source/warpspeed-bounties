import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useEditorStore } from '../state/editorStore';

const COLORS = ['#ffffff', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];

const AnnotationToolbar = observer(() => {
  const store = useEditorStore();
  const op = store.currentOperation;

  const opLabel = op === 'pen'
    ? 'Pen'
    : op === 'text'
    ? 'Text'
    : op === 'arrow'
    ? 'Arrow'
    : 'Highlight';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{opLabel} Tool</Text>

      {/* Color palette */}
      <View style={styles.colorRow}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colors}>
          {COLORS.map((color) => {
            const selected =
              op === 'pen'
                ? store.penColor === color
                : op === 'text'
                ? store.textColor === color
                : op === 'arrow'
                ? store.arrowColor === color
                : store.highlightColor === color;

            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selected && styles.colorSelected,
                ]}
                onPress={() => store.setActiveColor(color)}
              />
            );
          })}
        </View>
      </View>

      {/* Width / size controls */}
      <View style={styles.sizeRow}>
        <Text style={styles.label}>
          {op === 'text' ? 'Font Size' : op === 'highlight' ? 'Opacity' : 'Width'}
        </Text>
        <View style={styles.sizeOptions}>
          {[2, 4, 6, 8].map((size) => {
            let active = false;
            if (op === 'pen') active = store.penWidth === size;
            else if (op === 'text') active = store.fontSize === size * 4;
            else if (op === 'highlight') active = Math.round(store.highlightOpacity * 10) === size * 10;
            else active = store.penWidth === size;

            return (
              <TouchableOpacity
                key={size}
                style={[styles.sizeButton, active && styles.sizeButtonActive]}
                onPress={() => {
                  if (op === 'pen') store.setPenWidth(size);
                  else if (op === 'text') store.setFontSize(size * 4);
                  else if (op === 'highlight') store.setHighlightOpacity(size / 10);
                  else store.setPenWidth(size);
                }}
              >
                <Text style={[styles.sizeText, active && styles.sizeTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        {op === 'pen'
          ? 'Drag to draw on the image'
          : op === 'text'
          ? 'Tap on the image to place text'
          : op === 'arrow'
          ? 'Drag to draw an arrow'
          : 'Drag to highlight an area'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#222',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#cccccc',
    fontSize: 13,
    marginRight: 10,
    width: 60,
  },
  colors: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#ffffff',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3a3a3a',
  },
  sizeButtonActive: {
    backgroundColor: '#4a9eff',
  },
  sizeText: {
    color: '#ffffff',
    fontSize: 13,
  },
  sizeTextActive: {
    fontWeight: '700',
  },
  instruction: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AnnotationToolbar;
