import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { supabase } from '../utils/supabase';
import { useProfileStore } from '../store/store';

export default function ParentMessagesScreen({ navigation }) {
  const activeProfile = useProfileStore(s => s.activeProfile);
  const [messages, setMessages]     = useState([]);
  const [newMsg, setNewMsg]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [engagementId, setEngagementId] = useState(null);
  const flatRef = useRef(null);

  useEffect(() => {
    initEngagementAndLoad();
  }, []);

  const initEngagementAndLoad = async () => {
    if (!activeProfile?.parentId) return;
    setLoading(true);
    try {
      // Find or create engagement_record for this parent
      const { data: existing } = await supabase
        .from('engagement_records')
        .select('id')
        .eq('parent_id', Number(activeProfile.parentId))
        .order('id', { ascending: false })
        .limit(1);

      let eid = existing?.[0]?.id ?? null;

      if (!eid) {
        // Need a teacher_id — fetch via student's class
        const { data: studentRows } = await supabase
          .from('students')
          .select('class_list_id')
          .eq('id', Number(activeProfile.id))
          .single();

        const classListId = studentRows?.class_list_id;
        let teacherId = null;

        if (classListId) {
          const { data: cl } = await supabase
            .from('class_lists')
            .select('teacher_id')
            .eq('id', classListId)
            .single();
          teacherId = cl?.teacher_id ?? null;
        }

        if (teacherId) {
          const { data: newRec } = await supabase
            .from('engagement_records')
            .insert({ parent_id: Number(activeProfile.parentId), teacher_id: teacherId })
            .select('id')
            .single();
          eid = newRec?.id ?? null;
        }
      }

      setEngagementId(eid);
      if (eid) await loadMessages(eid);

    } catch (e) {
      console.error('Messages init error:', e.message);
    }
    setLoading(false);
  };

  const loadMessages = async (eid) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_role, sender_id, message_body, sent_at, is_read')
      .eq('engagement_id', eid)
      .order('sent_at', { ascending: true });

    setMessages(data ?? []);
    // Mark unread messages (from teacher) as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('engagement_id', eid)
      .eq('sender_role', 'teacher')
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !engagementId) return;
    setSending(true);
    const body = newMsg.trim();
    setNewMsg('');
    try {
      const { data } = await supabase
        .from('messages')
        .insert({
          engagement_id: engagementId,
          sender_role: 'parent',
          sender_id: Number(activeProfile.parentId),
          message_body: body,
          is_read: false,
        })
        .select()
        .single();

      if (data) setMessages(prev => [...prev, data]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Send error:', e.message);
    }
    setSending(false);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_role === 'parent';
    return (
      <View style={[msg.row, isMe ? msg.rowRight : msg.rowLeft]}>
        {!isMe && (
          <View style={msg.avatar}>
            <Text style={{ fontSize: 14 }}>👩‍🏫</Text>
          </View>
        )}
        <View style={[msg.bubble, isMe ? msg.bubbleMe : msg.bubbleThem]}>
          <Text style={[msg.text, isMe ? msg.textMe : msg.textThem]}>
            {item.message_body}
          </Text>
          <Text style={[msg.time, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFF8F0', '#FFF0E0']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSub}>Chat with your child's teacher</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={{ color: Colors.textSecondary, marginTop: 10 }}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={item => String(item.id)}
              renderItem={renderMessage}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
                  <Text style={styles.emptyText}>No messages yet.{'\n'}Start the conversation!</Text>
                </View>
              }
            />
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              value={newMsg}
              onChangeText={setNewMsg}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newMsg.trim() || sending) && { opacity: 0.5 }]}
              onPress={sendMessage}
              disabled={!newMsg.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.sendIcon}>↑</Text>
              }
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const msg = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.accent + '22', alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.divider,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 21 },
  textMe: { color: '#fff', fontWeight: '600' },
  textThem: { color: Colors.textPrimary },
  time: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: '#fff',
  },
  backBtn: { padding: 6 },
  backText: { fontSize: 24, color: Colors.secondary, fontWeight: '700' },
  headerInfo: { marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  list: { padding: 16, flexGrow: 1 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.divider,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.textPrimary, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '800' },
});