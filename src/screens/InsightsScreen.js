import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import { colors, fonts, getRange, calcHbA1c, calcTimeInRange } from '../theme';
import { getReadings } from '../storage';

const RANGE_COLORS = [
  { label: 'Baixo (<70)',       color: '#004ccb', key: 'low'      },
  { label: 'Normal (70–140)',   color: '#00857a', key: 'normal'   },
  { label: 'Elevado (140–200)', color: '#d97706', key: 'elevated' },
  { label: 'Alto (>200)',       color: '#ba1a1a', key: 'high'     },
];

function countRange(readings) {
  const out = { low: 0, normal: 0, elevated: 0, high: 0 };
  readings.forEach(r => {
    if (r.value < 70)       out.low++;
    else if (r.value < 140) out.normal++;
    else if (r.value < 200) out.elevated++;
    else                    out.high++;
  });
  return out;
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [readings, setReadings] = useState([]);

  useFocusEffect(
    useCallback(() => { getReadings().then(setReadings); }, [])
  );

  if (readings.length === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(173,199,255,0.25)', colors.background, 'rgba(113,215,205,0.2)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Insights</Text>
        </View>
        <View style={styles.empty}>
          <MaterialIcons name="show-chart" size={56} color={colors.outlineVariant} />
          <Text style={styles.emptyText}>Dados insuficientes</Text>
          <Text style={styles.emptyHint}>Registre medições para ver seus insights</Text>
        </View>
      </View>
    );
  }

  const values = readings.map(r => r.value);
  const avg    = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const tir    = calcTimeInRange(readings);
  const hba1c  = calcHbA1c(avg);
  const counts = countRange(readings);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(173,199,255,0.25)', colors.background, 'rgba(113,215,205,0.2)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Baseado em {readings.length} leituras</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary stats row */}
        <View style={styles.row}>
          {[
            { label: 'Média', value: avg, unit: 'mg/dL', icon: 'analytics' },
            { label: 'HbA1c Est.', value: hba1c, unit: '%', icon: 'water-drop' },
          ].map(s => {
            const range = getRange(s.label === 'Média' ? avg : avg);
            return (
              <GlassCard key={s.label} style={styles.halfCard} innerStyle={styles.halfInner}>
                <MaterialIcons name={s.icon} size={28} color={colors.primary} />
                <Text style={styles.bigVal}>{s.value}</Text>
                <Text style={styles.bigUnit}>{s.unit}</Text>
                <Text style={styles.cardLabel}>{s.label}</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Time in range */}
        <GlassCard style={styles.tirCard} innerStyle={styles.tirInner}>
          <View style={styles.tirHeader}>
            <MaterialIcons name="show-chart" size={22} color={colors.primary} />
            <Text style={styles.tirTitle}>Tempo na Faixa</Text>
          </View>
          <Text style={[styles.tirValue, { color: tir >= 70 ? colors.secondary : '#d97706' }]}>
            {tir}%
          </Text>
          <View style={styles.tirBar}>
            <View style={[styles.tirFill, { width: `${tir}%`, backgroundColor: tir >= 70 ? colors.secondary : '#d97706' }]} />
          </View>
          <Text style={styles.tirHint}>
            {tir >= 70 ? 'Excelente controle glicêmico' : 'Meta: acima de 70%'}
          </Text>
        </GlassCard>

        {/* Min/Max */}
        <View style={styles.row}>
          {[
            { label: 'Mínimo', value: min },
            { label: 'Máximo', value: max },
          ].map(s => {
            const range = getRange(s.value);
            return (
              <GlassCard key={s.label} style={styles.halfCard} innerStyle={[styles.halfInner, { backgroundColor: range.bg }]}>
                <Text style={[styles.bigVal, { color: range.color }]}>{s.value}</Text>
                <Text style={[styles.bigUnit, { color: range.color }]}>mg/dL</Text>
                <Text style={[styles.cardLabel, { color: range.color }]}>{s.label}</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* Distribution */}
        <GlassCard style={styles.distCard} innerStyle={styles.distInner}>
          <Text style={styles.distTitle}>Distribuição de Leituras</Text>
          {RANGE_COLORS.map(rc => {
            const count = counts[rc.key];
            const pct = readings.length ? Math.round((count / readings.length) * 100) : 0;
            return (
              <View key={rc.key} style={styles.distRow}>
                <Text style={styles.distLabel}>{rc.label}</Text>
                <View style={styles.distBarBg}>
                  <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: rc.color }]} />
                </View>
                <Text style={[styles.distPct, { color: rc.color }]}>{pct}%</Text>
              </View>
            );
          })}
        </GlassCard>
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
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  scroll: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1, borderRadius: 20 },
  halfInner: { padding: 20, borderRadius: 20, gap: 4, alignItems: 'flex-start' },
  bigVal: {
    fontFamily: fonts.headlineExtraBold,
    fontSize: 32,
    color: colors.onSurface,
    marginTop: 8,
  },
  bigUnit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  cardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  tirCard: { borderRadius: 20 },
  tirInner: { padding: 20, borderRadius: 20, gap: 10 },
  tirHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tirTitle: { fontFamily: fonts.headlineBold, fontSize: 16, color: colors.onSurface },
  tirValue: { fontFamily: fonts.headlineExtraBold, fontSize: 48, letterSpacing: -2 },
  tirBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tirFill: { height: '100%', borderRadius: 4 },
  tirHint: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#94a3b8' },
  distCard: { borderRadius: 20 },
  distInner: { padding: 20, borderRadius: 20, gap: 12 },
  distTitle: {
    fontFamily: fonts.headlineBold,
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: 4,
  },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distLabel: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    width: 110,
  },
  distBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: { height: '100%', borderRadius: 3 },
  distPct: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    width: 32,
    textAlign: 'right',
  },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 10, paddingBottom: 80,
  },
  emptyText: { fontFamily: fonts.headlineBold, fontSize: 18, color: colors.onSurface },
  emptyHint: {
    fontFamily: fonts.bodyRegular, fontSize: 13, color: '#94a3b8',
    textAlign: 'center', maxWidth: 220,
  },
});
