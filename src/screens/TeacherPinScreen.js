import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { useAppLockStore } from '../store/store';

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function TeacherPinScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const { verifyPin } = useAppLockStore();

  const handleDigit = (d) => {
    if (d === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (d === '') return;
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => {
        if (verifyPin(next)) {
          Alert.alert('Welcome, Teacher!', 'PIN accepted.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Wrong PIN', 'Please try again.');
          setPin('');
        }
      }, 200);
    }
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Teacher Access</Text>
        <Text style={styles.subtitle}>Enter your 6-digit PIN</Text>

        {/* PIN dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i < pin.length ? Colors.accent : Colors.divider }]} />
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {DIGITS.map((d, i) => (
            <TouchableOpacity key={i} style={styles.key} onPress={() => handleDigit(d)} activeOpacity={0.7}>
              <Text style={[styles.keyText, d === '⌫' && { color: Colors.error }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.accent, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 14, marginBottom: 40 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center', gap: 12 },
  key: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  keyText: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  backBtn: { marginTop: 32 },
  backText: { color: Colors.textSecondary, fontSize: 16 },
});
