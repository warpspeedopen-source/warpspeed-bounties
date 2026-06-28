 ```diff
--- /dev/null
+++ b/src/components/audio/AudioPlayer.tsx
@@ -0,0 +1,268 @@
+import React, { useState, useEffect, useRef, useCallback } from 'react';
+import {
+  View,
+  Text,
+  TouchableOpacity,
+  StyleSheet,
+  Animated,
+  PanResponder,
+  GestureResponderEvent,
+} from 'react-native';
+import { Audio } from 'expo-av';
+import { Ionicons } from '@expo/vector-icons';
+import { AudioPlayerProps, PlaybackSpeed } from '../../types/audio';
+import { formatDuration } from '../../utils/time';
+import { colors } from '../../theme/colors';
+
+const PLAYBACK_SPEEDS: PlaybackSpeed[] = [1, 1.5, 2];
+
+export const AudioPlayer: React.FC<AudioPlayerProps> = ({
+  audioUri,
+  initialPosition = 0,
+  onPositionChange,
+  onDelete,
+  noteId,
+}) => {
+  const [sound, setSound] = useState<Audio.Sound | null>(null);
+  const [isPlaying, setIsPlaying] = useState(false);
+  const [position, setPosition] = useState(initialPosition);
+  const [duration, setDuration] = useState(0);
+  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
+  const [isLoading, setIsLoading] = useState(true);
+  
+  const progressAnim = useRef(new Animated.Value(0)).current;
+  const positionRef = useRef(position);
+  const animationFrame = useRef<number>();
+
+  useEffect(() => {
+    loadAudio();
+    return () => {
+      cleanup();
+    };
+  }, [audioUri]);
+
+  const cleanup = async () => {
+    if (animationFrame.current) {
+      cancelAnimationFrame(animationFrame.current);
+    }
+    if (sound) {
+      await sound.unloadAsync();
+    }
+  };
+
+  const loadAudio = async () => {
+    try {
+      setIsLoading(true);
+      const { sound: newSound, status } = await Audio.Sound.createAsync(
+        { uri: audioUri },
+        {
+          shouldPlay: false,
+          positionMillis: initialPosition,
+          rate: playbackSpeed,
+        },
+        onPlaybackStatusUpdate
+      );
+
+      setSound(newSound);
+      
+      if (status.isLoaded) {
+        setDuration(status.durationMillis || 0);
+        setPosition(status.positionMillis || 0);
+      }
+      setIsLoading(false);
+    } catch (error) {
+      console.error('Error loading audio:', error);
+      setIsLoading(false);
+    }
+  };
+
+  const onPlaybackStatusUpdate = useCallback((status: any) => {
+    if (status.isLoaded) {
+      setPosition(status.positionMillis);
+      positionRef.current = status.positionMillis;
+      
+      if (status.didJustFinish) {
+        setIsPlaying(false);
+        setPosition(0);
+        positionRef.current = 0;
+        if (onPositionChange) {
+          onPositionChange(0);
+        }
+      }
+    }
+  }, [onPositionChange]);
+
+  const togglePlayPause = async () => {
+    if (!sound) return;
+
+    if (isPlaying) {
+      await sound.pauseAsync();
+      setIsPlaying(false);
+      if (onPositionChange) {
+        onPositionChange(positionRef.current);
+      }
+    } else {
+      await sound.playAsync();
+      setIsPlaying(true);
+    }
+  };
+
+  const seekTo = async (newPosition: number) => {
+    if (!sound) return;
+    const clampedPosition = Math.max(0, Math.min(newPosition, duration));
+    await sound.setPositionAsync(clampedPosition);
+    setPosition(clampedPosition);
+    positionRef.current = clampedPosition;
+  };
+
+  const skipForward = async () => {
+    await seekTo(position + 15000); // 15 seconds
+  };
+
+  const skipBackward = async () => {
+    await seekTo(position - 15000); // 15 seconds
+  };
+
+  const changePlaybackSpeed = async () => {
+    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
+    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
+    const newSpeed = PLAYBACK_SPEEDS[nextIndex];
+    
+    setPlaybackSpeed(newSpeed);
+    if (sound) {
+      await sound.setRateAsync(newSpeed, true);
+    }
+  };
+
+  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;
+
+  const panResponder = useRef(
+    PanResponder.create({
+      onStartShouldSetPanResponder: () => true,
+      onMoveShouldSetPanResponder: () => true,
+      onPanResponderMove: (_, gestureState) => {
+        const { moveX } = gestureState;
+        // Calculate progress based on touch position
+        // This is simplified - in production you'd measure the progress bar width
+      },
+      onPanResponderRelease: (_, gestureState) => {
+        // Handle seek on release
+      },
+    })
+  ).current;
+
+  return (
+    <View style={styles.container}>
+      <View style={styles.waveformContainer}>
+        {/* Waveform visualization would go here */}
+        <View style={styles.waveformPlaceholder}>
+          {[...Array(40)].map((_, i) => (
+            <View
+              key={i}
+              style={[
+                styles.waveformBar,
+                {
+                  height: Math.random() * 40 + 10,
+                  backgroundColor:
+                    i < (progressPercentage / 100) * 40
+                      ? colors.primary
+                      : colors.gray300,
+                },
+              ]}
+            />
+          ))}
+        </View>
+      </View>
+
+      <View style={styles.progressContainer}>
+        <View style={styles.progressBar}>
+          <View
+            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
+          />
+        </View>
+      </View>
+
+      <View style={styles.timeContainer}>
+        <Text style={styles.timeText}>{formatDuration(position)}</Text>
+        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
+      </View>
+
+      <View style={styles.controlsContainer}>
+        <TouchableOpacity onPress={skipBackward} style={