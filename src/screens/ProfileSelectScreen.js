import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { AppConstants } from '../data/constants';
import { useProfileStore } from '../store/store';

export default function ProfileSelectScreen({ navigation }) {
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [name, setName] = useState('');
  const { profiles, createProfile, setActiveProfile, loadProfiles } = useProfileStore();

  React.useEffect(() => { loadProfiles(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter your name!');
    if (!selectedIcon) return Alert.alert('Pick an avatar', 'Please pick your avatar!');
    const icon = AppConstants.profileIcons[selectedIcon];
    const profile = await createProfile({ name: name.trim(), iconEmoji: icon.emoji, iconColor: icon.color });
    setActiveProfile(profile);
    navigation.replace('StudentArea');
  };

  const handleSelectExisting = (profile) => {
    setActiveProfile(profile);
    navigation.replace('StudentArea');
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Who's playing?</Text>

          {/* Existing profiles */}
          {profiles.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Continue as…</Text>
              <View style={styles.profileRow}>
                {profiles.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.profileChip, { borderColor: p.iconColor }]} onPress={() => handleSelectExisting(p)}>
                    <Text style={styles.profileEmoji}>{p.iconEmoji}</Text>
                    <Text style={[styles.profileName, { color: p.iconColor }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Or create new…</Text>
            </>
          )}

          {/* Avatar grid */}
          <View style={styles.avatarGrid}>
            {AppConstants.profileIcons.map((icon, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.avatarCell,
                  selectedIcon === i && { borderColor: icon.color, backgroundColor: icon.color + '22' },
                ]}
                onPress={() => setSelectedIcon(i)}
              >
                <Text style={styles.avatarEmoji}>{icon.emoji}</Text>
                <Text style={[styles.avatarLabel, selectedIcon === i && { color: icon.color }]}>{icon.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name input */}
          <TextInput
            style={styles.input}
            placeholder="Enter your name..."
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={20}
          />

          <TouchableOpacity onPress={handleCreate} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Exploring! 🔍</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: Colors.primaryDark, marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, alignSelf: 'flex-start', marginBottom: 10 },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 2, backgroundColor: '#fff',
  },
  profileEmoji: { fontSize: 20 },
  profileName: { fontWeight: '700', fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.divider, alignSelf: 'stretch', marginVertical: 16 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  avatarCell: {
    width: 72, alignItems: 'center', padding: 8, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.divider, backgroundColor: Colors.surface,
  },
  avatarEmoji: { fontSize: 28 },
  avatarLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  input: {
    width: '100%', borderRadius: 14, borderWidth: 2, borderColor: Colors.divider,
    padding: 14, fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  startBtn: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
