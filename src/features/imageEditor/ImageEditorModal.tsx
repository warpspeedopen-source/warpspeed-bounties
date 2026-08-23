import React, { useState } from 'react';
import { Modal, View, StyleSheet, Image, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useImageEditor } from './hooks/useImageEditor';

export const ImageEditorModal = ({ visible, imageUri, onClose, onSave }) => {
  const { state, applyEdit, undo, redo } = useImageEditor(imageUri);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onSave('new_image_uri');
    onClose();
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={undo}><Text>Undo</Text></TouchableOpacity>
          <TouchableOpacity onPress={redo}><Text>Redo</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSave}><Text>{saving ? 'Saving' : 'Done'}</Text></TouchableOpacity>
        </View>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.6 }
});