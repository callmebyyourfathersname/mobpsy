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
    if (!password.trim()) return Alert.alert('Password required', 'Please enter the password.');

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      console.log('📡 Looking up user with email:', cleanEmail);

      // Step 1: Find user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', cleanEmail);

      console.log('👤 Users result:', JSON.stringify(users), 'Error:', JSON.stringify(userError));

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
      console.log('✅ User found:', JSON.stringify(user));

      if (user.role !== 'parent') {
        Alert.alert('Wrong Account', 'This email is not registered as a parent.');
        setLoading(false);
        return;
      }

      // Step 2: Find parent record
      const { data: parents, error: parentError } = await supabase
        .from('parents')
        .select('id, name')
        .eq('user_id', user.id);

      console.log('👨‍👩‍👧 Parents result:', JSON.stringify(parents), 'Error:', JSON.stringify(parentError));

      if (parentError || !parents || parents.length === 0) {
        Alert.alert('Error', 'Parent record not found. Contact your teacher.');
        setLoading(false);
        return;
      }

      const parent = parents[0];
      console.log('✅ Parent found:', JSON.stringify(parent));

      // Step 3: Find student matching parent_id AND parent_password
      const { data: studentsByParent, error: studentsError } = await supabase
        .from('students')
        .select('id, name, profile_icon, class_list_id, parent_password')
        .eq('parent_id', parent.id);

      console.log('🎒 Students for parent:', JSON.stringify(studentsByParent), 'Error:', JSON.stringify(studentsError));

      if (studentsError || !studentsByParent || studentsByParent.length === 0) {
        Alert.alert('No Students', 'No students are linked to this parent account.');
        setLoading(false);
        return;
      }

      // Match password
      const student = studentsByParent.find(s => s.parent_password === password.trim());
      console.log('🔑 Password match:', student ? student.name : 'none');

      if (!student) {
        Alert.alert('Wrong Password', 'The password is incorrect. Ask your teacher if you forgot it.');
        setLoading(false);
        return;
      }

      // Step 4: Login as that student
      console.log('✅ Logging in as student:', student.name);
      const profile = {
        id: String(student.id),
        name: student.name,
        iconEmoji: student.profile_icon && student.profile_icon.trim() !== ''
          ? student.profile_icon
          : DEFAULT_ICON,
        iconColor: Colors.secondary,
        parentName: parent.name,
      };

      setActiveProfile(profile);
      await loadProgress(String(student.id));
      await startSession();
      navigation.replace('StudentArea');

    } catch (e) {
      console.error('❌ Login error:', e.message);
      Alert.alert('Error', 'Something went wrong: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#FFF0E0']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerArea}>
          <View style={styles.iconWrap}>
            <Text style={{ fontSize: 32 }}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.title}>Parent Login</Text>
          <Text style={styles.subtitle}>Sign in to access your child's account</Text>
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
          <Text style={styles.label}>Child's Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="e.g. pass1234"
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
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
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
          <Text style={styles.hintText}>• Password: your child's account password</Text>
          <Text style={styles.hintText}>• Contact your teacher if you need help</Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 12 },
  backBtn: { marginBottom: 8 },
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
    borderWidth: 2, borderColor: Colors.divider, padding: 14,
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