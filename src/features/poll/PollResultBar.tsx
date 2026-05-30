import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface PollResultBarProps {
  percentage: number;
  isSelected: boolean;
  color?: string;
}

export const PollResultBar: React.FC<PollResultBarProps> = ({
  percentage,
  isSelected,
  color = '#007AFF',
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percentage, widthAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: isSelected ? color : '#C7C7CC',
            },
          ]}
        />
      </View>
      <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    minWidth: 32,
    textAlign: 'right',
  },
});
