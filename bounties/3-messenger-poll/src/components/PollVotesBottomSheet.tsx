import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Easing,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { PollOption, Voter } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PollVotesBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  option: PollOption | null;
}

export const PollVotesBottomSheet: React.FC<PollVotesBottomSheetProps> = ({
  visible,
  onClose,
  option,
}) => {
  // Animated values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 45,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Helper: render voter avatar or fallback text
  const renderVoterAvatar = (voter: Voter, size = 36) => {
    const initials = voter.initials || voter.name.substring(0, 2).toUpperCase();
    
    if (voter.avatarUrl) {
      return (
        <Image
          source={{ uri: voter.avatarUrl }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      );
    }

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
        <Text style={[styles.avatarFallbackText, { fontSize: size * 0.38 }]}>
          {initials}
        </Text>
      </View>
    );
  };

  // Render individual voter item
  const renderItem = ({ item }: { item: Voter }) => (
    <View style={styles.voterItem}>
      {renderVoterAvatar(item)}
      <View style={styles.voterDetails}>
        <Text style={styles.voterName}>{item.name}</Text>
        <Text style={styles.voterRole}>Member</Text>
      </View>
      <View style={styles.voteCheck}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacityAnim,
            },
          ]}
        >
          <Pressable style={styles.backdropPressable} onPress={handleDismiss} />
        </Animated.View>

        {/* Dynamic Sheet Content */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top grab line */}
          <View style={styles.handleContainer}>
            <View style={styles.grabHandle} />
          </View>

          {/* Heading info */}
          <View style={styles.header}>
            <View style={styles.titleWrapper}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Voter Details
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {option ? `"${option.text}"` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* List of Voters */}
          <FlatList
            data={option?.votes || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No votes recorded yet.</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 18, 0.75)',
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#0F172A', // Sleek dark slate
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '65%',
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 24,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#38BDF8', // Cyan subtitle
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  voterDetails: {
    flex: 1,
    marginLeft: 14,
  },
  voterName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  voterRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
  voteCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  checkIcon: {
    color: '#10B981', // Clean green check
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
