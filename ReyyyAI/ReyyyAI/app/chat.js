import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/colors';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { useWS } from '../services/websocketService';
import ModelSelector from '../components/ModelSelector';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [activeModel, setActiveModel] = useState({ id: 'gemini', name: 'Gemini 2.0 Flash', icon: 'cpu', color: COLORS.modelColors.research });
  const [showModels, setShowModels] = useState(false);
  const flatListRef = useRef(null);
  const ws = useWS();

  useEffect(() => { loadChat(); }, []);

  // REAL-TIME: Listen for stream chunks via WebSocket
  useEffect(() => {
    const unsub = ws?.on?.('stream:chunk', (data) => {
      if (data.requestId === streamingId) {
        if (data.done) {
          setLoading(false);
          const aiMsg = { id: `ai_${Date.now()}`, role: 'assistant', content: data.text, timestamp: Date.now() };
          setMessages(prev => [...prev, aiMsg]);
          setStreamingId(null);
          storageService.saveMessage('default', 'assistant', data.text);
        }
      }
    });
    return () => unsub?.();
  }, [streamingId, ws]);

  const loadChat = async () => {
    try {
      const msgs = await storageService.getMessages('default');
      if (msgs?.length > 0) setMessages(msgs.map(m => ({ ...m, id: String(m.id) })));
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const requestId = `req_${Date.now()}`;
    setStreamingId(requestId);

    try {
      await storageService.saveMessage('default', 'user', input);
      const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      // REAL-TIME: Send via WebSocket
      if (ws?.isConnected?.()) {
        ws.send('stream:prompt', { model: activeModel.id, messages: allMsgs, requestId });
      } else {
        // Fallback to direct API
        await apiService.chatWithGeminiStream(allMsgs, (chunk) => {
          if (chunk.done) {
            setLoading(false);
            const aiMsg = { id: `ai_${Date.now()}`, role: 'assistant', content: chunk.fullText, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
            setStreamingId(null);
            storageService.saveMessage('default', 'assistant', chunk.fullText);
          }
        });
      }
    } catch (e) {
      setLoading(false);
      const errMsg = { id: `err_${Date.now()}`, role: 'assistant', content: 'Error: ' + (e.message || 'Gagal menghubungi AI'), timestamp: Date.now() };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const renderMessage = ({ item }) => {
    const isAI = item.role === 'assistant';
    return (
      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        {isAI && <Text style={styles.aiName}>REYYY</Text>}
        <Text style={[styles.msgText, isAI ? styles.aiText : styles.userText]}>{item.content}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowModels(true)} style={styles.modelBtn}>
          <Feather name={activeModel.icon} size={18} color={activeModel.color} />
          <Text style={styles.modelText}>{activeModel.name}</Text>
          <Feather name="chevron-down" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ModelSelector
        visible={showModels}
        onClose={() => setShowModels(false)}
        onSelect={(model) => { setActiveModel(model); apiService.setActiveModel(model.id); }}
        activeModel={activeModel.id}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="zap" size={48} color={COLORS.accent} />
            <Text style={styles.emptyTitle}>Hai Anggoro!</Text>
            <Text style={styles.emptyText}>Pilih model & mulai chat</Text>
          </View>
        }
      />

      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.loadingText}>REYYY mengetik...</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <Feather name={activeModel.icon} size={20} color={activeModel.color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`Ketik ke ${activeModel.name}...`}
              placeholderTextColor={COLORS.textPlaceholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={4000}
              editable={!loading}
            />
            <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || loading} style={[styles.sendBtn, input.trim() && styles.sendActive]}>
              <Feather name="send" size={18} color={input.trim() ? '#fff' : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modelText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  chatList: { flex: 1, paddingHorizontal: 12 },
  bubble: { maxWidth: '85%', padding: 10, borderRadius: 8, marginVertical: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderLeftWidth: 3, borderLeftColor: COLORS.modelColors.research },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.accent },
  aiName: { fontSize: 10, fontWeight: '600', color: COLORS.modelColors.research, marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  aiText: { color: COLORS.text },
  userText: { color: '#fff' },
  timestamp: { fontSize: 9, color: COLORS.textPlaceholder, marginTop: 4, alignSelf: 'flex-end' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  loadingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  loadingText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  inputBar: { padding: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 6, marginTop: 4 },
  input: { flex: 1, fontSize: 14, color: COLORS.text, maxHeight: 100 },
  sendBtn: { padding: 8, borderRadius: 6, marginLeft: 4 },
  sendActive: { backgroundColor: COLORS.accent },
});