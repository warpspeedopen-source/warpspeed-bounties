import { Alert } from 'react-native';
import { ImageItem } from './types';

export const handleDownload = (image: ImageItem, onDownload?: (img: ImageItem) => void) => {
  if (onDownload) {
    onDownload(image);
  } else {
    Alert.alert("Download", `Downloading image ${image.id}`);
  }
};

export const handleShare = (image: ImageItem, onShare?: (img: ImageItem) => void) => {
  if (onShare) {
    onShare(image);
  } else {
    Alert.alert("Share", `Sharing image ${image.id}`);
  }
};

export const handleDelete = (image: ImageItem, onDelete?: (img: ImageItem) => void) => {
  if (onDelete) {
    onDelete(image);
  } else {
    Alert.alert("Delete", `Deleting image ${image.id}`);
  }
};
