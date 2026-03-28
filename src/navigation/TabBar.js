import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

const TABS = [
  { name: 'Home',     icon: 'grid-view' },
  { name: 'History',  icon: 'calendar-today' },
  { name: 'Insights', icon: 'show-chart' },
  { name: 'Profile',  icon: 'account-circle' },
];

export default function GlassTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
            style={styles.tabBtn}
          >
            <View style={isFocused ? styles.activeItem : styles.inactiveItem}>
              <MaterialIcons
                name={tab.icon}
                size={isFocused ? 26 : 24}
                color={isFocused ? colors.white : '#94a3b8'}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.wrapper}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.topBorder} />
        {content}
      </View>
    );
  }
  return (
    <View style={[styles.wrapper, styles.androidWrapper]}>
      <View style={styles.topBorder} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#a6b4c8',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
  },
  androidWrapper: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    zIndex: 1,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 24,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  activeItem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryGlass,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  inactiveItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
