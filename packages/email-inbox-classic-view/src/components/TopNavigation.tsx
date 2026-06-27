import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NAV_BUTTONS } from '../types';

interface TopNavigationProps {
  activeNav: string;
  onNavChange: (navId: string) => void;
  accountName?: string;
  onAccountPress?: () => void;
}

/**
 * New top navigation row with account selector and navigation buttons.
 */
export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeNav,
  onNavChange,
  accountName = 'Account',
  onAccountPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Account Selector */}
      <TouchableOpacity style={styles.accountButton} onPress={onAccountPress}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{accountName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{accountName}</Text>
          <Text style={styles.chevron}>▾</Text>
        </View>
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        {NAV_BUTTONS.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[styles.navButton, activeNav === button.id && styles.navButtonActive]}
            onPress={() => onNavChange(button.id)}
          >
            <Text
              style={[
                styles.navIcon,
                activeNav === button.id && styles.navIconActive,
              ]}
            >
              {button.icon === 'flow' && '⚡'}
              {button.icon === 'dashboard' && '📊'}
              {button.icon === 'classic' && '📧'}
              {button.icon === 'compose' && '✏️'}
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeNav === button.id && styles.navLabelActive,
              ]}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 4,
  },
  chevron: {
    fontSize: 12,
    color: '#8E8E93',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navButtonActive: {
    backgroundColor: '#007AFF15',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default TopNavigation;
