import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ children, style, innerStyle, intensity = 50 }) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.shadow, style]}>
        <BlurView intensity={intensity} tint="light" style={styles.blur}>
          <View style={[styles.overlay, innerStyle]}>{children}</View>
        </BlurView>
      </View>
    );
  }
  return (
    <View style={[styles.shadow, styles.androidCard, style, innerStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    shadowColor: '#a6b4c8',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  androidCard: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
});
