import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import apiService from '../services/apiService';
import storageService from '../services/storageService';

export default function ExamScreen() {
  const [config, setConfig] = useState({ questions: 10, time: 30, source: 'ai' });
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); finishExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started]);

  const startExam = async () => {
    setLoading(true);
    try {
      let qs = [];
      if (config.source === 'ai') {
        const result = await apiService.smartChat([
          { role: 'user', content: `Buatkan ${config.questions} soal pilihan ganda tentang pengetahuan umum. Format JSON array: [{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"}]. HANYA JSON, tanpa markdown.` }
        ]);
        try {
          const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          qs = JSON.parse(cleaned);
        } catch { qs = generateDefaultQuestions(config.questions); }
      } else {
        qs = generateDefaultQuestions(config.questions);
      }
      setQuestions(qs);
      setTimeLeft(config.time * 60);
      setStarted(true);
      setFinished(false);
      setCurrentQ(0);
      setAnswers({});
      setScore(null);
    } catch (e) { Alert.alert('Error', 'Gagal generate soal'); }
    setLoading(false);
  };

  const generateDefaultQuestions = (count) => {
    const qs = [];
    for (let i = 0; i < count; i++) {
      qs.push({
        question: `Soal nomor ${i + 1}: Apa ibukota Indonesia?`,
        options: ['A. Jakarta', 'B. Bandung', 'C. Surabaya', 'D. Medan'],
        answer: 'A'
      });
    }
    return qs;
  };

  const selectAnswer = (qIndex, option) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const finishExam = () => {
    clearInterval(timerRef.current);
    let correct = 0;
    questions.forEach((q, i) => {
      const userAns = answers[i];
      if (userAns && userAns.startsWith(q.answer)) correct++;
    });
    setScore({ correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) });
    setFinished(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}><Text style={styles.title}>Exam Mode</Text></View>
        <View style={styles.configPanel}>
          <Text style={styles.configTitle}>Pengaturan Ujian</Text>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Jumlah Soal</Text>
            <View style={styles.configBtns}>
              {[5, 10, 20].map(n => (
                <TouchableOpacity key={n} style={[styles.configBtn, config.questions === n && styles.configActive]} onPress={() => setConfig({...config, questions: n})}>
                  <Text style={[styles.configBtnText, config.questions === n && styles.configActiveText]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Waktu (menit)</Text>
            <View style={styles.configBtns}>
              {[15, 30, 60].map(n => (
                <TouchableOpacity key={n} style={[styles.configBtn, config.time === n && styles.configActive]} onPress={() => setConfig({...config, time: n})}>
                  <Text style={[styles.configBtnText, config.time === n && styles.configActiveText]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startExam} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Mulai Ujian</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}><Text style={styles.title}>Hasil Ujian</Text></View>
        <ScrollView contentContainerStyle={styles.resultPanel}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score?.percentage || 0}%</Text>
            <Text style={styles.scoreLabel}>{score?.correct}/{score?.total} benar</Text>
          </View>
          {!reviewMode ? (
            <>
              <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewMode(true)}>
                <Feather name="eye" size={20} color="#fff" />
                <Text style={styles.reviewBtnText}>Review Jawaban</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtn} onPress={startExam}>
                <Feather name="rotate-cw" size={20} color={COLORS.accent} />
                <Text style={styles.retryBtnText}>Ujian Lagi</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.reviewTitle}>Review Per Soal</Text>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = userAns && userAns.startsWith(q.answer);
                return (
                  <View key={i} style={[styles.reviewCard, isCorrect ? styles.reviewCorrect : styles.reviewWrong]}>
                    <Text style={styles.reviewQ}>{i + 1}. {q.question}</Text>
                    {q.options.map(o => (
                      <Text key={o} style={[styles.reviewOption, o.startsWith(q.answer) && styles.reviewRightAns, userAns === o && !isCorrect && styles.reviewUserWrong]}>
                        {o} {o.startsWith(q.answer) ? ' ✓' : ''} {userAns === o && !isCorrect ? ' ✗' : ''}
                      </Text>
                    ))}
                  </View>
                );
              })}
              <TouchableOpacity style={styles.retryBtn} onPress={startExam}>
                <Feather name="rotate-cw" size={20} color={COLORS.accent} />
                <Text style={styles.retryBtnText}>Ujian Lagi</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ] || { question: 'Loading...', options: [] };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Soal {currentQ + 1}/{questions.length}</Text>
        <Text style={[styles.timer, timeLeft < 300 && styles.timerRed]}>{formatTime(timeLeft)}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.examPanel}>
        <Text style={styles.question}>{q.question}</Text>
        {q.options?.map((o, i) => (
          <TouchableOpacity key={i} style={[styles.option, answers[currentQ] === o && styles.optionSelected]} onPress={() => selectAnswer(currentQ, o)}>
            <Text style={[styles.optionText, answers[currentQ] === o && styles.optionSelectedText]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.examNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
          <Feather name="arrow-left" size={20} color={currentQ === 0 ? COLORS.textPlaceholder : COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navText}>{currentQ + 1} / {questions.length}</Text>
        {currentQ < questions.length - 1 ? (
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentQ(currentQ + 1)}>
            <Feather name="arrow-right" size={20} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishBtn} onPress={() => Alert.alert('Selesai', 'Yakin selesaikan ujian?', [{ text: 'Batal' }, { text: 'Selesai', onPress: finishExam }])}>
            <Text style={styles.finishBtnText}>Selesai</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

import { ActivityIndicator } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  timer: { fontSize: 18, fontWeight: '700', color: COLORS.accent, fontFamily: 'monospace' },
  timerRed: { color: COLORS.danger },
  configPanel: { padding: 20, gap: 20 },
  configTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: 10 },
  configRow: { gap: 8 },
  configLabel: { fontSize: 14, color: COLORS.textSecondary },
  configBtns: { flexDirection: 'row', gap: 8 },
  configBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  configActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  configBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  configActiveText: { color: '#fff' },
  startBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  examPanel: { padding: 20, gap: 12 },
  question: { fontSize: 16, fontWeight: '500', color: COLORS.text, lineHeight: 24, marginBottom: 10 },
  option: { padding: 16, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  optionSelected: { backgroundColor: COLORS.accent + '30', borderColor: COLORS.accent },
  optionText: { fontSize: 15, color: COLORS.text },
  optionSelectedText: { color: COLORS.accent, fontWeight: '600' },
  examNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  navBtn: { padding: 10 },
  navText: { fontSize: 14, color: COLORS.textSecondary },
  finishBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  finishBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  resultPanel: { padding: 20, alignItems: 'center', gap: 16 },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.accent + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.accent, marginBottom: 10 },
  scoreNumber: { fontSize: 40, fontWeight: '800', color: COLORS.accent },
  scoreLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, width: '100%', justifyContent: 'center' },
  reviewBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, width: '100%', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent },
  retryBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.accent },
  reviewTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, alignSelf: 'flex-start', marginTop: 10 },
  reviewCard: { width: '100%', padding: 16, borderRadius: 10, borderWidth: 1, gap: 8 },
  reviewCorrect: { backgroundColor: COLORS.success + '15', borderColor: COLORS.success },
  reviewWrong: { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger },
  reviewQ: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  reviewOption: { fontSize: 13, color: COLORS.textSecondary, paddingLeft: 8 },
  reviewRightAns: { color: COLORS.success, fontWeight: '600' },
  reviewUserWrong: { color: COLORS.danger, textDecorationLine: 'line-through' },
});