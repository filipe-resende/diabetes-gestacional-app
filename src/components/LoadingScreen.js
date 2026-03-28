import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

const SPHERE_SIZE = 152;
const CORE_SIZE   = 88;

export default function LoadingScreen({
  message = 'Sincronizando...',
  sub     = 'Analisando dados metabólicos',
}) {
  const ring1Scale   = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Scale   = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;
  const floatY       = useRef(new Animated.Value(0)).current;
  const dot1Y        = useRef(new Animated.Value(0)).current;
  const dot2Y        = useRef(new Animated.Value(0)).current;
  const dot3Y        = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (scale, opacity, delay = 0) =>
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(scale,   { toValue: 1.12, duration: 2000, useNativeDriver: true }),
            Animated.timing(scale,   { toValue: 0.8,  duration: 2000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(opacity, { toValue: 0.12, duration: 2000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5,  duration: 2000, useNativeDriver: true }),
          ]),
        ])
      );

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -18, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const bounceDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -7, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0,  duration: 260, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
          Animated.delay(420),
        ])
      );

    pulse(ring1Scale, ring1Opacity, 0).start();
    pulse(ring2Scale, ring2Opacity, 1000).start();
    float.start();
    bounceDot(dot1Y, 0).start();
    bounceDot(dot2Y, 200).start();
    bounceDot(dot3Y, 400).start();
  }, []);

  const SphereContent = () => (
    <View style={styles.core}>
      <LinearGradient
        colors={['rgba(0,89,187,0.22)', 'rgba(0,106,99,0.22)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.highlight} />
      <MaterialIcons name="water-drop" size={40} color={colors.primary + 'cc'} />
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(0,89,187,0.14)', colors.background, 'rgba(142,244,233,0.18)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobBL} />
      <View style={styles.blobTR} />

      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>Sanctuary</Text>
        <View style={styles.brandLine} />
      </View>

      {/* Rings + sphere */}
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

        <Animated.View style={[styles.sphereOuter, { transform: [{ translateY: floatY }] }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={55} tint="light" style={styles.sphere}>
              <SphereContent />
            </BlurView>
          ) : (
            <View style={[styles.sphere, styles.sphereAndroid]}>
              <SphereContent />
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: floatY }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: floatY }] }]} />
        <View style={styles.orb3} />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {[[dot1Y, 1], [dot2Y, 0.3], [dot3Y, 0.1]].map(([anim, opacity], i) => (
          <Animated.View key={i} style={[styles.dot, { opacity, transform: [{ translateY: anim }] }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  blobBL: { position: 'absolute', bottom: -120, left: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: `${colors.primary}08` },
  blobTR: { position: 'absolute', top: -120, right: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: `${colors.secondary}0d` },
  brand: { position: 'absolute', top: 60, alignItems: 'center', gap: 6, opacity: 0.6 },
  brandText: { fontFamily: fonts.headlineExtraBold, fontSize: 22, color: colors.primary, letterSpacing: -0.5 },
  brandLine: { width: 32, height: 3, borderRadius: 2, backgroundColor: `${colors.primary}30` },
  ringWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  ring: { position: 'absolute', borderRadius: 999 },
  ring1: { width: 240, height: 240, backgroundColor: `${colors.primary}0d` },
  ring2: { width: 208, height: 208, backgroundColor: `${colors.secondary}0d` },
  sphereOuter: { width: SPHERE_SIZE, height: SPHERE_SIZE },
  sphere: {
    width: SPHERE_SIZE, height: SPHERE_SIZE, borderRadius: SPHERE_SIZE / 2,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14, shadowRadius: 32, elevation: 10,
  },
  sphereAndroid: { backgroundColor: 'rgba(255,255,255,0.65)' },
  core: { width: CORE_SIZE, height: CORE_SIZE, borderRadius: CORE_SIZE / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  highlight: { position: 'absolute', top: 8, left: 16, width: 40, height: 18, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 20, transform: [{ rotate: '-25deg' }] },
  orb: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  orb1: { width: 22, height: 22, top: 4, right: 12 },
  orb2: { width: 14, height: 14, bottom: 28, left: 4 },
  orb3: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: '50%', left: -24, backgroundColor: `${colors.primary}4d` },
  textBlock: { alignItems: 'center', gap: 8, marginBottom: 48 },
  title: { fontFamily: fonts.headlineSemiBold, fontSize: 19, color: colors.onSurface, letterSpacing: -0.2 },
  sub: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.outline, textTransform: 'uppercase', letterSpacing: 2.2 },
  dotsRow: { flexDirection: 'row', gap: 8, position: 'absolute', bottom: 56 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
});
