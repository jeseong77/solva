import PersonaList from "@/components/persona/personaList";
import ProblemDetail from "@/components/problem/ProblemDetail";
import ProblemEdit from "@/components/problem/ProblemEdit";
import ProblemItem from "@/components/problem/ProblemItem";
import SelectWeeklyProblemModal from "@/components/problem/SelectWeeklyProblemModal";
import WeeklyProblemCard from "@/components/problem/WeeklyProblem";
import SessionBox from "@/components/session/SessionBox";
import TodoList from "@/components/todo/TodoList";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useAppStore } from "@/store/store";
import { Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { useShallow } from "zustand/react/shallow";

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
  const layout = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();

  // --- 상태 관리 (State) ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<
    string | undefined
  >();
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingProblemId, setViewingProblemId] = useState<string | null>(null);
  const [isWeeklySelectModalVisible, setWeeklySelectModalVisible] =
    useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "solva", title: "Solva" },
    { key: "todo", title: "Todo" },
  ]);

  // --- 스토어 데이터 및 액션 (Zustand) ---
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
    addWeeklyProblem,
    deleteWeeklyProblem,
    fetchTodos, // TodoList를 위해 추가
  } = useAppStore(
    useShallow((state) => ({
      // ... 기존 상태 및 액션들
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
      addWeeklyProblem: state.addWeeklyProblem,
      deleteWeeklyProblem: state.deleteWeeklyProblem,
      fetchTodos: state.fetchTodos, // TodoList를 위해 추가
    }))
  );

  // --- 데이터 로딩 (useEffect / useFocusEffect) ---
  useFocusEffect(
    useCallback(() => {
      fetchPersonas();
      fetchTodos(); // Todo 목록도 함께 불러옴
    }, [fetchPersonas, fetchTodos])
  );

  useEffect(() => {
    if (selectedPersonaId) {
      const loadDataForPersona = async () => {
        await Promise.all([
          fetchProblems(selectedPersonaId),
          fetchWeeklyProblems({ personaId: selectedPersonaId }),
        ]);
        const currentProblems = useAppStore
          .getState()
          .problems.filter((p) => p.personaId === selectedPersonaId);
        for (const problem of currentProblems) {
          await fetchThreads({ problemId: problem.id });
        }
      };
      loadDataForPersona();
    }
  }, [selectedPersonaId, fetchProblems, fetchWeeklyProblems, fetchThreads]);

  // --- 데이터 가공 (useMemo) ---
  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedPersonaId),
    [personas, selectedPersonaId]
  );

  const activeProblems = useMemo(
    () =>
      selectedPersonaId
        ? problems.filter(
            (p) =>
              p.personaId === selectedPersonaId &&
              (p.status === "active" || p.status === "onHold")
          )
        : [],
    [problems, selectedPersonaId]
  );

  const resolvedProblems = useMemo(
    () =>
      selectedPersonaId
        ? problems.filter(
            (p) =>
              p.personaId === selectedPersonaId &&
              (p.status === "resolved" || p.status === "archived")
          )
        : [],
    [problems, selectedPersonaId]
  );
  const listData = useMemo(() => {
    if (!selectedPersona) return [];

    const data: (
      | { type: "HEADER"; title: string }
      | { type: "PROBLEM"; data: Problem }
    )[] = [];

    if (activeProblems.length > 0) {
      data.push({ type: "HEADER", title: "진행 중인 문제" });
      // ⬇️ 이 부분을 수정하세요.
      activeProblems.forEach((p) => {
        data.push({ type: "PROBLEM", data: p });
      });
    }

    if (resolvedProblems.length > 0) {
      data.push({ type: "HEADER", title: "완료/보관한 문제" });
      // ⬇️ 이 부분도 수정하세요.
      resolvedProblems.forEach((p) => {
        data.push({ type: "PROBLEM", data: p });
      });
    }

    return data;
  }, [selectedPersona, activeProblems, resolvedProblems]);

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

  // --- 핸들러 함수 (Handlers) ---
  const handleSelectPersona = (personaId: string) => {
    setSelectedPersonaId(selectedPersonaId === personaId ? null : personaId);
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
    setEditingProblemId(undefined);
    setEditModalVisible(true);
  };
  const handleEditProblem = (problemId: string) => {
    setEditingProblemId(problemId);
    setEditModalVisible(true);
  };
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
  };

  const handleConfirmWeeklyProblem = (problemId: string) => {
    if (!selectedPersonaId) return;

    const weekIdentifier = getWeekIdentifier(new Date());

    // ✅ [추가] 기존 주간 문제가 있으면 ID를 찾아서 삭제 먼저 실행
    const existingWeeklyProblem = weeklyProblems.find(
      (wp) =>
        wp.personaId === selectedPersonaId &&
        wp.weekIdentifier === weekIdentifier
    );
    if (existingWeeklyProblem) {
      deleteWeeklyProblem(existingWeeklyProblem.id);
    }

    // 새로운 주간 문제 추가
    addWeeklyProblem({
      personaId: selectedPersonaId,
      problemId,
      weekIdentifier,
    });
  };

  // ✅ [수정] 기존 핸들러가 Alert 대신 모달을 열도록 변경
  const handleNavigateToSetWeeklyProblem = () => {
    setWeeklySelectModalVisible(true);
  };

  // ✅ [추가] Todo 탭에서 FAB를 눌렀을 때의 동작 (현재는 로그만 출력)
  const handleCreateTodo = () => {
    // 이 부분은 나중에 Todo 입력창에 포커스를 주거나,
    // 별도의 Todo 작성 모달을 여는 로직으로 확장할 수 있습니다.
    console.log("Create New Todo Pressed!");
  };

  // --- 탭 뷰 렌더링 정의 (SceneMap) ---
  const SolvaView = () => (
    <View style={styles.sceneContainer}>
      {selectedPersona ? (
        <FlatList
          data={listData}
          keyExtractor={(item, index) =>
            item.type === "PROBLEM" ? item.data.id : item.title + index
          }
          ListHeaderComponent={
            <>
              <SessionBox />
              <WeeklyProblemCard
                persona={selectedPersona}
                weeklyProblem={currentWeeklyProblem}
                problem={problemForWeekly}
                onPress={handleNavigateToProblemDetail}
                onPressNew={handleNavigateToSetWeeklyProblem}
                onChangeWeeklyProblem={handleNavigateToSetWeeklyProblem}
              />
            </>
          }
          renderItem={({ item }) => {
            if (item.type === "HEADER") {
              return <Text style={styles.listSectionHeader}>{item.title}</Text>;
            }
            if (item.type === "PROBLEM" && item.data) {
              return (
                <ProblemItem
                  problem={item.data}
                  persona={selectedPersona}
                  onPress={handleNavigateToProblemDetail}
                  onLongPress={handleLongPressPersona}
                />
              );
            }
            return null;
          }}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Image
            source={require("@/assets/images/main_sample.png")}
            style={styles.placeholderImage}
          />
          <Text style={styles.placeholderText}>
            페르소나를 추가하거나 선택하여 작업을 시작해 보세요!
          </Text>
        </View>
      )}
    </View>
  );

  const renderScene = SceneMap({
    solva: SolvaView,
    todo: TodoList,
  });

  const activeView = routes[index].key as "solva" | "todo";

  return (
    <SafeAreaView style={styles.container}>
      <PersonaList
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        onLongPressPersona={handleLongPressPersona}
        onPressAddPersona={handleNavigateToCreatePersona}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        // 1. TabBar의 컨테이너, 인디케이터, 색상 등을 설정합니다.
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor="#212529"
            inactiveColor="#adb5bd"
          />
        )}
        commonOptions={{
          labelStyle: styles.tabLabel,
        }}
      />

      <View style={[styles.fabContainer, { bottom: tabBarHeight + 16 }]}>
        <FloatingActionButton
          mode={activeView}
          onPress={
            activeView === "solva" ? handleCreateProblem : handleCreateTodo
          }
        />
      </View>
      {/* --- 모달 컴포넌트들 --- */}
      {selectedPersona && (
        <ProblemEdit
          isVisible={isEditModalVisible}
          onClose={handleCloseEditModal}
          problemId={editingProblemId}
          personaId={selectedPersona.id}
        />
      )}
      <ProblemDetail
        isVisible={isDetailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        problemId={viewingProblemId}
      />
      <SelectWeeklyProblemModal
        isVisible={isWeeklySelectModalVisible}
        onClose={() => setWeeklySelectModalVisible(false)}
        onConfirm={handleConfirmWeeklyProblem}
      />
    </SafeAreaView>
  );
}

// ✅ 스타일 정의는 반드시 컴포넌트 선언 이후에 위치해야 합니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    flex: 1,
    paddingTop: 70,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  placeholderImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    opacity: 0.8,
  },
  tabBar: {
    backgroundColor: "#ffffff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  tabIndicator: {
    backgroundColor: "#212529",
    height: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "none",
  },
  listContentContainer: {
    paddingBottom: 64,
  },
  listSectionHeader: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  newProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  newProblemButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
  },
});
