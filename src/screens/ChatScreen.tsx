import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { ChatInputWithPoll } from '../components/ChatInputWithPoll';
import { PollMessage } from '../components/PollMessage';

interface Poll {
  id: string;
  question: string;
  options: {
    id: number;
    text: string;
    votes: string[]; // voter ids
  }[];
  multipleChoice: boolean;
}

interface Message {
  id: string;
  type: 'text' | 'poll';
  text?: string;
  poll?: Poll;
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId] = useState('user1'); // Simulated current user id
  const [totalParticipants] = useState(5); // Simulated total group participants

  const sendMessage = useCallback((text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'text',
      text,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const sendPoll = useCallback((pollData: {
    question: string;
    options: string[];
    multipleChoice: boolean;
  }) => {
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question: pollData.question,
      options: pollData.options.map((text, idx) => ({
        id: idx + 1,
        text,
        votes: [],
      })),
      multipleChoice: pollData.multipleChoice,
    };
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'poll',
      poll: newPoll,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const onVote = useCallback((messageId: string, optionId: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id !== messageId || msg.type !== 'poll' || !msg.poll) {
          return msg;
        }
        const poll = msg.poll;
        const userHasVoted = poll.options.some((opt) =>
          opt.votes.includes(userId)
        );
        const userVotesForOption = poll.options.filter((opt) =>
          opt.votes.includes(userId)
        ).map(opt => opt.id);

        if (!poll.multipleChoice && userHasVoted) {
          // Single choice poll: ignore if user already voted
          return msg;
        }

        let newOptions;
        if (poll.multipleChoice) {
          // Toggle vote for this option
          newOptions = poll.options.map((opt) => {
            if (opt.id === optionId) {
              const hasVoted = opt.votes.includes(userId);
              if (hasVoted) {
                return {
                  ...opt,
                  votes: opt.votes.filter((v) => v !== userId),
                };
              } else {
                return {
                  ...opt,
                  votes: [...opt.votes, userId],
                };
              }
            }
            return opt;
          });
        } else {
          // Single choice poll: add vote to selected option, remove from others
          newOptions = poll.options.map((opt) => {
            if (opt.id === optionId) {
              if (opt.votes.includes(userId)) {
                return opt; // already voted for this option
              }
              return {
                ...opt,
                votes: [...opt.votes, userId],
              };
            } else {
              return {
                ...opt,
                votes: opt.votes.filter((v) => v !== userId),
              };
            }
          });
        }

        return {
          ...msg,
          poll: {
            ...poll,
            options: newOptions,
          },
        };
      })
    );
  }, [userId]);

  const userVotesForPoll = (poll: Poll): string[] => {
    return poll.options
      .filter((opt) => opt.votes.includes(userId))
      .map((opt) => opt.id.toString());
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.type === 'text') {
      return (
        <View style={styles.textMessage}>
          <Text>{item.text}</Text>
        </View>
      );
    }
    if (item.type === 'poll' && item.poll) {
      return (
        <PollMessage
          pollId={item.poll.id}
          question={item.poll.question}
          options={item.poll.options}
          totalParticipants={totalParticipants}
          userVotes={userVotesForPoll(item.poll)}
          multipleChoice={item.poll.multipleChoice}
          onVote={(optionId) => onVote(item.id, optionId)}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContainer}
      />
      <ChatInputWithPoll onSendMessage={sendMessage} onSendPoll={sendPoll} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  textMessage: {
    backgroundColor: '#e1ffc7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
});
