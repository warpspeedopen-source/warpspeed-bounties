import { Platform, PermissionsAndroid, Alert, Share, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { showToast } from './toast';

export interface DownloadOptions {
  url: string;
  filename?: string;
  mimeType?: string;
  destination?: string;
}

/**
 * 请求存储权限 (Android 6.0+)
 * @returns 权限是否已授予
 */
async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 13+ 使用 Photo Picker，不需要存储权限
  const sdkVersion = Platform.Version as number;
  if (sdkVersion >= 33) {
    return true;
  }

  // Android 10-12 请求 MANAGE_EXTERNAL_STORAGE (如果需要)
  if (sdkVersion >= 29) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: '存储权限',
          message: '需要存储权限来保存图片到本地',
          buttonNeutral: '稍后询问',
          buttonNegative: '取消',
          buttonPositive: '确定',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('请求存储权限失败:', err);
      return false;
    }
  }

  // Android 6-9 请求 WRITE_EXTERNAL_STORAGE
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: '存储权限',
        message: '需要存储权限来保存图片到本地',
        buttonNeutral: '稍后询问',
        buttonNegative: '取消',
        buttonPositive: '确定',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('请求存储权限失败:', err);
    return false;
  }
}

/**
 * 获取下载目标路径
 * @param filename 文件名
 * @param destination 目标目录类型
 */
function getDownloadPath(filename: string, destination?: string): string {
  const downloadDir =
    destination === 'cache'
      ? RNFS.CachesDirectoryPath
      : Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath || RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

  return `${downloadDir}/${filename}`;
}

/**
 * 处理图片下载
 * @param options 下载配置
 * @param onProgress 进度回调
 * @param onComplete 完成回调 (filePath)
 * @param onError 错误回调
 */
export async function handleDownload(
  options: DownloadOptions,
  onProgress?: (progress: number) => void,
  onComplete?: (filePath: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const { url, filename, destination = 'download' } = options;

  try {
    // 生成文件名
    const name = filename || `image_${Date.now()}.jpg`;
    const filePath = getDownloadPath(name, destination);

    // 请求存储权限 (仅 Android)
    if (Platform.OS === 'android') {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        const error = new Error('存储权限被拒绝，无法保存图片');
        onError?.(error);
        showToast('存储权限被拒绝');
        return;
      }
    }

    // 显示下载提示
    showToast('开始下载...');

    // 执行下载
    const downloadOptions = {
      fromUrl: url,
      toFile: filePath,
      background: true,
      discretionary: true,
    };

    const downloadResult = await RNFS.downloadFile(downloadOptions).promise;

    if (downloadResult.statusCode === 200) {
      showToast('保存成功');
      onComplete?.(filePath);

      // Android: 通知媒体库扫描新文件
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(filePath);
        } catch (scanError) {
          console.warn('媒体库扫描失败:', scanError);
        }
      }
    } else {
      throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    console.error('下载失败:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    showToast('下载失败，请重试');
  }
}

/**
 * 处理分享功能
 * @param options 分享配置
 */
export async function handleShare(options: {
  url?: string;
  message?: string;
  title?: string;
  filename?: string;
}): Promise<void> {
  const { url, message, title = '分享图片' } = options;

  try {
    // 如果有 URL，先下载临时文件再分享
    if (url) {
      const filename = options.filename || `share_${Date.now()}.jpg`;
      const tempPath = `${RNFS.CachesDirectoryPath}/${filename}`;

      showToast('准备分享...');

      // 下载到临时目录
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: tempPath,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error('下载分享文件失败');
      }

      // 构建分享内容
      const shareContent = Platform.OS === 'ios'
        ? {
            url: `file://${tempPath}`,
            title,
          }
        : {
            message: message || title,
            url: `file://${tempPath}`,
            title,
          };

      const result = await Share.share(shareContent as any, {
        dialogTitle: title,
        subject: title,
      });

      if (result.action === Share.sharedAction) {
        showToast('分享成功');
      } else if (result.action === Share.dismissedAction) {
        showToast('分享已取消');
      }

      // 清理临时文件 (延迟执行)
      setTimeout(async () => {
        try {
          await RNFS.unlink(tempPath);
        } catch {
          // 忽略清理错误
        }
      }, 5000);

      return;
    }

    // 无 URL 时的纯文本分享
    if (message) {
      const result = await Share.share(
        {
          message,
          title,
        },
        {
          dialogTitle: title,
        }
      );

      if (result.action === Share.sharedAction) {
        showToast('分享成功');
      } else if (result.action === Share.dismissedAction) {
        showToast('分享已取消');
      }
    }
  } catch (error) {
    console.error('分享失败:', error);
    showToast('分享失败，请重试');
  }
}

/**
 * 显示删除确认对话框
 * @param options 确认配置
 * @param onConfirm 确认回调
 * @param onCancel 取消回调
 */
export function handleDelete(
  options: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  },
  onConfirm?: () => void,
  onCancel?: () => void
): void {
  const {
    title = '确认删除',
    message = '确定要删除这张图片吗？此操作无法撤销。',
    confirmText = '删除',
    cancelText = '取消',
  } = options;

  Alert.alert(title, message, [
    {
      text: cancelText,
      style: 'cancel',
      onPress: () => {
        onCancel?.();
      },
    },
    {
      text: confirmText,
      style: 'destructive',
      onPress: () => {
        onConfirm?.();
      },
    },
  ]);
}

/**
 * 处理在浏览器中打开链接
 * @param url 链接地址
 */
export async function handleOpenInBrowser(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      showToast('无法打开链接');
    }
  } catch (error) {
    console.error('打开链接失败:', error);
    showToast('打开链接失败');
  }
}
