import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { InboxHeader } from '../components/ClassicInbox/InboxHeader';
import { EmailList } from '../components/ClassicInbox/EmailList';

export const ClassicInboxScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeCategory, setActiveCategory] = useState('Primary');

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -120],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <InboxHeader activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </Animated.View>
      <EmailList scrollY={scrollY} category={activeCategory} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});