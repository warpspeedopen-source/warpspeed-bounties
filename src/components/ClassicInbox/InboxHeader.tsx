import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface InboxHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const InboxHeader = ({ activeCategory, onCategoryChange }: InboxHeaderProps) => {
  const categories = ['Primary', 'Promotions', 'Updates'];
  const navButtons = ['Flow', 'Dashboard', 'Classic', 'Compose'];

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.accountSelector}>
          <Text style={styles.accountText}>My Account</Text>
        </TouchableOpacity>
        <View style={styles.navButtons}>
          {navButtons.map((btn, index) => (
            <TouchableOpacity key={btn} style={[styles.navBtn, index < navButtons.length - 1 && { marginRight: 8 }]}>
              <Text style={styles.navBtnText}>{btn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search emails..." />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { marginLeft: 12 }]}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesRow}>
        {categories.map((cat, index) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryBtn, activeCategory === cat && styles.activeCategory, index < categories.length - 1 && { marginRight: 12 }]}
            onPress={() => onCategoryChange(cat)}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accountSelector: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 8 },
  accountText: { fontSize: 14, fontWeight: '600' },
  navButtons: { flexDirection: 'row' },
  navBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#E8F0FE', borderRadius: 6 },
  navBtnText: { fontSize: 13, color: '#1A73E8', fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, height: 40 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterBtn: { padding: 8 },
  filterIcon: { fontSize: 20 },
  categoriesRow: { flexDirection: 'row' },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F0F0F0' },
  activeCategory: { backgroundColor: '#1A73E8' },
  categoryText: { fontSize: 14, color: '#555' },
  activeCategoryText: { color: '#FFF', fontWeight: '600' },
});