import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useProfileStore } from '../store/store';
import { allWords } from '../data/vocabularyData';

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatChip({ emoji, label, value, color }) {
  return (
    <View style={[chip.wrap, { borderColor: color + '33' }]}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={[chip.value, { color }]}>{value}</Text>
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1.5, gap: 2,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  value: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
});

function SectionCard({ title, icon, children, onPress, actionLabel }) {
  return (
    <View style={sc.card}>
      <View style={sc.header}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={sc.title}>{title}</Text>
        <View style={{ flex: 1 }} />
        {onPress && (
          <TouchableOpacity onPress={onPress} style={sc.actionBtn}>
            <Text style={sc.actionText}>{actionLabel ?? 'See All'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.divider,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  actionBtn: { backgroundColor: Colors.secondary + '1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: '700', color: Colors.secondaryDark },
});

// ── Category progress row ─────────────────────────────────────────────────────
const CATEGORIES = ['Animals', 'Furniture', 'School', 'Food', 'Kitchen', 'Toys'];
const CAT_EMOJI  = { Animals: '🐾', Furniture: '🛋️', School: '🎓', Food: '🍎', Kitchen: '🍳', Toys: '🎮' };
const CAT_COLOR  = {
  Animals: Colors.mapAnimalKingdom, Furniture: Colors.mapHomeTerritory,
  School: Colors.mapSchoolZone, Food: Colors.mapFoodValley,
  Kitchen: Colors.mapHomeTerritory, Toys: Colors.mapToyLand,
};

function CategoryRow({ category, masteryScores }) {
  const wordsInCat = allWords.filter(w => w.category === category);
  const scoresInCat = masteryScores.filter(ms => {
    const word = allWords.find(w => w.id === String(ms.vocabulary_id));
    return word?.category === category;
  });
  const mastered = scoresInCat.filter(ms => ms.proficiency_level === 'mastered').length;
  const attempted = scoresInCat.length;
  const total = wordsInCat.length;
  const progress = total > 0 ? attempted / total : 0;
  const color = CAT_COLOR[category] ?? Colors.primary;

  return (
    <View style={cr.row}>
      <Text style={{ fontSize: 16, width: 24 }}>{CAT_EMOJI[category]}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <View style={cr.labelRow}>
          <Text style={cr.catName}>{category}</Text>
          <Text style={[cr.count, { color }]}>{attempted}/{total}</Text>
        </View>
        <View style={cr.barBg}>
          <View style={[cr.barFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
      {mastered > 0 && (
        <View style={[cr.badge, { backgroundColor: Colors.masteryGold + '22' }]}>
          <Text style={{ fontSize: 10, color: Colors.masteryGold, fontWeight: '700' }}>🏆 {mastered}</Text>
        </View>
      )}
    </View>
  );
}
const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 12, fontWeight: '700' },
  barBg: { height: 7, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  badge: { marginLeft: 8, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
});

// ── Notification item ─────────────────────────────────────────────────────────
function NotifItem({ notif }) {
  const typeIcon = {
    progress_update: '📊', mastery_achieved: '🏆',
    new_message: '💬', slot_confirmed: '📅',
  };
  return (
    <View style={[ni.row, !notif.is_read && ni.unread]}>
      <Text style={{ fontSize: 20 }}>{typeIcon[notif.notification_type] ?? '🔔'}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={ni.title}>{notif.title}</Text>
        <Text style={ni.msg} numberOfLines={2}>{notif.message}</Text>
      </View>
      {!notif.is_read && <View style={ni.dot} />}
    </View>
  );
}
const ni = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  unread: { backgroundColor: Colors.secondary + '08', borderRadius: 10, paddingHorizontal: 8 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  msg: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary, marginTop: 4 },
});

// ── Recent activity item ──────────────────────────────────────────────────────
function ActivityItem({ score }) {
  const word = allWords.find(w => w.id === String(score.vocabulary_id));
  const modeIcon = score.mode === 'spelling' ? '✏️' : '🔍';
  const profColor = score.proficiency_level === 'mastered'
    ? Colors.masteryGold
    : score.proficiency_level === 'proficient'
    ? Colors.success
    : Colors.primary;

  return (
    <View style={ai.row}>
      <Text style={{ fontSize: 22, width: 32 }}>{word?.emoji ?? '❓'}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={ai.wordName}>{word?.englishName ?? `Word #${score.vocabulary_id}`}</Text>
        <Text style={ai.sub}>{modeIcon} {score.mode} · {score.attempts} attempt{score.attempts !== 1 ? 's' : ''}</Text>
      </View>
      <View style={[ai.badge, { backgroundColor: profColor + '20' }]}>
        <Text style={[ai.badgeText, { color: profColor }]}>{score.proficiency_level}</Text>
      </View>
    </View>
  );
}
const ai = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  wordName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ParentDashboardScreen({ navigation }) {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const clearActiveProfile = useProfileStore(s => s.clearActiveProfile);

  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);   // student_progress rows
  const [masteryScores, setMasteryScores] = useState([]);         // mastery_scores rows
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);       // current child being viewed

  const students = activeProfile?.studentList ?? [];

  useEffect(() => {
    if (students.length > 0 && !selectedChild) {
      setSelectedChild(students[0]);
    }
  }, [students]);

  useEffect(() => {
    if (selectedChild) loadData();
  }, [selectedChild]);

  const loadData = useCallback(async () => {
    if (!selectedChild || !activeProfile?.parentId) return;
    setLoading(true);
    try {
      // Load mastery scores for selected child
      const { data: scores } = await supabase
        .from('mastery_scores')
        .select('id, student_id, vocabulary_id, total_score, proficiency_level, updated_at')
        .eq('student_id', selectedChild.id)
        .order('updated_at', { ascending: false });

      setMasteryScores(scores ?? []);

      // Load student_progress rows
      const { data: progress } = await supabase
        .from('student_progress')
        .select('id, student_id, vocabulary_id, mode, attempts, score, errors, mastery_weight, attempted_at')
        .eq('student_id', selectedChild.id)
        .order('attempted_at', { ascending: false })
        .limit(20);

      setStudentProgress(progress ?? []);

      // Load notifications for this parent
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, message, notification_type, is_read, created_at')
        .eq('recipient_id', Number(activeProfile.parentId))
        .order('created_at', { ascending: false })
        .limit(5);

      setNotifications(notifs ?? []);
      setUnreadCount((notifs ?? []).filter(n => !n.is_read).length);

    } catch (e) {
      console.error('Parent dashboard load error:', e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, [selectedChild, activeProfile]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleLogout = () => {
    clearActiveProfile();
    navigation.replace('RoleSelect');
  };

  if (!activeProfile) return null;

  // Derived stats
  const totalAttempts     = (studentProgress ?? []).reduce((s, r) => s + (r.attempts ?? 0), 0);
  const masteredCount     = masteryScores.filter(ms => ms.proficiency_level === 'mastered').length;
  const proficientCount   = masteryScores.filter(ms => ms.proficiency_level === 'proficient').length;
  const avgScore          = masteryScores.length > 0
    ? Math.round(masteryScores.reduce((s, ms) => s + (ms.total_score ?? 0), 0) / masteryScores.length)
    : 0;

  return (
    <LinearGradient colors={['#FFF8F0', '#FFF0E0']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {activeProfile.parentName ?? 'Parent'}!</Text>
              <Text style={styles.subGreeting}>Monitoring your child's progress</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => navigation.navigate('ParentNotifications')}
                >
                  <Text style={{ fontSize: 18 }}>🔔</Text>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Child selector (if multiple children) ─────────────────── */}
          {students.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {students.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.childChip,
                    selectedChild?.id === s.id && styles.childChipActive,
                  ]}
                  onPress={() => setSelectedChild(s)}
                >
                  <Text style={{ fontSize: 18 }}>{s.iconEmoji}</Text>
                  <Text style={[
                    styles.childChipText,
                    selectedChild?.id === s.id && { color: Colors.secondary },
                  ]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Selected child banner ──────────────────────────────────── */}
          {selectedChild && (
            <View style={styles.childBanner}>
              <Text style={{ fontSize: 32 }}>{selectedChild.iconEmoji}</Text>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.childName}>{selectedChild.name}</Text>
                <Text style={styles.childSub}>Viewing learning progress</Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={{ color: Colors.textSecondary, marginTop: 12, fontWeight: '600' }}>
                Loading progress...
              </Text>
            </View>
          ) : (
            <>
              {/* ── Stats row ──────────────────────────────────────────── */}
              <View style={styles.statsRow}>
                <StatChip emoji="🏆" label="Mastered" value={masteredCount} color={Colors.masteryGold} />
                <View style={{ width: 10 }} />
                <StatChip emoji="📈" label="Proficient" value={proficientCount} color={Colors.success} />
                <View style={{ width: 10 }} />
                <StatChip emoji="🎯" label="Avg Score" value={`${avgScore}%`} color={Colors.primary} />
                <View style={{ width: 10 }} />
                <StatChip emoji="🔄" label="Attempts" value={totalAttempts} color={Colors.accent} />
              </View>

              {/* ── Category Progress ──────────────────────────────────── */}
              <SectionCard
                title="Category Progress"
                icon="🗺️"
                onPress={() => navigation.navigate('ParentProgressDetail', { studentId: selectedChild?.id })}
              >
                {CATEGORIES.map(cat => (
                  <CategoryRow key={cat} category={cat} masteryScores={masteryScores} />
                ))}
              </SectionCard>

              {/* ── Recent Activity ────────────────────────────────────── */}
              <SectionCard
                title="Recent Activity"
                icon="📝"
                onPress={() => navigation.navigate('ParentProgressDetail', { studentId: selectedChild?.id })}
              >
                {(studentProgress ?? []).length === 0 ? (
                  <Text style={styles.emptyText}>No activity recorded yet.</Text>
                ) : (
                  (studentProgress ?? []).slice(0, 5).map(item => (
                    <ActivityItem key={item.id} score={item} />
                  ))
                )}
              </SectionCard>

              {/* ── Notifications ──────────────────────────────────────── */}
              <SectionCard
                title="Notifications"
                icon="🔔"
                onPress={() => navigation.navigate('ParentNotifications')}
              >
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>No notifications yet.</Text>
                ) : (
                  notifications.map(n => <NotifItem key={n.id} notif={n} />)
                )}
              </SectionCard>

              {/* ── Quick Actions ──────────────────────────────────────── */}
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '33' }]}
                  onPress={() => navigation.navigate('ParentMessages')}
                >
                  <Text style={{ fontSize: 28 }}>💬</Text>
                  <Text style={[styles.actionLabel, { color: Colors.primaryDark }]}>Messages</Text>
                  <Text style={styles.actionSub}>Chat with teacher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: Colors.accent + '12', borderColor: Colors.accent + '33' }]}
                  onPress={() => navigation.navigate('ParentConsultation')}
                >
                  <Text style={{ fontSize: 28 }}>📅</Text>
                  <Text style={[styles.actionLabel, { color: Colors.accent }]}>Book Slot</Text>
                  <Text style={styles.actionSub}>Schedule consultation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: Colors.success + '12', borderColor: Colors.success + '33' }]}
                  onPress={() => navigation.navigate('ParentProgressDetail', { studentId: selectedChild?.id })}
                >
                  <Text style={{ fontSize: 28 }}>📊</Text>
                  <Text style={[styles.actionLabel, { color: Colors.success }]}>Full Report</Text>
                  <Text style={styles.actionSub}>View all scores</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: Colors.masteryGold + '12', borderColor: Colors.masteryGold + '33' }]}
                  onPress={() => navigation.navigate('ParentVocabSuggest')}
                >
                  <Text style={{ fontSize: 28 }}>💡</Text>
                  <Text style={[styles.actionLabel, { color: Colors.secondaryDark }]}>Suggest Word</Text>
                  <Text style={styles.actionSub}>Add vocabulary</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '900', color: Colors.secondaryDark },
  subGreeting: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  notifBtn: { position: 'relative', padding: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.divider },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.errorLight, borderRadius: 10, borderWidth: 1, borderColor: Colors.error + '33' },
  logoutText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.divider, backgroundColor: '#fff', marginRight: 8,
  },
  childChipActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '12' },
  childChipText: { fontWeight: '700', fontSize: 13, color: Colors.textSecondary },

  childBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.secondary + '44',
    elevation: 2, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  childName: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  childSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.success + '15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  activeText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  statsRow: { flexDirection: 'row', marginBottom: 16 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%', borderRadius: 16, padding: 16,
    borderWidth: 1.5, alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  actionLabel: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  actionSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
});