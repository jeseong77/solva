import PersonaList from "@/components/persona/personaList";
import ProblemDetail from "@/components/problem/ProblemDetail";
import ProblemEdit from "@/components/problem/ProblemEdit";
import ProblemList from "@/components/problem/ProblemList";
import WeeklyProblemCard from "@/components/problem/WeeklyProblem";
import { useAppStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

// 현재 날짜에 대한 주차 식별자(예: "2025-W23")를 생성하는 헬퍼 함수
const getWeekIdentifier = (date: Date): string => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | undefined>(
    undefined
  );
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingProblemId, setViewingProblemId] = useState<string | null>(null);

  // 1. WeeklyProblem 관련 상태와 액션을 추가로 가져옵니다.
  const {
    personas,
    fetchPersonas,
    selectedPersonaId,
    setSelectedPersonaId,
    deletePersona,
    problems,
    fetchProblems,
    fetchThreads,
    weeklyProblems,
    fetchWeeklyProblems,
  } = useAppStore(
    useShallow((state) => ({
      personas: state.personas,
      fetchPersonas: state.fetchPersonas,
      selectedPersonaId: state.selectedPersonaId,
      setSelectedPersonaId: state.setSelectedPersonaId,
      deletePersona: state.deletePersona,
      problems: state.problems,
      fetchProblems: state.fetchProblems,
      fetchThreads: state.fetchThreads,
      weeklyProblems: state.weeklyProblems,
      fetchWeeklyProblems: state.fetchWeeklyProblems,
    }))
  );

  useFocusEffect(
    useCallback(() => {
      fetchPersonas();
    }, [fetchPersonas])
  );

  // 2. 선택된 페르소나가 변경될 때마다 관련 데이터를 모두 불러옵니다.
  useEffect(() => {
    if (selectedPersonaId) {
      const loadDataForPersona = async () => {
        // 문제들과 주간 문제를 병렬로 가져와 성능 향상
        await Promise.all([
          fetchProblems(selectedPersonaId),
          fetchWeeklyProblems({ personaId: selectedPersonaId }),
        ]);

        const currentProblems = useAppStore.getState().problems;
        const problemsForPersona = currentProblems.filter(
          (p) => p.personaId === selectedPersonaId
        );

        for (const problem of problemsForPersona) {
          await fetchThreads({ problemId: problem.id });
        }
      };
      loadDataForPersona();
    }
  }, [selectedPersonaId, fetchProblems, fetchWeeklyProblems, fetchThreads]);

  // 3. 렌더링에 필요한 데이터를 계산합니다.
  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedPersonaId),
    [personas, selectedPersonaId]
  );

  const filteredProblems = useMemo(
    () =>
      selectedPersonaId
        ? problems.filter((p) => p.personaId === selectedPersonaId)
        : [],
    [problems, selectedPersonaId]
  );

  // 이번 주에 해당하는 weeklyProblem과 problem 객체를 찾습니다.
  const currentWeeklyProblem = useMemo(() => {
    if (!selectedPersonaId) return undefined;
    const weekIdentifier = getWeekIdentifier(new Date());
    return weeklyProblems.find(
      (wp) =>
        wp.personaId === selectedPersonaId &&
        wp.weekIdentifier === weekIdentifier
    );
  }, [weeklyProblems, selectedPersonaId]);

  const problemForWeekly = useMemo(() => {
    if (!currentWeeklyProblem) return undefined;
    return problems.find((p) => p.id === currentWeeklyProblem.problemId);
  }, [problems, currentWeeklyProblem]);

  // 핸들러 함수들
  const handleSelectPersona = (personaId: string) => {
    const newSelectedId = selectedPersonaId === personaId ? null : personaId;
    setSelectedPersonaId(newSelectedId);
  };

  const handleLongPressPersona = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    Alert.alert(
      `"${persona.title}"`,
      "어떤 작업을 하시겠습니까?",
      [
        {
          text: "편집하기",
          onPress: () => router.push(`/persona/${personaId}`),
        },
        {
          text: "삭제하기",
          onPress: () => showDeleteConfirmation(personaId, persona.title),
          style: "destructive",
        },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const showDeleteConfirmation = (personaId: string, title: string) => {
    Alert.alert(
      `"${title}" 페르소나 삭제`,
      "이 페르소나와 연결된 모든 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deletePersona(personaId);
            if (success) {
              Alert.alert("성공", "페르소나가 삭제되었습니다.");
            } else {
              Alert.alert("오류", "페르소나 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleNavigateToProblemDetail = (problemId: string) => {
    setViewingProblemId(problemId);
    setDetailModalVisible(true);
  };

  const handleNavigateToCreatePersona = () => {
    router.push("/persona/create");
  };

  const handleCreateProblem = () => {
    setEditingProblemId(undefined); // 수정 ID 초기화 (생성 모드임을 명시)
    setEditModalVisible(true);
  };

  // ProblemList의 아이템 길게 눌렀을 시: 수정 모드로 모달 열기
  const handleEditProblem = (problemId: string) => {
    setEditingProblemId(problemId); // 수정할 ID 설정
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
  };

  // 4. WeeklyProblemCard에 전달할 핸들러 함수를 정의합니다.
  const handleNavigateToSetWeeklyProblem = () => {
    // 주간 문제를 설정하거나 변경하는 화면으로 이동하는 로직
    // 예: router.push(`/weekly-problem/set?personaId=${selectedPersonaId}`);
    Alert.alert("알림", "주간 문제 설정 기능은 준비 중입니다.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <PersonaList
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        onLongPressPersona={handleLongPressPersona}
        onPressAddPersona={handleNavigateToCreatePersona}
      />
      <ScrollView style={styles.mainContentContainer}>
        {/* 5. 선택된 페르소나가 있을 경우 두 컴포넌트를 순서대로 렌더링합니다. */}
        {selectedPersona ? (
          <>
            <WeeklyProblemCard
              persona={selectedPersona}
              weeklyProblem={currentWeeklyProblem}
              problem={problemForWeekly}
              onPress={handleNavigateToProblemDetail}
              onPressNew={handleNavigateToSetWeeklyProblem}
            />
            <ProblemList
              persona={selectedPersona}
              problems={filteredProblems}
              onPressProblem={handleNavigateToProblemDetail}
              onPressNewProblem={handleCreateProblem} // 생성 모달 열기 함수로 교체
              onLongPressProblem={handleEditProblem} // 수정 모달 열기 함수 전달
            />
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              페르소나를 선택하여 관련 문제들을 확인하세요.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ProblemEdit 모달 렌더링 */}
      {selectedPersona && (
        <ProblemEdit
          isVisible={isEditModalVisible}
          onClose={handleCloseEditModal}
          problemId={editingProblemId}
          personaId={selectedPersona.id} // 생성 시 현재 페르소나 ID를 알려주기 위함
        />
      )}

      {/* ProblemDetail 모달 렌더링 */}
      <ProblemDetail
        isVisible={isDetailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        problemId={viewingProblemId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
});
