/**
 * PollVotesBottomSheet Component
 * Bottom sheet displaying detailed voting insights per option
 * Bounty #3: Messenger Group Chat Poll Creation and Voting UI
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import { Poll, PollVoter, PollResults, VoteSheetTab } from '../types';
import { RESULT_BAR_COLORS } from '../constants';

interface PollVotesBottomSheetProps {
  visible: boolean;
  results: PollResults;
  onClose: () => void;
}

interface VoterItemProps {
  voter: PollVoter;
  optionColor: string;
}

const VoterItem: React.FC<VoterItemProps> = ({ voter, optionColor }) => (
  <View style={styles.voterRow}>
    {voter.avatarUri ? (
      <Image source={{ uri: voter.avatarUri }} style={styles.avatar} />
    ) : (
      <View style={[styles.avatarFallback, { backgroundColor: optionColor }]}>
        <Text style={styles.avatarInitial}>
          {voter.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
    )}
    <Text style={styles.voterName} numberOfLines={1}>
      {voter.displayName}
    </Text>
  </View>
);

export const PollVotesBottomSheet: React.FC<PollVotesBottomSheetProps> = ({
  visible,
  results,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<VoteSheetTab>('all');

  const displayVoters = useMemo(() => {
    if (activeTab === 'all') {
      // Show all unique voters across all options
      const seen = new Set<string>();
      const allVoters: { voter: PollVoter; optionIndex: number }[] = [];
      results.optionResults.forEach((result, idx) => {
        result.voters.forEach((voter) => {
          if (!seen.has(voter.userId)) {
            seen.add(voter.userId);
            allVoters.push({ voter, optionIndex: idx });
          }
        });
      });
      return allVoters;
    }

    // Show voters for a specific option
    const optionResult = results.optionResults.find(
      (r) => r.option.id === activeTab
    );
    if (!optionResult) return [];
    return optionResult.voters.map((voter) => ({
      voter,
      optionIndex: results.optionResults.indexOf(optionResult),
    }));
  }, [activeTab, results]);

  const renderTab = useCallback(
    (label: string, tabId: VoteSheetTab, count: number) => {
      const isActive = activeTab === tabId;
      return (
        <TouchableOpacity
          key={tabId}
          onPress={() => setActiveTab(tabId)}
          style={[styles.tab, isActive && styles.tabActive]}
        >
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {label} ({count})
          </Text>
        </TouchableOpacity>
      );
    },
    [activeTab]
  );

  const totalVoters = useMemo(() => {
    const seen = new Set<string>();
    results.optionResults.forEach((r) => {
      r.voters.forEach((v) => seen.add(v.userId));
    });
    return seen.size;
  }, [results]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Votes</Text>
            <Text style={styles.totalCount}>
              {totalVoters} {totalVoters === 1 ? 'vote' : 'votes'}
            </Text>
          </View>

          {/* Question */}
          <Text style={styles.question} numberOfLines={2}>
            {results.poll.question}
          </Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {renderTab('All', 'all', totalVoters)}
            {results.optionResults.map((result, idx) =>
              renderTab(
                result.option.text.length > 15
                  ? result.option.text.substring(0, 15) + '...'
                  : result.option.text,
                result.option.id,
                result.voteCount
              )
            )}
          </View>

          {/* Voter list */}
          <FlatList
            data={displayVoters}
            keyExtractor={(item) => `${item.voter.userId}-${activeTab}`}
            renderItem={({ item }) => (
              <VoterItem
                voter={item.voter}
                optionColor={RESULT_BAR_COLORS[item.optionIndex % RESULT_BAR_COLORS.length]}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No votes yet</Text>
              </View>
            }
          />

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalCount: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  question: {
    fontSize: 15,
    color: '#555555',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: {
    backgroundColor: '#4285F4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  voterName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '400',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#AAAAAA',
  },
  closeButton: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
