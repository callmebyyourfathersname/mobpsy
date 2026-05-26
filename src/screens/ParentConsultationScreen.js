import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useProfileStore } from '../store/store';

function SlotCard({ slot, onBook, booked }) {
  const start = slot.time_start?.slice(0, 5) ?? '--:--';
  const end   = slot.time_end?.slice(0, 5)   ?? '--:--';
  const date  = slot.scheduled_date
    ? new Date(slot.scheduled_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—';

  return (
    <View style={[sc.card, booked && sc.cardBooked, !slot.is_available && sc.cardTaken]}>
      <View style={sc.left}>
        <View style={sc.dateBadge}>
          <Text style={sc.dateText}>{date}</Text>
        </View>
        <Text style={sc.time}>{start} – {end}</Text>
        {booked && <Text style={sc.bookedLabel}>✓ You booked this</Text>}
        {!slot.is_available && !booked && <Text style={sc.takenLabel}>Slot taken</Text>}
      </View>
      {slot.is_available && !booked && (
        <TouchableOpacity style={sc.bookBtn} onPress={() => onBook(slot)}>
          <Text style={sc.bookText}>Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.divider,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardBooked: { borderColor: Colors.success + '66', backgroundColor: Colors.success + '08' },
  cardTaken: { opacity: 0.5 },
  left: { flex: 1 },
  dateBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent + '15',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  dateText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  time: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  bookedLabel: { fontSize: 11, color: Colors.success, fontWeight: '700', marginTop: 2 },
  takenLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  bookBtn: {
    backgroundColor: Colors.secondary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  bookText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

// ── My bookings ──
function BookingItem({ booking }) {
  const statusColor = booking.status === 'confirmed'
    ? Colors.success : booking.status === 'pending'
    ? Colors.warning : Colors.error;

  return (
    <View style={bk.row}>
      <View style={{ flex: 1 }}>
        <Text style={bk.purpose}>{booking.purpose_of_meeting ?? 'Consultation'}</Text>
        <Text style={bk.date}>
          {booking.scheduled_date
            ? new Date(booking.scheduled_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
            : '—'}
          {' · '}
          {booking.time_start?.slice(0, 5)} – {booking.time_end?.slice(0, 5)}
        </Text>
      </View>
      <View style={[bk.badge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[bk.badgeText, { color: statusColor }]}>{booking.status}</Text>
      </View>
    </View>
  );
}
const bk = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  purpose: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ParentConsultationScreen({ navigation }) {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const [tab, setTab]             = useState('available'); // 'available' | 'booked'
  const [slots, setSlots]         = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get teacher via student → class_list
      const { data: student } = await supabase
        .from('students')
        .select('class_list_id')
        .eq('id', Number(activeProfile?.id))
        .single();

      let tid = null;
      if (student?.class_list_id) {
        const { data: cl } = await supabase
          .from('class_lists')
          .select('teacher_id')
          .eq('id', student.class_list_id)
          .single();
        tid = cl?.teacher_id ?? null;
      }
      setTeacherId(tid);

      // Load available slots for that teacher
      if (tid) {
        const today = new Date().toISOString().split('T')[0];
        const { data: slotData } = await supabase
          .from('consultation_slots')
          .select('id, teacher_id, scheduled_date, time_start, time_end, is_available, created_at')
          .eq('teacher_id', tid)
          .gte('scheduled_date', today)
          .order('scheduled_date', { ascending: true })
          .order('time_start', { ascending: true });

        setSlots(slotData ?? []);
      }

      // Load my bookings
      const { data: bookings } = await supabase
        .from('face_to_face_bookings')
        .select('id, slot_id, teacher_id, parent_id, purpose_of_meeting, status, scheduled_date, time_start, time_end')
        .eq('parent_id', Number(activeProfile?.parentId));

      setMyBookings(bookings ?? []);

    } catch (e) {
      console.error('Consultation load error:', e.message);
    }
    setLoading(false);
  };

  const handleBook = (slot) => {
    Alert.prompt
      ? Alert.prompt(
          'Purpose of Meeting',
          'Briefly describe what you would like to discuss.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Book', onPress: (purpose) => confirmBook(slot, purpose) },
          ],
          'plain-text',
          ''
        )
      : Alert.alert(
          'Book This Slot?',
          `${new Date(slot.scheduled_date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}\n${slot.time_start?.slice(0,5)} – ${slot.time_end?.slice(0,5)}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => confirmBook(slot, 'Parent consultation') },
          ]
        );
  };

  const confirmBook = async (slot, purpose) => {
    try {
      // Insert booking
      await supabase.from('face_to_face_bookings').insert({
        slot_id: slot.id,
        teacher_id: slot.teacher_id,
        parent_id: Number(activeProfile?.parentId),
        purpose_of_meeting: purpose ?? 'Parent consultation',
        status: 'pending',
        scheduled_date: slot.scheduled_date,
        time_start: slot.time_start,
        time_end: slot.time_end,
      });

      // Mark slot as unavailable
      await supabase
        .from('consultation_slots')
        .update({ is_available: false })
        .eq('id', slot.id);

      Alert.alert('Booked!', 'Your consultation request has been sent. The teacher will confirm it.');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not book the slot: ' + e.message);
    }
  };

  const bookedSlotIds = new Set(myBookings.map(b => b.slot_id));

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
            <Text style={styles.title}>Consultations</Text>
            <Text style={styles.sub}>Book time with your child's teacher</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['available', 'booked'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'available' ? '📅 Available' : `📋 My Bookings (${myBookings.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.secondary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {tab === 'available' && (
              slots.length === 0
                ? <Text style={styles.empty}>No available slots at the moment.{'\n'}Check back later!</Text>
                : slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onBook={handleBook}
                      booked={bookedSlotIds.has(slot.id)}
                    />
                  ))
            )}
            {tab === 'booked' && (
              myBookings.length === 0
                ? <Text style={styles.empty}>You have no bookings yet.</Text>
                : myBookings.map(b => <BookingItem key={b.id} booking={b} />)
            )}
          </ScrollView>
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
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.secondary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.secondaryDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, marginTop: 40, lineHeight: 22 },
});