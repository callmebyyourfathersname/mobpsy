import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useProfileStore, useProgressStore } from '../store/store';

const DEFAULT_ICON = '🧒';

// Simple text-based eye icon component — no emoji, no external library
function EyeIcon({ visible }) {
  return visible ? (
    // "eye open" — circle with pupil
    <View style={eye.wrap}>
      <View style={eye.oval}>
        <View style={eye.pupil} />
      </View>
    </View>
  ) : (
    // "eye closed" — arc with slash
    <View style={eye.wrap}>
      <View style={eye.ovalClosed} />
      <View style={eye.slash} />
    </View>
  );
}

const eye = StyleSheet.create({
  wrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  oval: {
    width: 20, height: 13, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  pupil: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },
  ovalClosed: {
    position: 'absolute',
    width: 20, height: 13, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.textSecondary,
  },
  slash: {
    position: 'absolute',
    width: 2, height: 22,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});

export default function ParentLoginScreen({ navigation }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setActiveProfile = useProfileStore(s => s.setActiveProfile);
  const loadProgress     = useProgressStore(s => s.loadProgress);
  const startSession     = useProgressStore(s => s.startSession);

  const handleLogin = async () => {
    if (!email.trim())    return Alert.alert('Email required', 'Please enter your email.');
    if (!password.trim()) return Alert.alert('Password required', 'Please enter your password.');

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Step 1: Find user by email + password
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, role, password')
        .eq('email', cleanEmail);

      if (userError) {
        Alert.alert('Error', 'Database error: ' + userError.message);
        setLoading(false);
        return;
      }

      if (!users || users.length === 0) {
        Alert.alert('Not Found', 'No account found with that email address.');
        setLoading(false);
        return;
      }

      const user = users[0];

      if (user.role !== 'parent') {
        Alert.alert('Wrong Account', 'This email is not registered as a parent.');
        setLoading(false);
        return;
      }

      // Verify parent's own password
      if (user.password !== password.trim()) {
        Alert.alert('Wrong Password', 'The password is incorrect.');
        setLoading(false);
        return;
      }

      // Step 2: Find parent record
      const { data: parents, error: parentError } = await supabase
        .from('parents')
        .select('id, name')
        .eq('user_id', user.id);

      if (parentError || !parents || parents.length === 0) {
        Alert.alert('Error', 'Parent record not found. Contact your teacher.');
        setLoading(false);
        return;
      }

      const parent = parents[0];

      // Step 3: Find linked students
      const { data: studentList, error: studentsError } = await supabase
        .from('students')
        .select('id, name, profile_icon, class_list_id')
        .eq('parent_id', parent.id);

      if (studentsError || !studentList || studentList.length === 0) {
        Alert.alert('No Students', 'No students are linked to this parent account.');
        setLoading(false);
        return;
      }

      // Use the first student for progress loading; full list passed to dashboard
      const student = studentList[0];

      const profile = {
        id: String(student.id),
        name: student.name,
        iconEmoji: student.profile_icon && student.profile_icon.trim() !== ''
          ? student.profile_icon
          : DEFAULT_ICON,
        iconColor: Colors.secondary,
        parentId: String(parent.id),
        parentName: parent.name,
        isParent: true,
        studentList: studentList.map(s => ({
          id: String(s.id),
          name: s.name,
          iconEmoji: s.profile_icon && s.profile_icon.trim() !== '' ? s.profile_icon : DEFAULT_ICON,
        })),
      };

      setActiveProfile(profile);
      await loadProgress(String(student.id));
      await startSession();
      navigation.replace('ParentArea');

    } catch (e) {
      Alert.alert('Error', 'Something went wrong: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#FFF0E0']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerArea}>
          <View style={styles.iconWrap}>
            <Text style={{ fontSize: 32 }}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.title}>Parent Login</Text>
          <Text style={styles.subtitle}>Sign in to monitor your child's progress</Text>
        </View>

        {/* Email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="parent@email.com"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Your Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <EyeIcon visible={showPassword} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.secondary, Colors.secondaryDark]}
            style={styles.loginBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In →</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>How to log in:</Text>
          <Text style={styles.hintText}>• Email: your registered parent email</Text>
          <Text style={styles.hintText}>• Password: your own account password</Text>
          <Text style={styles.hintText}>• Contact your teacher if you need help</Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 28 },
  topBar: {
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 52,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: { fontSize: 16, color: Colors.secondary, fontWeight: '700' },
  headerArea: { alignItems: 'center', marginBottom: 28 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.secondary + '1A',
    borderWidth: 2, borderColor: Colors.secondary + '44',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '900', color: Colors.secondaryDark },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderRadius: 14, borderWidth: 2, borderColor: Colors.divider,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.textPrimary, backgroundColor: '#fff',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 2, borderColor: Colors.divider,
    padding: 14, alignItems: 'center', justifyContent: 'center',
    width: 52, height: 52,
  },
  loginBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  hintBox: {
    backgroundColor: Colors.secondary + '0D',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.secondary + '33',
  },
  hintTitle: { fontSize: 13, fontWeight: '800', color: Colors.secondaryDark, marginBottom: 6 },
  hintText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },
});