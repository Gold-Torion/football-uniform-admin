import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, HelpCircle, Users } from 'lucide-react-native';
import { QuizApi, type QuizPublic, type QuizResult } from '../../api/quiz';
import { useAuthStore } from '../../store/auth.store';
import { webAlert } from '../../utils/webAlert';
import { colors } from '../../theme/colors';

function isResult(q: QuizPublic | QuizResult): q is QuizResult {
  return 'correctIndex' in q;
}

export function QuizScreen() {
  const [quiz,     setQuiz]     = useState<QuizPublic | QuizResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isGuest   = useAuthStore((s) => s.isGuest);
  const accessToken = useAuthStore((s) => s.accessToken);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await QuizApi.getActive();
      setQuiz(data);
    } catch {
      // silently ignore — no quiz available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onSubmit = async () => {
    if (selected === null || !quiz) return;
    setSubmitting(true);
    try {
      const result = await QuizApi.answer(quiz.quizId, selected);
      setQuiz(result);
      setSelected(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      webAlert('Erro', typeof msg === 'string' ? msg : 'Não foi possível enviar resposta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3c3c3c' }}>
        <ActivityIndicator size="large" color={colors.arenaDourado} />
      </View>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <HelpCircle size={56} color="rgba(234,234,234,0.55)" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#EAEAEA', marginTop: 16, textAlign: 'center' }}>
            Nenhum quiz disponível
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(234,234,234,0.55)', marginTop: 8, textAlign: 'center' }}>
            Volte em breve para responder o próximo quiz!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const answered = isResult(quiz) && quiz.userAnswer !== undefined;
  const result   = answered && isResult(quiz) ? quiz : null;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#3c3c3c' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Header */}
        <View style={{
          backgroundColor: colors.arenaVerde,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.arenaDourado, fontWeight: '900', fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>
            QUIZ
          </Text>
          <Text style={{ color: '#EAEAEA', fontWeight: '800', fontSize: 18, textAlign: 'center', lineHeight: 26 }}>
            {quiz.question}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Users size={14} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {quiz.totalAnswers} {quiz.totalAnswers === 1 ? 'resposta' : 'respostas'}
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={{ gap: 10 }}>
          {quiz.options.map((opt, i) => {
            const isSelected  = selected === i;
            const isCorrect   = result && i === result.correctIndex;
            const isWrong     = result && result.userAnswer?.chosenIndex === i && !result.userAnswer.correct;
            const pct         = result && result.totalAnswers > 0
              ? Math.round(((result.answerCounts[i] ?? 0) / result.totalAnswers) * 100)
              : 0;

            let bg:       string = '#444444';
            let border:   string = 'rgba(255,255,255,0.1)';
            let txtColor: string = '#EAEAEA';

            if (isSelected && !result)   { bg = '#335336'; border = '#335336'; txtColor = '#fff'; }
            if (isCorrect)               { bg = '#dcfce7'; border = '#22c55e'; txtColor = '#166534'; }
            if (isWrong)                 { bg = '#fee2e2'; border = '#ef4444'; txtColor = '#991b1b'; }

            return (
              <Pressable
                key={i}
                disabled={!!result || submitting}
                onPress={() => setSelected(i)}
                style={{
                  backgroundColor: bg,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: border,
                  padding: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Progress bar behind option (shown after answer) */}
                {result && (
                  <View style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: isCorrect ? '#bbf7d0' : isWrong ? '#fecaca' : '#f1f5f9',
                    borderRadius: 12,
                  }} />
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: isSelected && !result ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontWeight: '800', fontSize: 13, color: txtColor }}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: txtColor, flex: 1 }}>
                      {opt}
                    </Text>
                  </View>

                  {result && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: txtColor }}>{pct}%</Text>
                      {isCorrect && <CheckCircle size={18} color="#22c55e" />}
                      {isWrong   && <XCircle    size={18} color="#ef4444" />}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Submit button */}
        {!result && (
          (isGuest || !accessToken) ? (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}>
              <Text style={{ color: 'rgba(234,234,234,0.55)', fontWeight: '600', fontSize: 14 }}>
                Faça login para responder o quiz
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onSubmit}
              disabled={selected === null || submitting}
              style={({ pressed }) => ({
                backgroundColor: selected === null ? colors.ink3 : colors.arenaDourado,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 20,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#1C1A14', fontWeight: '800', fontSize: 16 }}>Confirmar resposta</Text>
              }
            </Pressable>
          )
        )}

        {/* Result feedback */}
        {result?.userAnswer && (
          <View style={{
            backgroundColor: result.userAnswer.correct ? '#dcfce7' : '#fee2e2',
            borderRadius: 16,
            padding: 16,
            marginTop: 20,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 12,
          }}>
            {result.userAnswer.correct
              ? <CheckCircle size={28} color="#22c55e" />
              : <XCircle    size={28} color="#ef4444" />
            }
            <View style={{ flex: 1 }}>
              <Text style={{
                fontWeight: '800', fontSize: 16,
                color: result.userAnswer.correct ? '#166534' : '#991b1b',
              }}>
                {result.userAnswer.correct ? 'Acertou!' : 'Errou!'}
              </Text>
              {!result.userAnswer.correct && (
                <Text style={{ fontSize: 13, color: '#991b1b', marginTop: 2 }}>
                  Resposta correta: {result.options[result.correctIndex]}
                </Text>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
