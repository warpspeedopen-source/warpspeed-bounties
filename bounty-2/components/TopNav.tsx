import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { inboxStore } from '../state/inboxStore';
import { NavigationRoute } from '../types';

const ROUTES: NavigationRoute[] = ['flow', 'dashboard', 'classic', 'compose'];
const ROUTE_LABELS: Record<NavigationRoute, string> = {
  flow: 'Flow',
  dashboard: 'Dashboard',
  classic: 'Classic',
  compose: 'Compose',
};

const TopNav: React.FC = () => {
  const [showAccounts, setShowAccounts] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Left: account selector */}
      <TouchableOpacity
        style={styles.accountBtn}
        onPress={() => setShowAccounts(true)}
        accessibilityLabel="Switch account"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {inboxStore.selectedAccount.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.accountName} numberOfLines={1}>
          {inboxStore.selectedAccount.displayName}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {/* Right: nav buttons */}
      <View style={styles.navRow}>
        {ROUTES.map((route) => {
          const active = inboxStore.activeRoute === route;
          return (
            <TouchableOpacity
              key={route}
              style={[styles.navBtn, active && styles.navBtnActive]}
              onPress={() => inboxStore.setRoute(route)}
              accessibilityLabel={ROUTE_LABELS[route]}
            >
              <Text
                style={[styles.navLabel, active && styles.navLabelActive]}
              >
                {ROUTE_LABELS[route]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account switcher modal */}
      <Modal
        visible={showAccounts}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccounts(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowAccounts(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Switch Account</Text>
            <FlatList
              data={inboxStore.accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.accountRow,
                    item.id === inboxStore.selectedAccountId &&
                      styles.accountRowActive,
                  ]}
                  onPress={() => {
                    inboxStore.setAccount(item.id);
                    setShowAccounts(false);
                  }}
                >
                  <Text style={styles.accountRowText}>{item.displayName}</Text>
                  <Text style={styles.accountRowEmail}>{item.email}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
    zIndex: 10,
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 160,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    maxWidth: 100,
  },
  chevron: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  navRow: {
    flexDirection: 'row',
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 4,
  },
  navBtnActive: {
    backgroundColor: '#e8f0fe',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  navLabelActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  accountRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  accountRowActive: {
    backgroundColor: '#e8f0fe',
  },
  accountRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  accountRowEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});

export default observer(TopNav);
