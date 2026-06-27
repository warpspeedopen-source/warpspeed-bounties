import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated as RNAnimated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { TopNavigation } from './TopNavigation';
import { CategoryButtons } from './CategoryButtons';
import { SearchFilterBar } from './SearchFilterBar';
import { EmailListItem } from './EmailListItem';
import { Email, MailLabel, InboxCategory } from '../types';

interface ClassicInboxViewProps {
  emails: Email[];
  activeCategory: InboxCategory;
  activeLabel: MailLabel;
  searchQuery: string;
  isRefreshing: boolean;
  onNavChange: (navId: string) => void;
  onLabelChange: (label: MailLabel) => void;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  onEmailPress: (email: Email) => void;
  onRefresh: () => void;
}

const HEADER_VISIBLE_HEIGHT = 140; // height of header content when shown
const HEADER_HIDDEN_HEIGHT = 0;

/**
 * Classic Inbox View - main page component.
 * Features smooth scroll-based header hide/reveal behavior.
 */
export const ClassicInboxView: React.FC<ClassicInboxViewProps> = ({
  emails,
  activeCategory,
  activeLabel,
  searchQuery,
  isRefreshing,
  onNavChange,
  onLabelChange,
  onSearchChange,
  onFilterPress,
  onEmailPress,
  onRefresh,
}) => {
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isHeaderVisible = useRef(true);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -HEADER_VISIBLE_HEIGHT],
    extrapolate: 'clamp',
  });

  const handleScroll = useCallback(
    RNAnimated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const currentY = event.nativeEvent.contentOffset.y;
          const diff = currentY - lastScrollY.current;

          // Determine direction
          if (diff > 5 && currentY > 30 && isHeaderVisible.current) {
            // Scrolling down - hide header
            isHeaderVisible.current = false;
          } else if (diff < -5 && !isHeaderVisible.current) {
            // Scrolling up - show header
            isHeaderVisible.current = true;
          }

          lastScrollY.current = currentY;
        },
      }
    ),
    [scrollY]
  );

  const renderEmailItem = useCallback(
    ({ item }: { item: Email }) => (
      <EmailListItem email={item} onPress={onEmailPress} />
    ),
    [onEmailPress]
  );

  const keyExtractor = useCallback((item: Email) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <RNAnimated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <TopNavigation activeNav={activeCategory} onNavChange={onNavChange} />
        <CategoryButtons activeLabel={activeLabel} onLabelChange={onLabelChange} />
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onFilterPress={onFilterPress}
        />
      </RNAnimated.View>

      {/* Email List */}
      <FlatList
        data={emails}
        renderItem={renderEmailItem}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <RNAnimated.Text style={styles.emptyText}>
              No emails found
            </RNAnimated.Text>
          </View>
        }
      />
    </View>
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
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  listContent: {
    marginTop: HEADER_VISIBLE_HEIGHT,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default ClassicInboxView;
