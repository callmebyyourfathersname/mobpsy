import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useProfileStore, useProgressStore } from '../store/store';

// Default emoji if student has no profile_icon set
const DEFAULT_ICON = '🧒';

// ── PIN Pad ──────────────────────────────────────────────────────────────────
function PinPad({ pin, onChange, disabled }) {
  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const handlePress = (d) => {
    if (disabled) return;
    if (d === '⌫') { onChange(pin.slice(0, -1)); return; }
    if (d === '') return;
    if (pin.length >= 6) return;
    onChange(pin + d);
  };
  return (
    <View style={pad.wrap}>
      <View style={pad.dotsRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[
            pad.dot,
            { backgroundColor: i < pin.length ? Colors.primary : Colors.divider }
          ]} />
        ))}
      </View>
      <View style={pad.grid}>
        {DIGITS.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[pad.key, d === '' && { backgroundColor: 'transparent', elevation: 0 }]}
            onPress={() => handlePress(d)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text style={[pad.keyText, d === '⌫' && { color: Colors.error }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const pad = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%' },
  dotsRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 264, justifyContent: 'center', gap: 10 },
  key: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  keyText: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentLoginScreen({ navigation }) {
  const [step, setStep]                   = useState('pick');
  const [students, setStudents]           = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [fetchError, setFetchError]       = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pin, setPin]                     = useState('');
  const [verifying, setVerifying]         = useState(false);
  const [pinError, setPinError]           = useState('');

  const setActiveProfile = useProfileStore(s => s.setActiveProfile);
  const loadProgress     = useProgressStore(s => s.loadProgress);
  const startSession     = useProgressStore(s => s.startSession);

  // ── Fetch all students from Supabase ──────────────────────────────────────
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setFetchError(null);
    try {
      console.log('📡 Fetching students from Supabase...');
      const { data, error } = await supabase
        .from('students')
        .select('id, name, profile_icon, class_list_id');

      if (error) {
        console.error('❌ Fetch error:', JSON.stringify(error));
        setFetchError('Could not load students: ' + error.message);
        setLoadingStudents(false);
        return;
      }

      console.log('✅ Students fetched:', JSON.stringify(data));
      setStudents(data ?? []);
    } catch (e) {
      console.error('❌ Unexpected error:', e.message);
      setFetchError('Unexpected error: ' + e.message);
    }
    setLoadingStudents(false);
  };

  // ── Auto-verify when 6 digits entered ────────────────────────────────────
  useEffect(() => {
    if (pin.length === 6) verifyPin(pin);
  }, [pin]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setPin('');
    setPinError('');
    setStep('pin');
  };

  // ── Verify classroom PIN against DB ──────────────────────────────────────
  const verifyPin = async (enteredPin) => {
    setVerifying(true);
    setPinError('');
    try {
      console.log('🔑 Verifying PIN for class_list_id:', selectedStudent.class_list_id);

      const { data: classList, error } = await supabase
        .from('class_lists')
        .select('id, class_name, unified_classroom_pin')
        .eq('id', selectedStudent.class_list_id)
        .single();

      if (error || !classList) {
        console.error('❌ Class fetch error:', JSON.stringify(error));
        setPinError('Could not find classroom. Try again.');
        setPin('');
        setVerifying(false);
        return;
      }

      console.log('🏫 Class found:', classList.class_name, '| PIN in DB:', classList.unified_classroom_pin);

      if (enteredPin !== classList.unified_classroom_pin) {
        console.warn('❌ PIN mismatch. Entered:', enteredPin, '| Expected:', classList.unified_classroom_pin);
        setPinError('Wrong PIN. Please try again.');
        setPin('');
        setVerifying(false);
        return;
      }

      // ✅ PIN correct
      console.log('✅ PIN correct! Logging in as:', selectedStudent.name);
      const profile = {
        id: String(selectedStudent.id),
        name: selectedStudent.name,
        iconEmoji: selectedStudent.profile_icon ?? DEFAULT_ICON,
        iconColor: Colors.primary,
        classId: classList.id,
        className: classList.class_name,
      };

      setActiveProfile(profile);
      await loadProgress(String(selectedStudent.id));
      await startSession();
      navigation.replace('StudentArea');

    } catch (e) {
      console.error('❌ Verify error:', e.message);
      setPinError('Something went wrong. Try again.');
      setPin('');
    }
    setVerifying(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Pick student
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <LinearGradient colors={['#FFF8F0', '#EAF6FF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerArea}>
            <View style={styles.iconWrap}>
              <Text style={{ fontSize: 30 }}>🎒</Text>
            </View>
            <Text style={styles.title}>Who are you?</Text>
            <Text style={styles.subtitle}>Tap your icon to get started</Text>
          </View>

          {loadingStudents && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          )}

          {!loadingStudents && fetchError && (
            <View style={styles.center}>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={styles.errorText}>{fetchError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchStudents}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingStudents && !fetchError && students.length === 0 && (
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>🏫</Text>
              <Text style={styles.emptyText}>No students found.{'\n'}Ask your teacher to add you.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchStudents}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingStudents && !fetchError && students.length > 0 && (
            <FlatList
              data={students}
              keyExtractor={item => String(item.id)}
              numColumns={2}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.studentCard}
                  onPress={() => handleSelectStudent(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.primary + '22', Colors.primaryLight + '11']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.studentIconCircle}>
                      <Text style={{ fontSize: 36 }}>
                        {item.profile_icon && item.profile_icon.trim() !== ''
                          ? item.profile_icon
                          : DEFAULT_ICON}
                      </Text>
                    </View>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <View style={styles.tapBadge}>
                      <Text style={styles.tapBadgeText}>Tap to select</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          )}

        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Enter classroom PIN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#FFF8F0', '#EAF6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        <TouchableOpacity onPress={() => { setStep('pick'); setPin(''); setPinError(''); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Selected student preview */}
        <View style={styles.selectedPreview}>
          <View style={styles.selectedIconCircle}>
            <Text style={{ fontSize: 44 }}>
              {selectedStudent?.profile_icon && selectedStudent.profile_icon.trim() !== ''
                ? selectedStudent.profile_icon
                : DEFAULT_ICON}
            </Text>
          </View>
          <Text style={styles.selectedName}>{selectedStudent?.name}</Text>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Selected</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
        <Text style={styles.pinPrompt}>Enter Classroom PIN</Text>
        <Text style={styles.pinSubtitle}>Ask your teacher for the 6-digit PIN</Text>

        {pinError !== '' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>❌ {pinError}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />

        {verifying ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Verifying PIN...</Text>
          </View>
        ) : (
          <PinPad pin={pin} onChange={setPin} disabled={verifying} />
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  backBtn: { marginBottom: 4 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '700' },

  // Step 1
  headerArea: { alignItems: 'center', marginBottom: 20 },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.primary + '1A',
    borderWidth: 2, borderColor: Colors.primary + '33',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900', color: Colors.primaryDark },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontWeight: '600', marginTop: 8 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center', lineHeight: 22 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10, marginTop: 4,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  grid: { paddingBottom: 24 },
  studentCard: {
    flex: 1, margin: 6, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.primary + '33',
    elevation: 4, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8,
  },
  cardGradient: { padding: 20, alignItems: 'center' },
  studentIconCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: Colors.primary + '44',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    elevation: 2,
  },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  tapBadge: {
    marginTop: 8, backgroundColor: Colors.primary + '1A',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  tapBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  // Step 2
  selectedPreview: { alignItems: 'center', marginTop: 8 },
  selectedIconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary + '1A',
    borderWidth: 3, borderColor: Colors.primary + '55',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  selectedName: { fontSize: 22, fontWeight: '900', color: Colors.primaryDark },
  selectedBadge: {
    marginTop: 6, backgroundColor: Colors.success + '1A',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.success + '44',
  },
  selectedBadgeText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  pinPrompt: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  pinSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  errorBanner: {
    marginTop: 12, backgroundColor: Colors.errorLight,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.error + '44',
  },
  errorBannerText: { color: Colors.error, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});