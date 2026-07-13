import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useEditorStore } from '../state/editorStore';

const UndoRedoBar = observer(() => {
  const store = useEditorStore();
  const canUndo = store.history.length > 0;
  const canRedo = store.future.length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canUndo && styles.buttonDisabled]}
        onPress={() => store.undo()}
        disabled={!canUndo}
      >
        <Text style={[styles.label, !canUndo && styles.labelDisabled]}>
          ↩ Undo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !canRedo && styles.buttonDisabled]}
        onPress={() => store.redo()}
        disabled={!canRedo}
      >
        <Text style={[styles.label, !canRedo && styles.labelDisabled]}>
          Redo ↪
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  labelDisabled: {
    color: '#888',
  },
});

export default UndoRedoBar;
