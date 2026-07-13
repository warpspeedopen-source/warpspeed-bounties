import React from 'react';
import { View, Text, Slider, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useEditorStore } from '../state/editorStore';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

const SliderRow = ({ label, value, min, max, onChange }: SliderRowProps) => (
  <View style={styles.row}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{Math.round(value * 100)}%</Text>
    </View>
    <Slider
      style={styles.slider}
      minimumValue={min}
      maximumValue={max}
      step={0.01}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor="#4a9eff"
      maximumTrackTintColor="#555"
      thumbTintColor="#4a9eff"
    />
  </View>
);

const AdjustPanel = observer(() => {
  const store = useEditorStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adjustments</Text>

      <SliderRow
        label="Brightness"
        value={store.brightness}
        min={0}
        max={2}
        onChange={(val: number) => store.setBrightness(val)}
      />

      <SliderRow
        label="Contrast"
        value={store.contrast}
        min={0}
        max={2}
        onChange={(val: number) => store.setContrast(val)}
      />

      <SliderRow
        label="Saturation"
        value={store.saturation}
        min={0}
        max={2}
        onChange={(val: number) => store.setSaturation(val)}
      />
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
    marginBottom: 12,
  },
  row: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    height: 36,
  },
});

export default AdjustPanel;
