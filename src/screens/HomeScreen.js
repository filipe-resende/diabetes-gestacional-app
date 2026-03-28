import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import { colors, fonts, getRange, calcHbA1c, calcTimeInRange } from '../theme';
import { saveReading, getReadings } from '../storage';

const MEALS = [
  { id: 'breakfast',        label: 'Café da manhã',    emoji: '☀️' },
  { id: 'morning_snack',    label: 'Lanche da manhã',  emoji: '🍎' },
  { id: 'lunch',            label: 'Almoço',           emoji: '🍛' },
  { id: 'afternoon_snack',  label: 'Lanche da tarde',  emoji: '☕' },
  { id: 'dinner',           label: 'Jantar',           emoji: '🌙' },
];

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'agora mesmo';
  if (diff < 60) return `há ${diff} min`;
  const h = Math.floor(diff / 60);
  return `há ${h} hora${h > 1 ? 's' : ''}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [time, setTime]           = useState(new Date());
  const [readings, setReadings]   = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue]     = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useFocusEffect(
    useCallback(() => { getReadings().then(setReadings); }, [])
  );

  const lastReading = readings[0] ?? null;
  const lastRange   = lastReading ? getRange(lastReading.value) : null;
  const avgGlucose  = readings.length
    ? Math.round(readings.reduce((s, r) => s + r.value, 0) / readings.length)
    : null;

  function openModal() {
    setInputValue('');
    setSelectedMeal(null);
    setModalVisible(true);
  }
  function closeModal() {
    setModalVisible(false);
    setInputValue('');
    setSelectedMeal(null);
  }

  function onPressIn() {
    Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  }
  function onPressOut() {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }

  async function handleRegister() {
    const num = parseInt(inputValue);
    if (!inputValue || isNaN(num) || num < 20 || num > 600) {
      Alert.alert('Valor inválido', 'Digite um valor entre 20 e 600 mg/dL.');
      return;
    }
    await saveReading(num, selectedMeal);
    const updated = await getReadings();
    setReadings(updated);
    closeModal();
  }

  const previewRange = inputValue && !isNaN(parseInt(inputValue))
    ? getRange(parseInt(inputValue))
    : null;

  const lastMeal = lastReading?.meal
    ? MEALS.find(m => m.id === lastReading.meal)
    : null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(173,199,255,0.2)', colors.background, 'rgba(113,215,205,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={22} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Sanctuary</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialIcons name="tune" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Last reading card */}
        {lastReading && lastRange ? (
          <GlassCard style={styles.lastCard} innerStyle={styles.lastCardInner}>
            <View style={styles.lastRow}>
              <View>
                <Text style={styles.lastLabel}>Última Leitura</Text>
                <View style={styles.valueRow}>
                  <Text style={[styles.lastValue, { color: colors.onSurface }]}>
                    {lastReading.value}
                  </Text>
                  <Text style={styles.lastUnit}>mg/dL</Text>
                </View>
                {lastMeal && (
                  <Text style={styles.lastMeal}>{lastMeal.emoji} {lastMeal.label}</Text>
                )}
              </View>
              <View style={styles.lastRight}>
                <View style={styles.statusRow}>
                  <MaterialIcons name={lastRange.icon} size={16} color={lastRange.color} />
                  <Text style={[styles.statusText, { color: lastRange.color }]}>
                    {lastRange.label}
                  </Text>
                </View>
                <Text style={styles.agoText}>{formatAgo(lastReading.date)}</Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.lastCard} innerStyle={styles.lastCardInner}>
            <Text style={styles.noReadingText}>Nenhum registro ainda</Text>
          </GlassCard>
        )}

        {/* Clock */}
        <View style={styles.clockSection}>
          <Text style={styles.clockLabel}>Hora Atual</Text>
          <Text style={styles.clock}>{formatTime(time)}</Text>
        </View>

        {/* Register button */}
        <View style={styles.btnSection}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={styles.registerBtn}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={openModal}
              activeOpacity={1}
            >
              <MaterialIcons name="add-box" size={58} color={colors.white} />
              <Text style={styles.registerBtnText}>Registrar</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.registerHint}>
            Toque para registrar seu nível de glicose
          </Text>
        </View>

        {/* Bento stats */}
        {readings.length > 0 && (
          <View style={styles.bento}>
            <GlassCard style={styles.bentoCard} innerStyle={styles.bentoInner}>
              <MaterialIcons name="show-chart" size={30} color={colors.primary} />
              <Text style={styles.bentoValue}>{calcTimeInRange(readings)}%</Text>
              <Text style={styles.bentoLabel}>Tempo na Faixa</Text>
            </GlassCard>
            <GlassCard style={styles.bentoCard} innerStyle={styles.bentoInner}>
              <MaterialIcons name="water-drop" size={30} color={colors.secondary} />
              <Text style={styles.bentoValue}>
                {avgGlucose ? calcHbA1c(avgGlucose) : '--'}
              </Text>
              <Text style={styles.bentoLabel}>HbA1c Est.</Text>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* ── Register Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrap}
        >
          {/* Overlay tap to dismiss */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

          {/* Glass card */}
          <View style={styles.modalCard}>
            {Platform.OS === 'ios' && (
              <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <View style={[styles.modalInner, Platform.OS !== 'ios' && styles.modalAndroid]}>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registrar Glicose</Text>
                <Text style={styles.modalSub}>Insira os dados atuais</Text>
              </View>

              {/* Glucose input with floating label */}
              <View style={styles.inputWrap}>
                <View style={styles.floatingLabel}>
                  <Text style={styles.floatingLabelText}>Glicemia</Text>
                </View>
                <View style={[styles.inputBox, previewRange && { borderColor: previewRange.color + '40' }]}>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="number-pad"
                    placeholder="000"
                    placeholderTextColor="rgba(0,0,0,0.15)"
                    value={inputValue}
                    onChangeText={setInputValue}
                    maxLength={3}
                    autoFocus
                  />
                  <Text style={styles.inputUnit}>mg/dL</Text>
                </View>
                {previewRange && (
                  <View style={[styles.rangePill, { backgroundColor: previewRange.bg }]}>
                    <MaterialIcons name={previewRange.icon} size={13} color={previewRange.color} />
                    <Text style={[styles.rangePillText, { color: previewRange.color }]}>
                      {previewRange.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Meal period selection */}
              <View style={styles.mealSection}>
                <Text style={styles.mealSectionLabel}>Período</Text>
                <ScrollView
                  style={styles.mealScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {MEALS.map(meal => {
                    const active = selectedMeal === meal.id;
                    return (
                      <TouchableOpacity
                        key={meal.id}
                        style={[styles.mealItem, active && styles.mealItemActive]}
                        onPress={() => setSelectedMeal(active ? null : meal.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.mealLeft}>
                          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                          <Text style={[styles.mealLabel, active && styles.mealLabelActive]}>
                            {meal.label}
                          </Text>
                        </View>
                        {active && (
                          <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {/* Scroll hint */}
                <View style={styles.scrollHint}>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.outline} />
                </View>
              </View>

              {/* Footer buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} style={styles.gradientBtnWrap}>
                  <LinearGradient
                    colors={[colors.primary, '#0070ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <MaterialIcons name="save" size={20} color={colors.white} />
                    <Text style={styles.gradientBtnText}>Registrar Glicose</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeModal} activeOpacity={0.7} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#a6b4c8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  brand: {
    fontFamily: fonts.headlineExtraBold, fontSize: 20,
    color: '#1e293b', letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#a6b4c8', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 3,
  },

  // Scroll content
  scroll: { paddingHorizontal: 20, paddingTop: 4, alignItems: 'center' },

  // Last reading card
  lastCard: { width: '100%', marginBottom: 12, borderRadius: 20 },
  lastCardInner: { padding: 20, borderRadius: 20 },
  lastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  lastValue: { fontFamily: fonts.headlineExtraBold, fontSize: 40, lineHeight: 44 },
  lastUnit: {
    fontFamily: fonts.bodySemiBold, fontSize: 13,
    color: colors.onSurfaceVariant, marginBottom: 6,
  },
  lastMeal: {
    fontFamily: fonts.bodyMedium, fontSize: 12,
    color: colors.onSurfaceVariant, marginTop: 4,
  },
  lastRight: { alignItems: 'flex-end', gap: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: {
    fontFamily: fonts.bodySemiBold, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  agoText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: '#94a3b8' },
  noReadingText: {
    fontFamily: fonts.bodyMedium, fontSize: 14,
    color: colors.onSurfaceMuted, textAlign: 'center', paddingVertical: 8,
  },

  // Clock
  clockSection: { alignItems: 'center', marginVertical: 24 },
  clockLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8,
  },
  clock: {
    fontFamily: fonts.headlineExtraBold, fontSize: 80,
    color: '#1e293b', letterSpacing: -4, lineHeight: 88,
  },

  // Register button
  btnSection: { alignItems: 'center', marginBottom: 32 },
  registerBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.primaryGlass,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: colors.primary, shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  registerBtnText: {
    fontFamily: fonts.headlineExtraBold, fontSize: 22,
    color: colors.white, letterSpacing: -0.5,
  },
  registerHint: {
    fontFamily: fonts.bodyMedium, fontSize: 13, color: '#94a3b8',
    textAlign: 'center', marginTop: 16, maxWidth: 200, lineHeight: 20,
  },

  // Bento
  bento: { flexDirection: 'row', gap: 12, width: '100%' },
  bentoCard: { flex: 1, borderRadius: 20 },
  bentoInner: { padding: 20, borderRadius: 20, gap: 6 },
  bentoValue: { fontFamily: fonts.headlineExtraBold, fontSize: 26, color: colors.onSurface },
  bentoLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Modal
  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(25,28,30,0.35)',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.14,
    shadowRadius: 48,
    elevation: 20,
  },
  modalInner: { paddingBottom: 8 },
  modalAndroid: { backgroundColor: 'rgba(247,249,251,0.97)' },

  // Modal header
  modalHeader: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 4 },
  modalTitle: {
    fontFamily: fonts.headlineExtraBold, fontSize: 22,
    color: colors.onSurface, letterSpacing: -0.4,
  },
  modalSub: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    color: colors.onSurfaceVariant, textTransform: 'uppercase',
    letterSpacing: 1.5, marginTop: 3, opacity: 0.7,
  },

  // Floating label input
  inputWrap: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 2 },
  floatingLabel: {
    position: 'absolute',
    top: 8, left: 36, zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 6, borderRadius: 4,
  },
  floatingLabelText: {
    fontFamily: fonts.bodySemiBold, fontSize: 9,
    color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(236,238,240,0.55)',
    borderRadius: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  numberInput: {
    flex: 1,
    fontFamily: fonts.headlineExtraBold,
    fontSize: 40,
    color: colors.onSurface,
    paddingVertical: 10,
    letterSpacing: -2,
  },
  inputUnit: {
    fontFamily: fonts.headlineBold, fontSize: 13,
    color: colors.outline, textTransform: 'uppercase', letterSpacing: 1,
  },
  rangePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 8,
  },
  rangePillText: {
    fontFamily: fonts.bodySemiBold, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Meal selection
  mealSection: { paddingHorizontal: 24, paddingTop: 12 },
  mealSectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    color: colors.outline, textTransform: 'uppercase',
    letterSpacing: 2.4, marginBottom: 8, paddingLeft: 2,
  },
  mealScroll: { maxHeight: 69 },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(242,244,246,0.65)',
  },
  mealItemActive: {
    backgroundColor: `rgba(0,89,187,0.08)`,
    borderWidth: 1,
    borderColor: `rgba(0,89,187,0.2)`,
  },
  mealLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealEmoji: { fontSize: 18 },
  mealLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.onSurface,
  },
  mealLabelActive: {
    fontFamily: fonts.bodySemiBold, color: colors.primary,
  },
  scrollHint: { alignItems: 'center', marginTop: 2, opacity: 0.4 },

  // Footer
  modalFooter: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 2 },
  gradientBtnWrap: { borderRadius: 50, overflow: 'hidden' },
  gradientBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 16,
  },
  gradientBtnText: {
    fontFamily: fonts.headlineBold, fontSize: 16,
    color: colors.white, letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingVertical: 12, alignItems: 'center', borderRadius: 50,
  },
  cancelBtnText: {
    fontFamily: fonts.headlineBold, fontSize: 13,
    color: colors.onSurfaceVariant,
  },
});
