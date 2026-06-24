import React, { ComponentType } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { EnhancedImagePreviewProps } from './types';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

interface EnhancedImagePreviewProps {
  images: ImageSource[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const EnhancedImagePreview: React.FC<{}> = ({ 
  images, 
  initialIndex,
  visible, 
  onImageIndexChange 
}) => {
  return (
    <div className="flex flex-col items-center">
      <h2>Image Preview Component</h2>
      {images.map((image, idx) => (
        <img key={image.id} src={image.uri} alt="preview" 
            style={currentImageIndex === idx ? { display: 'block' } : { display: 'none' }} 
      />
      ))}
    </div>
  );
};