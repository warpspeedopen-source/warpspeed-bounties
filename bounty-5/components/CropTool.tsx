import React from 'react';
import { View, Text, Slider, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useEditorStore } from '../state/editorStore';

const CropTool = observer(() => {
  const store = useEditorStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crop & Rotate</Text>

      {/* Aspect ratio label */}
      <View style={styles.row}>
        <Text style={styles.label}>Rotation</Text>
        <Text style={styles.value}>{Math.round(store.rotation)}°</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={-180}
        maximumValue={180}
        step={1}
        value={store.rotation}
        onValueChange={(val: number) => store.setRotation(val)}
        minimumTrackTintColor="#4a9eff"
        maximumTrackTintColor="#555"
        thumbTintColor="#4a9eff"
      />

      <View style={styles.buttonRow}>
        <Text style={styles.hint}>
          Drag corners on the image to crop
        </Text>
      </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#cccccc',
    fontSize: 14,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default CropTool;
