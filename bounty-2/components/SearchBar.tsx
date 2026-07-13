import React, { useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { inboxStore } from '../state/inboxStore';

const SearchBar: React.FC = () => {
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback((text: string) => {
    inboxStore.setSearchQuery(text);
  }, []);

  const handleClear = useCallback(() => {
    inboxStore.setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search mail…"
          placeholderTextColor="#999"
          value={inboxStore.searchQuery}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search mail"
        />
        {inboxStore.searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => inboxStore.toggleSearch()}
          style={styles.filterBtn}
          accessibilityLabel="Toggle filter"
        >
          <Text style={styles.filterText}>⏷ Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#888',
  },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
});

export default observer(SearchBar);
