export const colors = {
  primary: '#004ccb',
  primaryGlass: 'rgba(0, 76, 203, 0.80)',
  secondary: '#00857a',
  tertiary: '#006481',
  error: '#ba1a1a',
  background: '#f0f4f8',
  onSurface: '#191c1e',
  onSurfaceVariant: '#414754',
  onSurfaceMuted: '#8a8fa6',
  outline: '#717786',
  outlineVariant: '#c1c6d7',
  white: '#ffffff',
};

export const fonts = {
  headlineRegular: 'Manrope_400Regular',
  headlineSemiBold: 'Manrope_600SemiBold',
  headlineBold: 'Manrope_700Bold',
  headlineExtraBold: 'Manrope_800ExtraBold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

const glucoseRanges = {
  low:      { label: 'Baixo',   color: '#004ccb', bg: 'rgba(0,76,203,0.12)',    icon: 'arrow-downward' },
  normal:   { label: 'Normal',  color: '#00857a', bg: 'rgba(0,133,122,0.12)',   icon: 'verified' },
  elevated: { label: 'Elevado', color: '#d97706', bg: 'rgba(217,119,6,0.12)',   icon: 'arrow-upward' },
  high:     { label: 'Alto',    color: '#ba1a1a', bg: 'rgba(186,26,26,0.12)',   icon: 'warning' },
};

export function getRange(value) {
  if (value < 70)  return glucoseRanges.low;
  if (value < 140) return glucoseRanges.normal;
  if (value < 200) return glucoseRanges.elevated;
  return glucoseRanges.high;
}

export function calcHbA1c(avgGlucose) {
  return ((avgGlucose + 46.7) / 28.7).toFixed(1);
}

export function calcTimeInRange(readings) {
  if (!readings.length) return 0;
  const inRange = readings.filter(r => r.value >= 70 && r.value <= 140).length;
  return Math.round((inRange / readings.length) * 100);
}
