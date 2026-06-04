import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Search, Filter, Menu, User, Edit, LayoutDashboard, Layout, Inbox, Mail, Tag, Bell } from 'lucide-react-native';
import { mockEmails } from '../utils/mockData';
import { Email } from '../types';

const HEADER_HEIGHT = 160;

export const ClassicInbox = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedCategory, setSelectedCategory] = useState<'primary' | 'promotions' | 'updates'>('primary');

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const renderEmail = ({ item }: { item: Email }) => (
    <View style={[styles.emailItem, !item.isRead && styles.unreadEmailItem]}>
      <View style={styles.emailAvatar}>
        <Text style={styles.avatarText}>{item.sender.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.emailContent}>
        <View style={styles.emailHeaderRow}>
          <Text style={[styles.senderText, !item.isRead && styles.boldText]}>{item.sender}</Text>
          <Text style={[styles.dateText, !item.isRead && styles.unreadDateText]}>{item.date}</Text>
        </View>
        <Text style={[styles.subjectText, !item.isRead && styles.boldText]} numberOfLines={1}>
          {item.subject}
        </Text>
        <Text style={styles.previewText} numberOfLines={1}>
          {item.preview}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        {/* Top Navigation Row */}
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Menu color="#333" size={24} />
          </TouchableOpacity>
          <View style={styles.accountSelector}>
            <Text style={styles.accountText}>Inbox</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <User color="#333" size={24} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Layout color="#666" size={20} />
            <Text style={styles.actionText}>Flow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LayoutDashboard color="#666" size={20} />
            <Text style={styles.actionText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.activeActionButton]}>
            <Inbox color="#007AFF" size={20} />
            <Text style={[styles.actionText, styles.activeActionText]}>Classic</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#999" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emails..."
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color="#333" size={20} />
          </TouchableOpacity>
        </View>

        {/* Categories Row */}
        <View style={styles.categoriesRow}>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'primary' && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory('primary')}
          >
            <Mail color={selectedCategory === 'primary' ? '#007AFF' : '#666'} size={18} />
            <Text style={[styles.categoryText, selectedCategory === 'primary' && styles.activeCategoryText]}>
              Primary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'promotions' && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory('promotions')}
          >
            <Tag color={selectedCategory === 'promotions' ? '#007AFF' : '#666'} size={18} />
            <Text style={[styles.categoryText, selectedCategory === 'promotions' && styles.activeCategoryText]}>
              Promotions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'updates' && styles.activeCategoryButton]}
            onPress={() => setSelectedCategory('updates')}
          >
            <Bell color={selectedCategory === 'updates' ? '#007AFF' : '#666'} size={18} />
            <Text style={[styles.categoryText, selectedCategory === 'updates' && styles.activeCategoryText]}>
              Updates
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        data={mockEmails.filter(e => e.category === selectedCategory)}
        keyExtractor={(item) => item.id}
        renderItem={renderEmail}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      {/* Floating Compose Button */}
      <TouchableOpacity style={styles.fab}>
        <Edit color="#fff" size={24} />
      </TouchableOpacity>
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
    height: HEADER_HEIGHT,
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  iconButton: {
    padding: 8,
  },
  accountSelector: {
    flex: 1,
    alignItems: 'center',
  },
  accountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  activeActionButton: {
    backgroundColor: '#e6f2ff',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeActionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeCategoryButton: {
    borderBottomColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emailItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadEmailItem: {
    backgroundColor: '#f9f9f9',
  },
  emailAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emailContent: {
    flex: 1,
  },
  emailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderText: {
    fontSize: 16,
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  unreadDateText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#000',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
