import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { inboxStore } from '../state/inboxStore';
import { Category } from '../types';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'updates', label: 'Updates' },
];

const CategoryBar: React.FC = () => {
  return (
    <View style={styles.container}>
      {CATEGORIES.map((cat) => {
        const active = inboxStore.selectedCategory === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => inboxStore.setCategory(cat.key)}
            accessibilityLabel={cat.label}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {cat.label}
            </Text>
            {active && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabActive: {},
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  labelActive: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 40,
    backgroundColor: '#1a73e8',
    borderRadius: 1.5,
  },
});

export default observer(CategoryBar);
