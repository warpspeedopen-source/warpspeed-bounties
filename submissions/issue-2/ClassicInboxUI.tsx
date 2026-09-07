import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  SafeAreaView,
} from 'react-native';

export interface EmailInfo {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  time: string;
  isOpened: boolean;
}

export interface ClassicInboxUIProps {
  emails: EmailInfo[];
  onEmailPress?: (email: EmailInfo) => void;
  onComposePress?: () => void;
}

const HEADER_MAX_HEIGHT = 180;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export const ClassicInboxUI: React.FC<ClassicInboxUIProps> = ({
  emails,
  onEmailPress,
  onComposePress,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const renderEmail = ({ item }: { item: EmailInfo }) => (
    <TouchableOpacity
      style={[styles.emailRow, !item.isOpened && styles.emailRowUnopened]}
      onPress={() => onEmailPress?.(item)}
    >
      <View style={styles.emailContent}>
        <View style={styles.emailHeader}>
          <Text style={[styles.sender, !item.isOpened && styles.boldText]}>
            {item.sender}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={[styles.subject, !item.isOpened && styles.boldText]}>
          {item.subject}
        </Text>
        <Text style={styles.snippet} numberOfLines={1}>
          {item.snippet}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.accountSelector}>
            <Text style={styles.accountText}>Account</Text>
          </TouchableOpacity>
          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.navButton}><Text>Flow</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navButton}><Text>Dash</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navButton}><Text>Classic</Text></TouchableOpacity>
            <TouchableOpacity style={styles.composeButton} onPress={onComposePress}>
              <Text style={styles.composeText}>Compose</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mail..."
          />
          <TouchableOpacity style={styles.filterButton}>
            <Text>Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          <TouchableOpacity style={styles.categoryButton}>
            <Text style={styles.categoryText}>Primary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <Text style={styles.categoryText}>Promotions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <Text style={styles.categoryText}>Updates</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.FlatList
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        data={emails}
        keyExtractor={(item: EmailInfo) => item.id}
        renderItem={renderEmail}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    backgroundColor: '#f5f5f5',
    zIndex: 1,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  accountSelector: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  accountText: {
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  composeButton: {
    padding: 8,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    marginLeft: 8,
  },
  composeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  categoryButton: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  categoryText: {
    fontWeight: '500',
  },
  emailRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emailRowUnopened: {
    backgroundColor: '#f9f9f9',
  },
  emailContent: {
    flex: 1,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  subject: {
    fontSize: 14,
    marginBottom: 4,
  },
  snippet: {
    fontSize: 14,
    color: '#666',
  },
  boldText: {
    fontWeight: 'bold',
  },
});
