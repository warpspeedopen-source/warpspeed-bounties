import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Poll, PollOption, Voter } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PollMessageProps {
  poll: Poll;
  currentUser: Voter;
  onVote: (pollId: string, optionId: string) => void;
  onShowVoters: (option: PollOption) => void;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  poll,
  currentUser,
  onVote,
  onShowVoters,
}) => {
  // Calculate total votes across all options
  const totalVotesCount = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);

  // Determine unique voter count
  const allVoters = poll.options.flatMap((opt) => opt.votes);
  const uniqueVoterIds = Array.from(new Set(allVoters.map((v) => v.id)));
  const totalUniqueVoters = uniqueVoterIds.length;

  // Track animated values for each option progress bar
  const progressAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Sync and animate progress bars
  useEffect(() => {
    poll.options.forEach((option) => {
      // Calculate individual percentage
      const percentage = totalVotesCount > 0 ? (option.votes.length / totalVotesCount) * 100 : 0;

      if (!progressAnims[option.id]) {
        progressAnims[option.id] = new Animated.Value(0);
      }

      Animated.timing(progressAnims[option.id], {
        toValue: percentage,
        duration: 350,
        useNativeDriver: false, // We're animating layout width, useNativeDriver: false is required for layout
      }).start();
    });
  }, [poll.options, totalVotesCount]);

  // Helper: check if currentUser voted for a specific option
  const hasUserVoted = (option: PollOption) => {
    return option.votes.some((voter) => voter.id === currentUser.id);
  };

  // Helper: render custom avatar or fallback text
  const renderAvatar = (voter: Voter, size = 24) => {
    const initials = voter.initials || voter.name.substring(0, 2).toUpperCase();
    
    if (voter.avatarUrl) {
      return (
        <Image
          source={{ uri: voter.avatarUrl }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      );
    }

    // Dynamic hash-based background color for fallback initials
    const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    const colorIndex = voter.name.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <View
        style={[
          styles.avatarFallback,
          { width: size, height: size, borderRadius: size / 2, backgroundColor },
        ]}
      >
        <Text style={[styles.avatarFallbackText, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.bubbleContainer}>
      <View style={styles.pollCard}>
        {/* Creator Info Header */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>POLL</Text>
          </View>
          <Text style={styles.metaText}>
            Created by {poll.creator.name === currentUser.name ? 'You' : poll.creator.name}
          </Text>
        </View>

        {/* Poll Question */}
        <Text style={styles.questionText}>{poll.question}</Text>
        <Text style={styles.instructionText}>
          {poll.allowMultipleAnswers
            ? 'Select one or more options'
            : 'Select single option'}
        </Text>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {poll.options.map((option) => {
            const userVoted = hasUserVoted(option);
            const votesCount = option.votes.length;
            const percentage = totalVotesCount > 0 ? Math.round((votesCount / totalVotesCount) * 100) : 0;
            
            // Interpolate progress width
            const animWidth = progressAnims[option.id]
              ? progressAnims[option.id].interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              : '0%';

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionWrapper,
                  userVoted && styles.optionWrapperVoted,
                ]}
                activeOpacity={0.8}
                onPress={() => onVote(poll.id, option.id)}
              >
                {/* Simulated Animated Progress Bar Fill */}
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    userVoted ? styles.progressBarVoted : styles.progressBarDefault,
                    {
                      width: animWidth,
                    },
                  ]}
                />

                {/* Option text and selected state */}
                <View style={styles.optionContent}>
                  <View style={styles.textAndCheckRow}>
                    {userVoted && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        userVoted && styles.optionTextVoted,
                      ]}
                      numberOfLines={2}
                    >
                      {option.text}
                    </Text>
                  </View>

                  {/* Percentage & Vote Count display */}
                  <View style={styles.metricsRow}>
                    <Text
                      style={[
                        styles.percentageText,
                        userVoted && styles.percentageTextVoted,
                      ]}
                    >
                      {percentage}%
                    </Text>
                  </View>
                </View>

                {/* Voter Avatar Stack - Row below percentage */}
                {votesCount > 0 && (
                  <TouchableOpacity
                    style={styles.votersSection}
                    onPress={() => onShowVoters(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarStack}>
                      {option.votes.slice(0, 3).map((voter, index) => (
                        <View
                          key={voter.id}
                          style={[
                            styles.stackedAvatarContainer,
                            { zIndex: 10 - index, marginLeft: index === 0 ? 0 : -8 },
                          ]}
                        >
                          {renderAvatar(voter, 18)}
                        </View>
                      ))}
                      {votesCount > 3 && (
                        <View style={[styles.avatarMoreBadge, { marginLeft: -8 }]}>
                          <Text style={styles.avatarMoreText}>+{votesCount - 3}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.votersCountText}>
                      {votesCount} {votesCount === 1 ? 'vote' : 'votes'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer Summary */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {totalUniqueVoters} {totalUniqueVoters === 1 ? 'person' : 'people'} voted
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pollCard: {
    backgroundColor: '#0F172A', // Sleek dark slate
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeContainer: {
    backgroundColor: '#6366F125', // Semi-transparent Indigo
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#6366F140',
  },
  badgeText: {
    color: '#818CF8', // Bright violet
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  optionWrapper: {
    position: 'relative',
    backgroundColor: '#1E293B', // Default option track
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  optionWrapperVoted: {
    borderColor: '#6366F180', // Active glowing indigo border
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  progressBarDefault: {
    backgroundColor: '#33415560', // Darker track fill
  },
  progressBarVoted: {
    backgroundColor: '#6366F125', // Glowing indigo fill
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2, // Layer text above progress animations
  },
  textAndCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500',
    flex: 1,
  },
  optionTextVoted: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  percentageTextVoted: {
    color: '#818CF8', // Glowing indigo percentage
  },
  votersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    zIndex: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  stackedAvatarContainer: {
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    backgroundColor: '#0F172A',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarMoreBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  avatarMoreText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  votersCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
    marginTop: 6,
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
});
