import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Image,
} from 'react-native';

interface Voter {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface PollOption {
  id: number;
  text: string;
  votes: string[]; // array of voter ids
}

interface PollMessageProps {
  pollId: string;
  question: string;
  options: PollOption[];
  totalParticipants: number;
  userVotes: string[]; // option ids user voted for
  multipleChoice: boolean;
  onVote: (optionId: number) => void;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  pollId,
  question,
  options,
  totalParticipants,
  userVotes,
  multipleChoice,
  onVote,
}) => {
  const [viewVotesVisible, setViewVotesVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PollOption | null>(null);

  const totalVotes = useMemo(() => {
    return options.reduce((sum, opt) => sum + opt.votes.length, 0);
  }, [options]);

  const votePercentage = (option: PollOption) => {
    if (totalParticipants === 0) return 0;
    return (option.votes.length / totalParticipants) * 100;
  };

  const hasVotedFor = (optionId: number) => {
    return userVotes.includes(optionId.toString());
  };

  const openViewVotes = (option: PollOption) => {
    setSelectedOption(option);
    setViewVotesVisible(true);
  };

  const closeViewVotes = () => {
    setViewVotesVisible(false);
    setSelectedOption(null);
  };

  const renderVoter = ({ item }: { item: Voter }) => (
    <View style={styles.voterRow}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.voterName}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      {options.map((option) => {
        const percent = votePercentage(option);
        const voted = hasVotedFor(option.id);
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionRow, voted && styles.optionVoted]}
            onPress={() => onVote(option.id)}
            disabled={voted && !multipleChoice}
            accessibilityLabel={`Vote for option ${option.text}`}
          >
            <Text style={styles.optionText}>{option.text}</Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${percent}%` }]}
              />
            </View>
            <Text style={styles.voteCount}>
              {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={() => openViewVotes(option)}
              accessibilityLabel={`View votes for option ${option.text}`}
              style={styles.viewVotesButton}
            >
              <Text style={styles.viewVotesText}>View Votes</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
      <Modal
        visible={viewVotesVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeViewVotes}
      >
        <Pressable style={styles.modalOverlay} onPress={closeViewVotes}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Voters for: {selectedOption?.text}
            </Text>
            {selectedOption ? (
              <FlatList
                data={selectedOption.votes.map((voterId) => ({
                  id: voterId,
                  name: `User ${voterId}`,
                }))}
                keyExtractor={(item) => item.id}
                renderItem={renderVoter}
                style={styles.voterList}
              />
            ) : null}
            <TouchableOpacity
              onPress={closeViewVotes}
              style={styles.closeButton}
              accessibilityLabel="Close voter list"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionRow: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  optionVoted: {
    backgroundColor: '#d0f0fd',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 6,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  voteCount: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  viewVotesButton: {
    marginTop: 6,
  },
  viewVotesText: {
    color: '#3498db',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    maxHeight: '60%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  voterList: {
    maxHeight: 300,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    color: 'white',
    fontWeight: '700',
  },
  voterName: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
});
