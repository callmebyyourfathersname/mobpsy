import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import LensFrame from '../components/LensFrame';

function RoleCard({ emoji, title, subtitle, colors, onPress, isComingSoon, flex = 1 }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex }} activeOpacity={0.85}>
      <LinearGradient colors={colors} style={styles.card}>
        {/* Background circle decoration */}
        <View style={styles.bgCircle} />
        <View style={styles.cardContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </View>
          <View style={{ height: 8 }} />
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {isComingSoon && (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Soon</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function RoleSelectScreen({ navigation }) {
  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Logo */}
        <LensFrame size={60} borderColor={Colors.primary} borderWidth={2.5}>
          <View style={[styles.logoInner, { backgroundColor: Colors.primaryLight + '4D' }]}>
            <Text style={{ fontSize: 28 }}>🔍</Text>
          </View>
        </LensFrame>

        <View style={{ height: 14 }} />

        <Text style={styles.welcomeText}>Welcome to iSpy World!</Text>
        <Text style={styles.questionText}>Who are you?</Text>

        <View style={{ height: 32 }} />

        {/* Student — big card */}
        <RoleCard
          emoji="🎒"
          title="I'm a Student"
          subtitle="Start exploring!"
          colors={[Colors.primary, Colors.primaryDark]}
          onPress={() => navigation.navigate('ProfileSelect')}
          flex={3}
        />

        <View style={{ height: 14 }} />

        {/* Teacher + Parent */}
        <View style={styles.row}>
          <RoleCard
            emoji="🎓"
            title="Teacher"
            subtitle="Manage sessions"
            colors={[Colors.accent, '#5B1F99']}
            onPress={() => navigation.navigate('TeacherPin')}
          />
          <View style={{ width: 14 }} />
          <RoleCard
            emoji="👨‍👩‍👧"
            title="Parent"
            subtitle="Coming soon"
            colors={[Colors.secondary, Colors.secondaryDark]}
            onPress={() => {}}
            isComingSoon
          />
        </View>

        <View style={{ height: 16 }} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  logoInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeText: { fontSize: 24, fontWeight: '800', color: Colors.primaryDark, textAlign: 'center' },
  questionText: { fontSize: 16, color: Colors.textSecondary, marginTop: 6 },
  row: { flexDirection: 'row', flex: 2 },
  card: {
    flex: 1, borderRadius: 22, padding: 16, alignSelf: 'stretch',
    elevation: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute', right: -20, top: -20,
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },
  soonBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
