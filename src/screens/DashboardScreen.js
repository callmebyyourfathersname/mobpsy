import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { allWords, byCategory } from '../data/vocabularyData';
import { useProfileStore, useProgressStore } from '../store/store';
import LensFrame from '../components/LensFrame';

const territories = [
  { name: 'Animal Kingdom', category: 'Animals',   color: Colors.mapAnimalKingdom, emoji: '🐾', screen: 'Identification' },
  { name: 'Home Territory', category: 'Furniture',  color: Colors.mapHomeTerritory, emoji: '🛋️',  screen: 'Identification' },
  { name: 'School Zone',    category: 'School',     color: Colors.mapSchoolZone,    emoji: '🎓', screen: 'Spelling' },
  { name: 'Food Valley',    category: 'Food',       color: Colors.mapFoodValley,    emoji: '🍎', screen: 'Spelling' },
  { name: 'Kitchen Cove',   category: 'Kitchen',    color: Colors.mapHomeTerritory, emoji: '🍳', screen: 'Identification' },
  { name: 'Toy Land',       category: 'Toys',       color: Colors.mapToyLand,       emoji: '🎮', screen: 'Spelling' },
];

function TerritoryCard({ territory, navigation }) {
  const getWordProgress = useProgressStore(s => s.getWordProgress);
  const wordsInCat = byCategory(territory.category);
  const discovered = wordsInCat.filter(w => getWordProgress(w.id)?.isDiscovered).length;
  const total = wordsInCat.length;
  const progressVal = total > 0 ? discovered / total : 0;
  const isComplete = discovered === total && total > 0;

  return (
    <TouchableOpacity
      style={[
        styles.territoryCard,
        {
          borderColor: isComplete ? Colors.masteryGold : territory.color + '66',
          borderWidth: isComplete ? 2.5 : 1.5,
          backgroundColor: territory.color + (Math.round(progressVal * 0.15 * 255 + 0.03 * 255)).toString(16).padStart(2, '0'),
        }
      ]}
      onPress={() => navigation.navigate(territory.screen)}
      activeOpacity={0.85}
    >
      <View style={styles.territoryTop}>
        <View style={[styles.territoryIcon, { backgroundColor: territory.color + '26' }]}>
          <Text style={{ fontSize: 18 }}>{territory.emoji}</Text>
        </View>
        <Text style={[styles.territoryCount, { color: territory.color }]}>{discovered}/{total}</Text>
      </View>
      <Text style={styles.territoryName}>{territory.name}</Text>
      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: territory.color + '1A' }]}>
        <View style={[styles.progressFill, { backgroundColor: territory.color, width: `${progressVal * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const wordsDiscovered = useProgressStore(s => s.wordsDiscovered)();
  const wordsMastered = useProgressStore(s => s.wordsMastered)();
  const currentStreak = useProgressStore(s => s.currentStreak)();
  const totalSessions = useProgressStore(s => s.progress?.totalSessions ?? 0);

  React.useEffect(() => {
    if (!activeProfile) navigation.replace('RoleSelect');
  }, [activeProfile]);

  if (!activeProfile) return null;

  return (
    <LinearGradient colors={['#FFF8F0', '#F0E6FF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <LensFrame size={48} borderColor={activeProfile.iconColor} borderWidth={2.5}>
              <View style={[styles.avatarInner, { backgroundColor: activeProfile.iconColor + '33' }]}>
                <Text style={{ fontSize: 22 }}>{activeProfile.iconEmoji}</Text>
              </View>
            </LensFrame>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.greeting}>Hi, {activeProfile.name}!</Text>
              <View style={styles.hudLabel}>
                <Text style={styles.hudLabelText}>Explorer Active</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {currentStreak}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsBar}>
            {[
              { emoji: '🔍', label: 'Found', value: `${wordsDiscovered}/${allWords.length}`, color: Colors.primary },
              { emoji: '🏆', label: 'Mastered', value: `${wordsMastered}`, color: Colors.masteryGold },
              { emoji: '🎯', label: 'Sessions', value: `${totalSessions}`, color: Colors.accent },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* World Map */}
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>🗺️  Explorer World Map</Text>
          </View>

          <View style={styles.mapGrid}>
            {territories.map((t, i) => (
              <View key={i} style={styles.mapCell}>
                <TerritoryCard territory={t} navigation={navigation} />
              </View>
            ))}
          </View>

          {/* Dotted connectors */}
          <View style={styles.dots}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.primary + '1A', borderColor: Colors.primary + '33' }]}
              onPress={() => navigation.navigate('Scan')}>
              <Text style={{ fontSize: 20 }}>📷</Text>
              <Text style={[styles.quickLabel, { color: Colors.primary }]}>Quick Scan</Text>
            </TouchableOpacity>
            <View style={{ width: 12 }} />
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.accent + '1A', borderColor: Colors.accent + '33' }]}
              onPress={() => navigation.navigate('Gallery')}>
              <Text style={{ fontSize: 20 }}>📖</Text>
              <Text style={[styles.quickLabel, { color: Colors.accent }]}>My Journal</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  hudLabel: { backgroundColor: Colors.hudGreen + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 2 },
  hudLabelText: { color: Colors.hudGreen, fontSize: 11, fontWeight: '700' },
  streakBadge: { backgroundColor: Colors.hudBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.hudGreen + '4D' },
  streakText: { color: Colors.hudGreen, fontWeight: '800', fontSize: 16 },
  statsBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.hudBorder + '26' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.divider },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  mapHeader: { marginBottom: 12 },
  mapTitle: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 8 },
  mapCell: { width: '50%', padding: 6 },
  territoryCard: { borderRadius: 18, padding: 12, height: 110, justifyContent: 'space-between' },
  territoryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  territoryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  territoryCount: { fontSize: 12, fontWeight: '700' },
  territoryName: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  progressBg: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4, gap: 6, marginBottom: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.divider + '99' },
  quickRow: { flexDirection: 'row', marginTop: 4 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  quickLabel: { fontWeight: '700', fontSize: 15 },
});
