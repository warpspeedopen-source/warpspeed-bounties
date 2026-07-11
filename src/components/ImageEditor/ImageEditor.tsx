import React, { useState, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Image,
  PixelRatio
} from 'react-native';
import { Canvas, CanvasRenderingContext2D } from 'react-native-canvas';
import { ImageEditorTools } from './ImageEditorTools';
import { ImageEditorProvider, useImageEditor } from './ImageContext';
import { ImageProcessor } from './ImageProcessor';

interface ImageEditorProps {
  imageUri: string;
  isVisible: boolean;
  onClose: () => void;
  onSave: (editedImageUri: string) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageUri, 
  isVisible, 
  onClose, 
  onSave 
}) => {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const canvasRef = useRef<any>(null);
  
  const handleSave = async () => {
    try {
      // Process the image with current edits
      const editedImageUri = await ImageProcessor.processImage(
        imageUri,
        { brightness, contrast, rotation }
      );
      onSave(editedImageUri);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setRotation(0);
    setCropArea({ x: 0, y: false, width: 100, height: 100 });
  };

  if (!isVisible) return null;

  return (
    <ImageEditorProvider>
      <View style={styles.container}>
        <ImageEditorTools 
          brightness={brightness}
          contrast={contrast}
          rotation={rotation}
          onBrightnessChange={setBrightness}
          onContrastChange={setContrast}
          onRotationChange={setRotation}
        />
        <View style={styles.editorContainer}>
          <View style={styles.canvasContainer}>
            <Canvas
              ref={canvasRef}
              style={styles.canvas}
              onCanvasReady={() => {
                // Canvas is ready for drawing
              }}
            />
          </View>
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
    </ImageEditorProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#333',
  },
  canvas: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    margin: 10,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    margin: 10,
  },
  resetText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});