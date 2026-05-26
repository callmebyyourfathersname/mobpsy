import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { allWords } from '../data/vocabularyData';

const PROF_COLOR = {
  mastered:   Colors.masteryGold,
  proficient: Colors.success,
  developing: Colors.primary,
  beginning:  Colors.error,
};

function WordScoreRow({ word, masteryScore, progressRows }) {
  const attempts    = progressRows.reduce((s, r) => s + (r.attempts ?? 0), 0);
  const avgScore    = progressRows.length > 0
    ? Math.round(progressRows.reduce((s, r) => s + (r.score ?? 0), 0) / progressRows.length)
    : null;
  const profLevel   = masteryScore?.proficiency_level ?? 'beginning';
  const totalScore  = masteryScore?.total_score ?? 0;
  const color       = PROF_COLOR[profLevel] ?? Colors.textSecondary;

  return (
    <View style={row.wrap}>
      <Text style={{ fontSize: 28, width: 36 }}>{word.emoji}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={row.nameRow}>
          <Text style={row.english}>{word.englishName}</Text>
          <Text style={row.filipino}> · {word.filipinoName}</Text>
        </View>
        <View style={row.metaRow}>
          <View style={[row.badge, { backgroundColor: color + '20' }]}>
            <Text style={[row.badgeText, { color }]}>{profLevel}</Text>
          </View>
          {attempts > 0 && (
            <Text style={row.meta}>{attempts} attempt{attempts !== 1 ? 's' : ''}</Text>
          )}
          {avgScore !== null && (
            <Text style={row.meta}>avg {avgScore}%</Text>
          )}
        </View>
      </View>
      <View style={row.scoreWrap}>
        <Text style={[row.score, { color }]}>{Math.round(totalScore * 100)}%</Text>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  nameRow: { flexDirection: 'row', alignItems: 'baseline' },
  english: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  filipino: { fontSize: 12, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  meta: { fontSize: 11, color: Colors.textSecondary },
  scoreWrap: { minWidth: 44, alignItems: 'flex-end' },
  score: { fontSize: 15, fontWeight: '900' },
});

export default function ParentProgressDetailScreen({ navigation, route }) {
  const studentId = route?.params?.studentId;
  const [masteryScores, setMasteryScores]   = useState([]);
  const [progressRows, setProgressRows]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filterCat, setFilterCat]           = useState('All');

  const CATS = ['All', 'Animals', 'Furniture', 'School', 'Food', 'Kitchen', 'Toys'];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: ms } = await supabase
        .from('mastery_scores')
        .select('id, vocabulary_id, total_score, proficiency_level, updated_at')
        .eq('student_id', Number(studentId));

      const { data: pr } = await supabase
        .from('student_progress')
        .select('id, vocabulary_id, mode, attempts, score, errors, attempted_at')
        .eq('student_id', Number(studentId));

      setMasteryScores(ms ?? []);
      setProgressRows(pr ?? []);
    } catch (e) {
      console.error('Progress detail error:', e.message);
    }
    setLoading(false);
  };

  const filteredWords = allWords.filter(w =>
    filterCat === 'All' || w.category === filterCat
  );

  const getMastery = (word) => masteryScores.find(ms => String(ms.vocabulary_id) === word.id) ?? null;
  const getProgress = (word) => progressRows.filter(pr => String(pr.vocabulary_id) === word.id);

  return (
    <LinearGradient colors={['#FFF8F0', '#FFF0E0']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>Full Progress Report</Text>
            <Text style={styles.sub}>{masteryScores.length} of {allWords.length} words tracked</Text>
          </View>
        </View>

        {/* Category filter */}
        <FlatList
          horizontal
          data={CATS}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterCat === item && styles.filterChipActive]}
              onPress={() => setFilterCat(item)}
            >
              <Text style={[styles.filterText, filterCat === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={filteredWords}
            keyExtractor={w => w.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <WordScoreRow
                word={item}
                masteryScore={getMastery(item)}
                progressRows={getProgress(item)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: '#fff',
  },
  backBtn: { padding: 6 },
  backText: { fontSize: 24, color: Colors.secondary, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '900', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textSecondary },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.divider },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.divider, backgroundColor: '#fff',
  },
  filterChipActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '15' },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: Colors.secondaryDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
});