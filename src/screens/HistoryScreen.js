import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, LayoutAnimation, UIManager, Platform,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const PAGE_SIZE = 10; // dias por página
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import GlassCard from '../components/GlassCard';
import { colors, fonts, getRange, calcHbA1c, calcTimeInRange } from '../theme';
import { getReadings, deleteReading } from '../storage';

// ─── Report HTML ────────────────────────────────────────────────────────────

function buildReportHTML(readings) {
  const values  = readings.map(r => r.value);
  const avg     = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min     = Math.min(...values);
  const max     = Math.max(...values);
  const tir     = calcTimeInRange(readings);
  const hba1c   = calcHbA1c(avg);
  const oldest  = new Date(readings[readings.length - 1].date);
  const newest  = new Date(readings[0].date);
  const dateRange = `${oldest.toLocaleDateString('pt-BR')} – ${newest.toLocaleDateString('pt-BR')}`;
  const generated = new Date().toLocaleString('pt-BR');

  const MEAL_LABELS = {
    breakfast:       '☀️ Café da manhã',
    morning_snack:   '🍎 Lanche da manhã',
    lunch:           '🍛 Almoço',
    afternoon_snack: '☕ Lanche da tarde',
    dinner:          '🌙 Jantar',
  };

  function rangeClass(value) {
    if (value < 70)  return 'low';
    if (value < 140) return 'normal';
    if (value < 200) return 'elevated';
    return 'high';
  }
  function rangeLabel(value) {
    if (value < 70)  return 'Baixo';
    if (value < 140) return 'Normal';
    if (value < 200) return 'Elevado';
    return 'Alto';
  }

  // Group by day
  const dayMap = new Map();
  readings.forEach(r => {
    const d   = new Date(r.date);
    const key = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key).push(r);
  });

  const groupedRows = Array.from(dayMap.entries()).map(([dayLabel, dayReadings]) => {
    const rows = dayReadings.map((r, i) => {
      const d    = new Date(r.date);
      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const cls  = rangeClass(r.value);
      const meal = r.meal ? MEAL_LABELS[r.meal] : '';
      const even = i % 2 === 1 ? 'style="background:rgba(240,244,248,0.6)"' : '';
      const timeCell = meal
        ? `${time} <span style="font-size:10px;color:#94a3b8;font-weight:400;">${meal}</span>`
        : time;
      return `
        <tr ${even}>
          <td>${timeCell}</td>
          <td style="font-weight:700;font-size:15px;">${r.value}</td>
          <td><span class="badge ${cls}">${rangeLabel(r.value)}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="day-block">
        <div class="day-header">
          <span class="day-title">${dayLabel.replace(/^\w/, c => c.toUpperCase())}</span>
          <span class="day-count">${dayReadings.length} leitura${dayReadings.length !== 1 ? 's' : ''}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Valor</th>
              <th>Classificação</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, Arial, sans-serif;
    background: #f0f4f8;
    color: #191c1e;
    padding: 28px 24px 40px;
  }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #004ccb; padding-bottom: 16px; margin-bottom: 24px;
  }
  .brand { font-size: 26px; font-weight: 800; color: #004ccb; letter-spacing: -0.5px; }
  .brand-sub { font-size: 11px; color: #717786; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.8px; }
  .date-range { font-size: 12px; color: #717786; text-align: right; margin-top: 4px; }
  .stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;
  }
  .stat {
    background: white; border-radius: 14px; padding: 14px 12px;
    text-align: center; border: 1px solid #e0e3e5;
    box-shadow: 4px 4px 12px rgba(166,180,200,0.18);
  }
  .stat-val { font-size: 28px; font-weight: 800; color: #191c1e; }
  .stat-unit { font-size: 11px; color: #717786; }
  .stat-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }
  .stat.tir   .stat-val { color: #00857a; }
  .stat.hba1c .stat-val { color: #004ccb; }
  .day-block { margin-bottom: 24px; }
  .day-header {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 8px; padding: 0 2px;
  }
  .day-title {
    font-size: 13px; font-weight: 800; color: #191c1e; letter-spacing: -0.2px;
  }
  .day-count {
    font-size: 10px; color: #94a3b8; font-weight: 600;
    background: rgba(0,76,203,0.08); padding: 2px 8px;
    border-radius: 20px; color: #004ccb;
  }
  table { width: 100%; border-collapse: collapse; background: white;
    border-radius: 14px; overflow: hidden;
    box-shadow: 4px 4px 12px rgba(166,180,200,0.15);
  }
  th {
    background: #004ccb; color: white; padding: 10px 14px;
    text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px;
  }
  td { padding: 10px 14px; border-bottom: 1px solid #f0f4f8; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  }
  .low      { background: rgba(0,76,203,0.1);   color: #004ccb; }
  .normal   { background: rgba(0,133,122,0.1);  color: #00857a; }
  .elevated { background: rgba(217,119,6,0.1);  color: #d97706; }
  .high     { background: rgba(186,26,26,0.1);  color: #ba1a1a; }
  .footer {
    margin-top: 24px; text-align: center;
    font-size: 10px; color: #c1c6d7; letter-spacing: 0.3px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Sanctuary</div>
      <div class="brand-sub">Relatório Glicêmico</div>
    </div>
    <div class="date-range">
      ${dateRange}<br/>
      ${readings.length} leitura${readings.length !== 1 ? 's' : ''}
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-val">${avg}</div>
      <div class="stat-unit">mg/dL</div>
      <div class="stat-label">Média</div>
    </div>
    <div class="stat tir">
      <div class="stat-val">${tir}%</div>
      <div class="stat-unit">&nbsp;</div>
      <div class="stat-label">Tempo na Faixa</div>
    </div>
    <div class="stat hba1c">
      <div class="stat-val">${hba1c}</div>
      <div class="stat-unit">%</div>
      <div class="stat-label">HbA1c Est.</div>
    </div>
    <div class="stat">
      <div class="stat-val">${min}</div>
      <div class="stat-unit">mg/dL</div>
      <div class="stat-label">Mínimo</div>
    </div>
    <div class="stat">
      <div class="stat-val">${max}</div>
      <div class="stat-unit">mg/dL</div>
      <div class="stat-label">Máximo</div>
    </div>
    <div class="stat">
      <div class="stat-val">${max - min}</div>
      <div class="stat-unit">mg/dL</div>
      <div class="stat-label">Variação</div>
    </div>
  </div>

  ${groupedRows}

  <div class="footer">
    Gerado em ${generated} · Sanctuary — Controle Glicêmico<br/>
    <em>Este relatório é informativo. Consulte seu médico.</em>
  </div>
</body>
</html>`;
}

// ─── Grouping ────────────────────────────────────────────────────────────────

function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso) {
  const d     = new Date(iso);
  const today = new Date();
  const yest  = new Date(); yest.setDate(today.getDate() - 1);
  const isSame = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (isSame(d, today)) return 'Hoje';
  if (isSame(d, yest))  return 'Ontem';

  const diffDays = Math.floor((today - d) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString('pt-BR', { weekday: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function groupByDay(readings) {
  const map = new Map();
  readings.forEach(r => {
    const key = dayKey(r.date);
    if (!map.has(key)) map.set(key, { key, title: dayLabel(r.date), allData: [] });
    map.get(key).allData.push(r);
  });
  return Array.from(map.values());
}

function SectionHeader({ title, count, collapsed, onToggle }) {
  const rotate = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    Animated.timing(rotate, {
      toValue: collapsed ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
    onToggle();
  };

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      <View style={styles.sectionSpacer} />
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

const MEAL_MAP = {
  breakfast:       { label: 'Café da manhã',   emoji: '☀️' },
  morning_snack:   { label: 'Lanche manhã',    emoji: '🍎' },
  lunch:           { label: 'Almoço',          emoji: '🍛' },
  afternoon_snack: { label: 'Lanche tarde',    emoji: '☕' },
  dinner:          { label: 'Jantar',          emoji: '🌙' },
};

function ReadingItem({ item, onDelete }) {
  const range = getRange(item.value);
  const d    = new Date(item.date);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const meal = item.meal ? MEAL_MAP[item.meal] : null;

  return (
    <GlassCard style={styles.item} innerStyle={styles.itemInner}>
      <View style={[styles.accent, { backgroundColor: range.color }]} />
      <View style={[styles.valuePill, { backgroundColor: range.bg }]}>
        <Text style={[styles.itemVal, { color: range.color }]}>{item.value}</Text>
        <Text style={[styles.itemUnit, { color: range.color }]}>mg/dL</Text>
      </View>
      <View style={styles.itemInfo}>
        <View style={[styles.badge, { backgroundColor: range.bg }]}>
          <MaterialIcons name={range.icon} size={12} color={range.color} />
          <Text style={[styles.badgeText, { color: range.color }]}>{range.label}</Text>
        </View>
        <Text style={styles.itemDate}>{date}</Text>
        <Text style={styles.itemTime}>
          {time}{meal ? `  ${meal.emoji} ${meal.label}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Excluir', 'Remover este registro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
          ])
        }
        hitSlop={8}
        style={styles.deleteBtn}
      >
        <MaterialIcons name="close" size={16} color="#cbd5e1" />
      </TouchableOpacity>
    </GlassCard>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [readings, setReadings]     = useState([]);
  const [exporting, setExporting]   = useState(false);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [visibleDays, setVisibleDays]     = useState(PAGE_SIZE);

  useFocusEffect(
    useCallback(() => { getReadings().then(setReadings); }, [])
  );

  const allGroups = useMemo(() => groupByDay(readings), [readings]);

  // Seções visíveis (paginadas) com dados filtrados pelo colapso
  const sections = useMemo(() =>
    allGroups.slice(0, visibleDays).map(g => ({
      key:   g.key,
      title: g.title,
      total: g.allData.length,
      data:  collapsedDays.has(g.key) ? [] : g.allData,
    })),
    [allGroups, visibleDays, collapsedDays]
  );

  const hasMore = visibleDays < allGroups.length;

  function toggleDay(key) {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function loadMore() {
    if (hasMore) setVisibleDays(v => v + PAGE_SIZE);
  }

  async function handleDelete(id) {
    await deleteReading(id);
    setReadings(prev => prev.filter(r => r.id !== id));
  }

  async function handleExport() {
    if (readings.length === 0) return;
    try {
      setExporting(true);
      const html    = buildReportHTML(readings);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório',
        UTI: 'com.adobe.pdf',
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    } finally {
      setExporting(false);
    }
  }

  const ListFooter = () => {
    if (hasMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Carregando mais dias...</Text>
        </View>
      );
    }
    if (allGroups.length > 0) {
      return (
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerEnd}>fim do histórico</Text>
          <View style={styles.footerLine} />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(173,199,255,0.25)', colors.background, 'rgba(113,215,205,0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>{readings.length} registro{readings.length !== 1 ? 's' : ''}</Text>
        </View>

        {readings.length > 0 && (
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.exportBtnLoading]}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting
              ? <ActivityIndicator size="small" color={colors.white} />
              : <>
                  <MaterialIcons name="share" size={18} color={colors.white} />
                  <Text style={styles.exportBtnText}>Exportar</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      {readings.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="calendar-today" size={56} color={colors.outlineVariant} />
          <Text style={styles.emptyText}>Nenhum registro</Text>
          <Text style={styles.emptyHint}>Registre sua primeira medição na tela inicial</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ReadingItem item={item} onDelete={handleDelete} />}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              count={section.total}
              collapsed={collapsedDays.has(section.key)}
              onToggle={() => toggleDay(section.key)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooter}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryGlass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 44,
    justifyContent: 'center',
  },
  exportBtnLoading: { opacity: 0.7 },
  exportBtnText: {
    fontFamily: fonts.headlineBold,
    fontSize: 13,
    color: colors.white,
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontFamily: fonts.headlineExtraBold,
    fontSize: 15,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sectionSpacer: { flex: 1 },
  sectionBadge: {
    backgroundColor: 'rgba(0,76,203,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  sectionCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.primary,
  },
  item: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingRight: 8,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 2,
  },
  itemVal: {
    fontFamily: fonts.headlineExtraBold,
    fontSize: 28,
    lineHeight: 32,
  },
  itemUnit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    marginBottom: 2,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.onSurface,
  },
  itemTime: {
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    color: '#94a3b8',
  },
  deleteBtn: { padding: 12 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: fonts.headlineBold,
    fontSize: 18,
    color: colors.onSurface,
  },
  emptyHint: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 220,
  },
});
