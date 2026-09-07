import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { EditorToolbar } from './EditorToolbar';
import { ImageState, HistoryState, Annotation } from './types';

interface InlineImageEditorProps {
  originalImageUri: string;
  onSave: (newImageUri: string) => void;
  onCancel: () => void;
}

const DEFAULT_STATE: ImageState = {
  uri: '',
  rotation: 0,
  crop: null,
  filters: { brightness: 1, contrast: 1, saturation: 1 },
  annotations: [],
};

export const InlineImageEditor: React.FC<InlineImageEditorProps> = ({ originalImageUri, onSave, onCancel }) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: { ...DEFAULT_STATE, uri: originalImageUri },
    future: [],
  });

  const [activeTool, setActiveTool] = useState<string | null>(null);

  const updateState = useCallback((newState: Partial<ImageState>) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: { ...prev.present, ...newState },
      future: [],
    }));
  }, []);

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  };

  const handleRedo = () => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  };

  const handleSave = async () => {
    // In a real implementation, you would apply all transformations
    // using a library like react-native-image-editor or rn-skia,
    // save to a new file, and return the new URI.
    Alert.alert('Save', 'Applying edits and saving as new version...');
    const fakeNewUri = originalImageUri + '-edited';
    onSave(fakeNewUri);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.canvasContainer}>
        {/* EditorCanvas would go here, receiving history.present */}
        <View style={styles.placeholderCanvas} />
      </View>
      <EditorToolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onToolSelect={setActiveTool}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCanvas: {
    width: '90%',
    height: '80%',
    backgroundColor: '#333',
    borderRadius: 8,
  },
});
