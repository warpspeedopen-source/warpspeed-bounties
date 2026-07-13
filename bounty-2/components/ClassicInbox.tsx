import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { inboxStore } from '../state/inboxStore';
import { Email } from '../types';
import TopNav from './TopNav';
import CategoryBar from './CategoryBar';
import SearchBar from './SearchBar';
import EmailListItem from './EmailListItem';

const HEADER_HEIGHT = 100; // approximate combined height of CategoryBar + SearchBar

const ClassicInbox: React.FC = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const onScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true },
    ),
    [scrollY],
  );

  const handleRefresh = useCallback(() => {
    inboxStore.simulateLoad();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Email }) => <EmailListItem email={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Email) => item.id, []);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No emails</Text>
        <Text style={styles.emptySub}>
          {inboxStore.searchQuery
            ? 'Try a different search term.'
            : 'Nothing here yet.'}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Always-visible top nav */}
      <TopNav />

      {/* Scroll-hiding header group */}
      <Animated.View
        style={[styles.headerGroup, { transform: [{ translateY: headerTranslate }] }]}
      >
        <CategoryBar />
        <SearchBar />
      </Animated.View>

      {/* Email list */}
      <Animated.FlatList
        data={inboxStore.filteredEmails}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={inboxStore.isLoading}
            onRefresh={handleRefresh}
            tintColor="#1a73e8"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGroup: {
    backgroundColor: '#fff',
    zIndex: 5,
  },
  listContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default observer(ClassicInbox);
