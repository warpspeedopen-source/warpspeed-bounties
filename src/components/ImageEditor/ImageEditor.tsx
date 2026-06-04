import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

// --- DEPENDENCY NOTE ---
// This component is designed to work with image processing libraries.
// The developer claiming this bounty will need to install and integrate them.
// Recommended libraries:
// - `@react-native-community/image-editor` for cropping and rotation.
// - `@react-native-community/slider` for filter adjustments.
// - `@shopify/react-native-skia` for powerful annotation/drawing capabilities.

// This is a placeholder for the actual library to allow the component to be demonstrated.
const MockImageEditor = {
  cropImage: (uri: string, cropData: any): Promise<string> => {
    console.log('MOCK: Cropping image:', uri, cropData);
    // In a real implementation, this would return a new URI to a temporary file.
    return Promise.resolve(`cropped-version-of-${uri.split('/').pop()}`);
  },
};

const { width: screenWidth } = Dimensions.get('window');

type Tool = 'crop' | 'rotate' | 'filter' | 'draw' | null;

interface ImageEditorProps {
  /** The URI of the image to be edited. */
  imageUri: string;
  /** Callback function when the user saves the edited image. */
  onSave: (newUri: string) => void;
  /** Callback function when the user cancels the editing session. */
  onCancel: () => void;
}

const ImageEditorComponent: React.FC<ImageEditorProps> = ({
  imageUri,
  onSave,
  onCancel,
}) => {
  const [history, setHistory] = React.useState<string[]>([imageUri]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [activeTool, setActiveTool] = React.useState<Tool>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // TODO: Add states for filters (brightness, contrast, saturation)
  // const [brightness, setBrightness] = React.useState(1);

  // TODO: Add state for annotations (paths for react-native-skia)
  // const [paths, setPaths] = React.useState<SkPath[]>([]);

  const currentImageUri = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateHistory = (newUri: string) => {
    // Discard any 'redo' history once a new edit is made
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUri);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSavePress = () => {
    // The final URI from the history stack is the one to save.
    onSave(currentImageUri);
  };

  const handleCrop = async () => {
    setIsLoading(true);
    try {
      // TODO: This would be driven by a proper cropping UI overlay.
      const cropData = {
        offset: { x: 20, y: 20 },
        size: { width: 300, height: 300 },
        displaySize: { width: screenWidth, height: 300 },
      };
      // const croppedUri = await ImageEditor.cropImage(currentImageUri, cropData);
      const croppedUri = await MockImageEditor.cropImage(currentImageUri, cropData);
      updateHistory(croppedUri);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsLoading(false);
      setActiveTool(null); // Close tool options after applying
    }
  };

  // TODO: Implement other editing functions (rotate, applyFilter, drawOnImage)
  // They will follow a similar pattern to handleCrop.

  const renderToolOptions = () => {
    switch (activeTool) {
      case 'filter':
        return (
          <View style={styles.toolOptionsContainer}>
            <Text style={styles.placeholderText}>Brightness, Contrast, Saturation sliders here</Text>
            {/* Example: <Slider value={brightness} onValueChange={setBrightness} /> */}
          </View>
        );
      case 'crop':
        return (
            <View style={styles.toolOptionsContainer}>
                <Text style={styles.placeholderText}>Crop handles and aspect ratio options would be overlaid on the image.</Text>
                <TouchableOpacity style={styles.applyButton} onPress={handleCrop}>
                    <Text style={styles.applyButtonText}>Apply Crop</Text>
                </TouchableOpacity>
            </View>
        );
      // TODO: Add cases for 'rotate', 'draw', etc.
      default:
        return <View style={styles.toolOptionsContainer} />;
    }
  };

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <TouchableOpacity onPress={() => setActiveTool('crop')} style={styles.toolButton}><Text style={styles.toolText}>Crop</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTool('rotate')} style={styles.toolButton}><Text style={styles.toolText}>Rotate</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTool('filter')} style={styles.toolButton}><Text style={styles.toolText}>Filter</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTool('draw')} style={styles.toolButton}><Text style={styles.toolText}>Draw</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.historyButtons}>
            <TouchableOpacity onPress={handleUndo} disabled={!canUndo}>
                <Text style={[styles.headerButton, !canUndo && styles.disabledButton]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRedo} disabled={!canRedo}>
                <Text style={[styles.headerButton, !canRedo && styles.disabledButton]}>Redo</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSavePress}>
          <Text style={styles.headerButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {/* TODO: Overlay drawing canvas (react-native-skia) or crop UI here based on activeTool */}
        <Image
          source={{ uri: currentImageUri }}
          style={styles.image}
          resizeMode="contain"
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>
      
      {renderToolOptions()}
      {renderToolbar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
  },
  headerButton: {
    color: '#0A84FF',
    fontSize: 17,
  },
  historyButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  disabledButton: {
    color: '#555',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#1C1C1E',
  },
  toolButton: {
    padding: 8,
  },
  toolText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  toolOptionsContainer: {
    height: 100, // Fixed height for tool options area
    padding: 16,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 10,
  },
  applyButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default ImageEditorComponent;
