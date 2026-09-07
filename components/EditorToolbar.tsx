import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImageState } from './types';

interface EditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToolSelect: (tool: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onUndo,
  onRedo,
  onSave,
  canUndo,
  canRedo,
  onToolSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onUndo} disabled={!canUndo} style={[styles.btn, !canUndo && styles.disabled]}>
          <Text style={styles.text}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRedo} disabled={!canRedo} style={[styles.btn, !canRedo && styles.disabled]}>
          <Text style={styles.text}>Redo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={styles.btnPrimary}>
          <Text style={styles.textPrimary}>Save as New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={() => onToolSelect('crop')} style={styles.toolBtn}>
          <Text style={styles.text}>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToolSelect('rotate')} style={styles.toolBtn}>
          <Text style={styles.text}>Rotate</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToolSelect('adjust')} style={styles.toolBtn}>
          <Text style={styles.text}>Adjust</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToolSelect('annotate')} style={styles.toolBtn}>
          <Text style={styles.text}>Annotate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1e1e1e',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  btn: {
    padding: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  btnPrimary: {
    padding: 8,
    backgroundColor: '#007aff',
    borderRadius: 8,
  },
  toolBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
  },
  text: {
    color: '#fff',
  },
  textPrimary: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
