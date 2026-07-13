import React, { useCallback } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useEditorStore } from '../state/editorStore';
import CropTool from './CropTool';
import AdjustPanel from './AdjustPanel';
import AnnotationToolbar from './AnnotationToolbar';
import UndoRedoBar from './UndoRedoBar';
import { EditOperation } from '../types';

const TOOLS: { key: EditOperation; label: string }[] = [
  { key: 'crop', label: 'Crop' },
  { key: 'adjust', label: 'Adjust' },
  { key: 'pen', label: 'Pen' },
  { key: 'text', label: 'Text' },
  { key: 'arrow', label: 'Arrow' },
  { key: 'highlight', label: 'Highlight' },
];

const ImageEditor = observer(() => {
  const store = useEditorStore();

  const handleToolPress = useCallback(
    (tool: EditOperation) => {
      store.setCurrentOperation(
        store.currentOperation === tool ? 'none' : tool,
      );
    },
    [store],
  );

  const handleSave = useCallback(() => {
    // Compose final image and save
    store.saveEdit();
  }, [store]);

  const handleCancel = useCallback(() => {
    store.closeEditor();
  }, [store]);

  if (!store.visible) return null;

  const currentState = store.currentState;

  return (
    <Modal visible={store.visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.headerButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Image</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.headerButton, styles.saveButton]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Image preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentState?.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Active tool panel */}
        {store.currentOperation === 'crop' && <CropTool />}
        {store.currentOperation === 'adjust' && <AdjustPanel />}
        {(store.currentOperation === 'pen' ||
          store.currentOperation === 'text' ||
          store.currentOperation === 'arrow' ||
          store.currentOperation === 'highlight') && <AnnotationToolbar />}

        {/* Tool bar */}
        <View style={styles.toolBar}>
          {TOOLS.map((tool) => {
            const active = store.currentOperation === tool.key;
            return (
              <TouchableOpacity
                key={tool.key}
                style={[styles.toolButton, active && styles.toolButtonActive]}
                onPress={() => handleToolPress(tool.key)}
              >
                <Text
                  style={[
                    styles.toolLabel,
                    active && styles.toolLabelActive,
                  ]}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Undo / Redo */}
        <UndoRedoBar />
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
  },
  headerButton: {
    color: '#ffffff',
    fontSize: 16,
  },
  saveButton: {
    color: '#4a9eff',
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  toolBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
  },
  toolButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
  },
  toolButtonActive: {
    backgroundColor: '#4a9eff',
  },
  toolLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  toolLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default ImageEditor;
