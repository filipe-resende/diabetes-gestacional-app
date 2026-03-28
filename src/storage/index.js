import AsyncStorage from '@react-native-async-storage/async-storage';

const READINGS_KEY = '@gluco_readings';

export async function saveReading(value, meal = null) {
  const existing = await getReadings();
  const newReading = {
    id: Date.now().toString(),
    value: Number(value),
    meal,
    date: new Date().toISOString(),
  };
  const updated = [newReading, ...existing];
  await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(updated));
  return newReading;
}

export async function getReadings() {
  const data = await AsyncStorage.getItem(READINGS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deleteReading(id) {
  const existing = await getReadings();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(updated));
}
