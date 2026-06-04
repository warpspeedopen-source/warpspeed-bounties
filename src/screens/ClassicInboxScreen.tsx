import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';

// In a real project, these would be imported from the 'warpSpeed' design system library.
// For demonstration purposes, we are mocking them here.
const WarpSpeed = {
  View: ({ children, style }: any) => <View style={style}>{children}</View>,
  Text: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  Button: ({ title, onPress, style, textStyle }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.mockButton, style]}>
      <Text style={[styles.mockButtonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  ),
  Icon: ({ name, size = 24, color = '#333' }: any) => (
    // Simple text-based icon mock
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  ),
  SearchBar: ({ placeholder }: any) => (
    <View style={styles.mockSearchBar}>
      <WarpSpeed.Icon name="search" size={20} color="#888" />
      <Text style={styles.mockSearchBarText}>{placeholder}</Text>
    </View>
  ),
  Avatar: ({ source }: any) => (
     <View style={styles.mockAvatar} />
  ),
};

// --- Mock Data for Email List ---
type Email = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  unread: boolean;
  timestamp: string;
};

const MOCK_EMAILS: Email[] = [
  { id: '1', sender: 'GitHub', subject: 'Your pull request was approved', preview: 'Hey there, your PR #123 has been approved and merged.', unread: true, timestamp: '9:30 AM' },
  { id: '2', sender: 'Slack', subject: 'New message from John Doe', preview: 'John: Can we sync up later today?', unread: true, timestamp: '9:25 AM' },
  { id: '3', sender: 'Adobe', subject: 'Your Creative Cloud subscription is updated', preview: 'Your subscription has been successfully renewed.', unread: false, timestamp: 'Yesterday' },
  { id: '4', sender: 'warpSpeed OPEN', subject: 'Welcome to the developer bounty programme!', preview: 'We are excited to have you on board.', unread: false, timestamp: 'Yesterday' },
  { id: '5', sender: 'Figma', subject: 'New comments on your design', preview: 'Jane added a new comment to your \"Inbox UI\" frame.', unread: true, timestamp: '2 days ago' },
  { id: '6', sender: 'Vercel', subject: 'Deployment Successful', preview: 'Your project `my-app` has been deployed successfully.', unread: false, timestamp: '2 days ago' },
];

const HEADER_HEIGHT = 230; // Total height of the header section

/**
 * ClassicInboxScreen component implementing the refreshed Classic Inbox UI.
 * Features a dynamic header that hides on scroll-down and reappears on scroll-up.
 */
const ClassicInboxScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('Primary');

  // --- Animation Setup for Header --- //
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);

  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  // --- Render Functions --- //

  const renderEmailItem = ({ item }: { item: Email }) => (
    <TouchableOpacity style={styles.emailItem}>
      <WarpSpeed.Avatar />
      <View style={styles.emailContent}>
        <WarpSpeed.Text style={[styles.emailSender, item.unread && styles.unreadText]}>
          {item.sender}
        </WarpSpeed.Text>
        <WarpSpeed.Text style={[styles.emailSubject, item.unread && styles.unreadText]} numberOfLines={1}>
          {item.subject}
        </WarpSpeed.Text>
        <WarpSpeed.Text style={styles.emailPreview} numberOfLines={1}>
          {item.preview}
        </WarpSpeed.Text>
      </View>
      <WarpSpeed.Text style={styles.emailTimestamp}>{item.timestamp}</WarpSpeed.Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        {/* Top Navigation Row */}
        <WarpSpeed.View style={styles.topNav}>
          <WarpSpeed.Icon name="menu" size={28} />
          <WarpSpeed.Text style={styles.accountSelector}>Main Account</WarpSpeed.Text>
          <WarpSpeed.Avatar />
        </WarpSpeed.View>

        {/* Main Action Buttons */}
        <WarpSpeed.View style={styles.mainActions}>
          <WarpSpeed.Button title="Flow" />
          <WarpSpeed.Button title="Dashboard" />
          <WarpSpeed.Button title="Classic" textStyle={{ fontWeight: 'bold' }} />
          <WarpSpeed.Button title="Compose" />
        </WarpSpeed.View>

        {/* Search and Filter */}
        <WarpSpeed.View style={styles.searchRow}>
          <WarpSpeed.SearchBar placeholder="Search in mail" />
          <TouchableOpacity>
            <WarpSpeed.Icon name="filter-list" size={28} />
          </TouchableOpacity>
        </WarpSpeed.View>

        {/* Category Buttons */}
        <WarpSpeed.View style={styles.categoryRow}>
            {['Primary', 'Promotions', 'Updates'].map(cat => (
                <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonSelected]}>
                    <WarpSpeed.Icon name={cat} size={20} color={selectedCategory === cat ? '#FFFFFF' : '#333'} />
                    <WarpSpeed.Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>{cat}</WarpSpeed.Text>
                </TouchableOpacity>
            ))}
        </WarpSpeed.View>
      </Animated.View>

      <Animated.FlatList
        data={MOCK_EMAILS}
        renderItem={renderEmailItem}
        keyExtractor={(item) => item.id}
        style={styles.emailList}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: HEADER_HEIGHT,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountSelector: {
    fontSize: 18,
    fontWeight: '600',
  },
  mainActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  emailList: {
    flex: 1,
  },
  emailItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emailContent: {
    flex: 1,
    marginLeft: 16,
  },
  emailSender: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  emailSubject: {
    fontSize: 15,
    color: '#333333',
  },
  emailPreview: {
    fontSize: 14,
    color: '#888888',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  emailTimestamp: {
    fontSize: 12,
    color: '#999999',
  },
  // --- Mock Component Styles ---
  mockButton: {
    padding: 8,
  },
  mockButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  mockSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    marginRight: 12,
  },
  mockSearchBarText: {
    marginLeft: 8,
    color: '#888',
    fontSize: 16,
  },
  mockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CED4DA',
  },
});

export default ClassicInboxScreen;
