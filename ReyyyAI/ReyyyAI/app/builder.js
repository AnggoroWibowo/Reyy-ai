import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import apiService from '../services/apiService';

export default function BuilderScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [previewMode, setPreviewMode] = useState('split');
  const [gamePlaying, setGamePlaying] = useState(false);
  const webViewRef = useRef(null);

  const generateApp = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setGeneratedCode('');
    try {
      await apiService.chatWithGeminiStream([
        { role: 'user', content: `Buatkan website/app lengkap dengan HTML/CSS/JS untuk: ${prompt}. 
        Rules:
        - Full code dalam 1 file HTML
        - Dark theme (#0A0A0F background)
        - Responsive
        - Modern design
        - Semua CSS & JS inline
        - NO markdown, langsung output code HTML
        Output HANYA code HTML-nya saja.` }
      ], (chunk) => {
        let code = chunk.fullText;
        code = code.replace(/```html/g, '').replace(/```/g, '').trim();
        setGeneratedCode(code);
        if (chunk.done) setLoading(false);
      });
    } catch (e) {
      setLoading(false);
      setGeneratedCode('<html><body style="background:#0A0A0F;color:#E5484D;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>Error generating</h1></body></html>');
    }
  };

  const previewHTML = generatedCode || '<html><body style="background:#0A0A0F;color:#8A8A98;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><p>Generate something to preview</p></body></html>';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Reyyy Builder</Text>
        <View style={styles.modeRow}>
          {['code', 'split', 'preview'].map(m => (
            <TouchableOpacity key={m} style={[styles.modeBtn, previewMode === m && styles.modeActive]} onPress={() => setPreviewMode(m)}>
              <Text style={[styles.modeText, previewMode === m && styles.modeActiveText]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.promptInput}
          placeholder="Deskripsikan app/website/game..."
          placeholderTextColor={COLORS.textPlaceholder}
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity style={styles.generateBtn} onPress={generateApp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="zap" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      {(previewMode === 'code' || previewMode === 'split') && (
        <ScrollView style={styles.codePanel} contentContainerStyle={{ padding: 12 }}>
          <Text style={styles.codeText}>{generatedCode || '// Generated code will appear here...'}</Text>
        </ScrollView>
      )}

      {(previewMode === 'preview' || previewMode === 'split') && (
        <View style={previewMode === 'split' ? styles.splitPreview : styles.fullPreview}>
          <WebView
            ref={webViewRef}
            source={{ html: previewHTML }}
            style={{ flex: 1, backgroundColor: COLORS.background }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          {generatedCode.includes('canvas') || generatedCode.includes('game') ? (
            <View style={styles.gameControls}>
              <TouchableOpacity style={styles.gameBtn} onPress={() => webViewRef.current?.reload()}>
                <Feather name="rotate-cw" size={16} color={COLORS.text} />
                <Text style={styles.gameBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  modeRow: { flexDirection: 'row', gap: 4 },
  modeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: COLORS.surface },
  modeActive: { backgroundColor: COLORS.accent },
  modeText: { fontSize: 11, color: COLORS.textSecondary },
  modeActiveText: { color: '#fff' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  promptInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  generateBtn: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 12, justifyContent: 'center', alignItems: 'center' },
  codePanel: { flex: 1, backgroundColor: '#050508' },
  codeText: { fontSize: 12, color: COLORS.text, fontFamily: 'monospace', lineHeight: 18 },
  splitPreview: { flex: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  fullPreview: { flex: 1 },
  gameControls: { flexDirection: 'row', justifyContent: 'center', padding: 8, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  gameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: COLORS.surfaceHover },
  gameBtnText: { fontSize: 12, color: COLORS.text },
});