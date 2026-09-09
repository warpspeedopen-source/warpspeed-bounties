import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface ActionBarProps {
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  enableDownload?: boolean;
  enableShare?: boolean;
  enableDelete?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onDownload,
  onShare,
  onDelete,
  enableDownload = true,
  enableShare = true,
  enableDelete = true,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !enableDownload && styles.buttonDisabled]}
        onPress={onDownload}
        disabled={!enableDownload}
        accessibilityLabel="下载图片"
        accessibilityRole="button"
        accessibilityState={{ disabled: !enableDownload }}
      >
        <Text style={[styles.buttonText, !enableDownload && styles.textDisabled]}>
          Download
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonPrimary, !enableShare && styles.buttonDisabled]}
        onPress={onShare}
        disabled={!enableShare}
        accessibilityLabel="分享图片"
        accessibilityRole="button"
        accessibilityState={{ disabled: !enableShare }}
      >
        <Text style={[styles.buttonText, styles.textPrimary, !enableShare && styles.textDisabled]}>
          Share
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDanger, !enableDelete && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={!enableDelete}
        accessibilityLabel="删除图片"
        accessibilityRole="button"
        accessibilityState={{ disabled: !enableDelete }}
      >
        <Text style={[styles.buttonText, styles.textDanger, !enableDelete && styles.textDisabled]}>
          Delete
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textDanger: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: '#999999',
  },
});

export default ActionBar;
