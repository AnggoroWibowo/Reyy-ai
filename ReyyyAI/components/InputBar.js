import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/colors';

export default function InputBar({ onSend, onCamera, activeModel = 'gemini', loading = false, onEnhance, enhanceText }) {
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef(null);

  const modelIcons = {
    gemini: { icon: 'cpu', color: COLORS.modelColors.research, name: 'Gemini' },
    deepseek: { icon: 'code', color: COLORS.modelColors.coding, name: 'DeepSeek' },
  };

  const model = modelIcons[activeModel] || modelIcons.gemini;

  useEffect(() => {
    if (input.length > 3 && !loading) {
      const timer = setTimeout(() => {
        const suggestions = [
          'Jelaskan dengan detail beserta contohnya',
          'Berikan jawaban singkat dan jelas',
          'Sertakan sumber referensi',
          'Buatkan dalam format langkah-langkah',
        ];
        const random = suggestions[Math.floor(Math.random() * suggestions.length)];
        setSuggestion(random);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestion('');
    }
  }, [input, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend?.(input);
    setInput('');
    setSuggestion('');
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      setInput(prev => prev + (prev.endsWith(' ') ? '' : ' ') + suggestion);
      setSuggestion('');
      Haptics.selectionAsync();
    }
  };

  return (
    <View style={styles.container}>
      {enhanceText && (
        <TouchableOpacity style={styles.enhanceBar} onPress={() => onEnhance?.(input)}>
          <Feather name="sparkles" size={14} color={COLORS.accent} />
          <Text style={styles.enhanceText}>Enhance Prompt</Text>
        </TouchableOpacity>
      )}
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Feather name={model.icon} size={20} color={model.color} style={styles.modelIcon} />
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Ketik ke ${model.name}...`}
              placeholderTextColor={COLORS.textPlaceholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={4000}
              editable={!loading}
            />
            {suggestion && input.length > 3 && (
              <TouchableOpacity onPress={handleAcceptSuggestion} style={styles.suggestionOverlay}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  <Text style={{ color: 'transparent' }}>{input}</Text>
                  <Text style={{ color: COLORS.textPlaceholder, fontStyle: 'italic' }}>{suggestion}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onCamera} style={styles.iconBtn}>
            <Feather name="camera" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSend} disabled={!input.trim() || loading} style={[styles.sendBtn, input.trim() && styles.sendActive]}>
            <Feather name="send" size={18} color={input.trim() ? '#fff' : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  enhanceBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  enhanceText: { fontSize: 12, color: COLORS.accent, fontWeight: '500' },
  inputRow: { padding: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  modelIcon: { marginRight: 8, marginTop: 4 },
  inputWrapper: { flex: 1, position: 'relative' },
  input: { fontSize: 14, color: COLORS.text, maxHeight: 100, padding: 0 },
  suggestionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'box-only' },
  suggestionText: { fontSize: 14 },
  iconBtn: { padding: 8 },
  sendBtn: { padding: 8, borderRadius: 6, marginLeft: 4 },
  sendActive: { backgroundColor: COLORS.accent },
});