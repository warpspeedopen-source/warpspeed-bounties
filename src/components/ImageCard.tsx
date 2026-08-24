--- a/src/components/ImageCard.tsx
+++ b/src/components/ImageCard.tsx
@@ -1,10 +1,14 @@
 import React from 'react';
 import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
+import EnhancedImagePreview, { PreviewImage } from './EnhancedImagePreview';
 
 interface ImageCardProps {
   uri: string;
-  onPress?: () => void;
+  onPress?: (index: number, images: PreviewImage[]) => void;
+  previewImages?: PreviewImage[];
 }
 
 const ImageCard: React.FC<ImageCardProps> = ({ uri, onPress, previewImages }) => {
+  const images = previewImages || [{ id: '1', uri, canShare: true, canDownload: true }];
+
   return (
     <TouchableOpacity
       activeOpacity={0.8}
-      onPress={onPress}
+      onPress={() => onPress?.(0, images)}
       style={styles.container}
     >
       <Image source={{ uri }} style={styles.image} resizeMode="cover" />
     </TouchableOpacity>
   );
 };
 
 const styles = StyleSheet.create({
   container: {
     width: '100%',
     aspectRatio: 1,
     borderRadius: 12,
     overflow: 'hidden',
     backgroundColor: '#f0f0f0',
   },
   image: {
     width: '100%',
     height: '100%',
   },
 });
 
 export default ImageCard;