import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Email = {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  category: 'Primary' | 'Promotions' | 'Updates';
  opened: boolean;
};

type Category = {
  key: 'Primary' | 'Promotions' | 'Updates';
  label: string;
  icon: React.ReactNode;
};

const categories: Category[] = [
  {
    key: 'Primary',
    label: 'Primary',
    icon: <Ionicons name="mail" size={20} color="#007aff" />,
  },
  {
    key: 'Promotions',
    label: 'Promotions',
    icon: <Ionicons name="pricetag" size={20} color="#ff9500" />,
  },
  {
    key: 'Updates',
    label: 'Updates',
    icon: <Ionicons name="notifications" size={20} color="#34c759" />,
  },
];

// Dummy email data for demonstration
const dummyEmails: Email[] = [
  {
    id: '1',
    sender: 'Alice Johnson',
    subject: 'Meeting Reminder',
    snippet: 'Don\'t forget our meeting tomorrow at 10am.',
    date: 'Jul 26',
    category: 'Primary',
    opened: false,
  },
  {
    id: '2',
    sender: 'Amazon Deals',
    subject: 'Exclusive Offer Just for You!',
    snippet: 'Save 20% on your next purchase.',
    date: 'Jul 25',
    category: 'Promotions',
    opened: true,
  },
  {
    id: '3',
    sender: 'GitHub',
    subject: 'New Features Released',
    snippet: 'Check out the latest updates on GitHub.',
    date: 'Jul 24',
    category: 'Updates',
    opened: false,
  },
  {
    id: '4',
    sender: 'Bob Smith',
    subject: 'Lunch Plans',
    snippet: 'Are you free for lunch next week?',
    date: 'Jul 23',
    category: 'Primary',
    opened: true,
  },
  {
    id: '5',
    sender: 'Newsletter',
    subject: 'Your Weekly News',
    snippet: 'Here is what\'s happening this week.',
    date: 'Jul 22',
    category: 'Updates',
    opened: true,
  },
];

const HEADER_HEIGHT = 60;

export default function ClassicInbox() {
  const [selectedCategory, setSelectedCategory] = useState<Category['key']>('Primary');
  const [searchText, setSearchText] = useState('');
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastOffsetY = useRef(0);

  useEffect(() => {
    filterEmails();
  }, [selectedCategory, searchText]);

  function filterEmails() {
    const filtered = dummyEmails.filter(
      (email) =>
        email.category === selectedCategory &&
        (email.sender.toLowerCase().includes(searchText.toLowerCase()) ||
          email.subject.toLowerCase().includes(searchText.toLowerCase()) ||
          email.snippet.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredEmails(filtered);
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > lastOffsetY.current ? 'down' : 'up';
    if (direction === 'down' && currentOffset > HEADER_HEIGHT) {
      setHeaderVisible(false);
    } else if (direction === 'up') {
      setHeaderVisible(true);
    }
    lastOffsetY.current = currentOffset;
  }

  function renderCategoryButton(category: Category) {
    const isSelected = category.key === selectedCategory;
    return (
      <TouchableOpacity
        key={category.key}
        style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
        onPress={() => setSelectedCategory(category.key)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Filter emails by ${category.label}`}
      >
        {category.icon}
        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderEmailItem({ item }: { item: Email }) {
    return (
      <TouchableOpacity
        style={[styles.emailItem, !item.opened && styles.emailItemUnread]}
        accessibilityRole="button"
        accessibilityLabel={`Email from ${item.sender}, subject: ${item.subject}, ${item.opened ? 'opened' : 'unopened'}`}
      >
        <View style={styles.emailLeft}>
          <Text style={[styles.emailSender, !item.opened && styles.emailSenderUnread]}>
            {item.sender}
          </Text>
          <Text style={[styles.emailSubject, !item.opened && styles.emailSubjectUnread]}>
            {item.subject}
          </Text>
          <Text style={styles.emailSnippet} numberOfLines={1}>
            {item.snippet}
          </Text>
        </View>
        <View style={styles.emailRight}>
          <Text style={styles.emailDate}>{item.date}</Text>
          {!item.opened && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            transform: [
              {
                translateY: headerVisible
                  ? 0
                  : -HEADER_HEIGHT,
              },
            ],
          },
        ]}
      >
        <View style={styles.topNav}>
          <Text style={styles.title}>Inbox</Text>
          <View style={styles.topNavButtons}>
            <TouchableOpacity
              style={styles.topNavButton}
              accessibilityRole="button"
              accessibilityLabel="Flow"
            >
              <Ionicons name="swap-horizontal" size={24} color="#007aff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topNavButton}
              accessibilityRole="button"
              accessibilityLabel="Dashboard"
            >
              <Ionicons name="grid" size={24} color="#007aff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topNavButton}
              accessibilityRole="button"
              accessibilityLabel="Classic"
            >
              <Ionicons name="mail" size={24} color="#007aff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topNavButton}
              accessibilityRole="button"
              accessibilityLabel="Compose"
            >
              <Ionicons name="create" size={24} color="#007aff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.categoryRow}>
          {categories.map(renderCategoryButton)}
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mail"
            value={searchText}
            onChangeText={setSearchText}
            accessibilityLabel="Search emails"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            style={styles.filterButton}
            accessibilityRole="button"
            accessibilityLabel="Filter emails"
          >
            <Ionicons name="filter" size={20} color="#007aff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <FlatList
        data={filteredEmails}
        keyExtractor={(item) => item.id}
        renderItem={renderEmailItem}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT * 3 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel="Email list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT * 3,
    backgroundColor: '#f9f9f9',
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: HEADER_HEIGHT,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
  },
  topNavButtons: {
    flexDirection: 'row',
  },
  topNavButton: {
    marginLeft: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: HEADER_HEIGHT,
    alignItems: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  categoryButtonSelected: {
    backgroundColor: '#007aff',
  },
  categoryLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  categoryLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    borderTopColor: '#ddd',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#222',
  },
  filterButton: {
    marginLeft: 12,
  },
  emailItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#fff',
  },
  emailItemUnread: {
    backgroundColor: '#e6f0ff',
  },
  emailLeft: {
    flex: 1,
  },
  emailSender: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  emailSenderUnread: {
    fontWeight: '700',
  },
  emailSubject: {
    fontSize: 14,
    color: '#555',
  },
  emailSubjectUnread: {
    fontWeight: '600',
    color: '#007aff',
  },
  emailSnippet: {
    fontSize: 12,
    color: '#888',
  },
  emailRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 60,
  },
  emailDate: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007aff',
  },
});
