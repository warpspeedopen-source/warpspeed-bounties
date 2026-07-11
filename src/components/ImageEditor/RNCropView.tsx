import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import { CropViewProps } from './types';

const RNCropView: React.FC<CropViewProps> = (props) => {
  const [cropArea, setCropArea] = useState({ 
    x: 0, 
    y: 0, 
    width: 100, 
    height: 100 
  });
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        // Handle crop area movement
        setCropArea({
          x: gesture.moveX,
          y: gesture.moveY,
          width: 100,
          height: 100
        });
      }
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.cropArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  cropArea: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  }
});

export default RNCropView;