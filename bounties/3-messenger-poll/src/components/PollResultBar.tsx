/**
 * PollResultBar Component
 * Displays a visual progress bar with vote count and percentage
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { PollOptionResult } from '../types';
import { RESULT_BAR_COLORS } from '../constants';

interface PollResultBarProps {
  result: PollOptionResult;
  index: number;
  maxVotes: number;
  isSelected: boolean;
  isLeading: boolean;
  onPress?: (optionId: string) => void;
  disabled?: boolean;
  showVoters?: boolean;
}

export const PollResultBar: React.FC<PollResultBarProps> = ({
  result,
  index,
  maxVotes,
  isSelected,
  isLeading,
  onPress,
  disabled = false,
  showVoters = false,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const barColor = RESULT_BAR_COLORS[index % RESULT_BAR_COLORS.length];

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: result.percentage,
      duration: 600,
      useNativeDriver: false,
    }).join();
  }, [result.percentage, animatedWidth]);

  const barContainerStyle: ViewStyle = {
    borderColor: isSelected ? barColor : 'transparent',
    borderWidth: isSelected ? 2 : 0,
  };

  const content = (
    <View style={[styles.container, barContainerStyle]}>
      <View style={styles.header}>
        <View style={styles.optionRow}>
          {isSelected && (
            <View style={[styles.checkmark, { backgroundColor: barColor }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
          <Text
            style={[styles.optionText, isSelected && styles.optionTextSelected]}
            numberOfLines={2}
          >
            {result.option.text}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.percentage, isLeading && styles.leadingPercentage]}>
            {result.percentage}%
          </Text>
          <Text style={styles.voteCount}>
            {result.voteCount} {result.voteCount === 1 ? 'vote' : 'votes'}
          </Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: barColor,
              opacity: isSelected ? 1 : 0.7,
            },
          ]}
        />
      </View>

      {showVoters && result.voters.length > 0 && (
        <View style={styles.voterPreviews}>
          {result.voters.slice(0, 5).map((voter, vIdx) => (
            <View
              key={voter.userId}
              style={[
                styles.voterAvatar,
                { marginLeft: vIdx > 0 ? -8 : 0, zIndex: 5 - vIdx },
              ]}
            >
              <Text style={styles.voterInitial}>
                {voter.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {result.voters.length > 5 && (
            <Text style={styles.moreVoters}>+{result.voters.length - 5}</Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={() => onPress(result.option.id)}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  statsRow: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  leadingPercentage: {
    color: '#1A1A1A',
  },
  voteCount: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  voterPreviews: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  voterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  voterInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  moreVoters: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 6,
    fontWeight: '500',
  },
});
