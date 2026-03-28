import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { colors, fonts } from '../theme';

const INFO_ITEMS = [
  { icon: 'person', label: 'Nome', value: 'Usuário' },
  { icon: 'cake',   label: 'Idade', value: '--' },
  { icon: 'medical-services', label: 'Tipo de Diabetes', value: '--' },
  { icon: 'local-hospital', label: 'Médico', value: '--' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(173,199,255,0.25)', colors.background, 'rgba(113,215,205,0.2)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Perfil</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <MaterialIcons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={styles.userName}>Usuário</Text>
          <Text style={styles.userSub}>Controle glicêmico</Text>
        </View>

        {/* Info cards */}
        {INFO_ITEMS.map(item => (
          <GlassCard key={item.label} style={styles.infoCard} innerStyle={styles.infoInner}>
            <View style={styles.infoIcon}>
              <MaterialIcons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outlineVariant} />
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: {
    fontFamily: fonts.headlineExtraBold,
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  scroll: { paddingHorizontal: 20, gap: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a6b4c8',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  userName: {
    fontFamily: fonts.headlineExtraBold,
    fontSize: 22,
    color: colors.onSurface,
  },
  userSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#94a3b8',
  },
  infoCard: { borderRadius: 18 },
  infoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,76,203,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontFamily: fonts.headlineBold,
    fontSize: 15,
    color: colors.onSurface,
    marginTop: 2,
  },
});
