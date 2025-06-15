// app/components/problem/ProblemList.tsx

import { useAppStore } from "@/store/store"; // ✅ 스토어 import
import { Persona, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert, // ✅ Alert import
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProblemItem from "./ProblemItem";

// --- ProblemList 컴포넌트 ---

interface ProblemListProps {
  problems: Problem[];
  persona: Persona;
  onPressProblem: (problemId: string) => void;
  onPressNewProblem: () => void;
  onLongPressProblem?: (problemId: string) => void;
}

export default function ProblemList({
  problems,
  persona,
  onPressProblem,
  onPressNewProblem,
  onLongPressProblem,
}: ProblemListProps) {
  // ✅ [수정 1] 스토어에서 deleteProblem 함수 가져오기
  const deleteProblem = useAppStore((state) => state.deleteProblem);

  // ✅ [수정 2] 삭제 확인을 위한 별도 함수
  const showDeleteConfirmation = (problemId: string, title: string) => {
    Alert.alert(
      `"${title}" 문제 삭제`,
      "이 문제와 연결된 모든 스레드 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            await deleteProblem(problemId);
          },
          style: "destructive",
        },
      ]
    );
  };

  // ✅ [수정 3] Problem을 길게 눌렀을 때의 Alert 메뉴 핸들러
  const handleLongPress = (problemId: string) => {
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return;

    // 부모로부터 받은 onLongPressProblem 함수가 있을 때만 '편집하기' 옵션 표시
    const options = [];
    if (onLongPressProblem) {
      options.push({
        text: "편집하기",
        onPress: () => onLongPressProblem(problemId), // 부모의 편집 로직 실행
      });
    }
    options.push({
      text: "삭제하기",
      onPress: () => showDeleteConfirmation(problemId, problem.title),
      style: "destructive" as const,
    });
    options.push({ text: "취소", style: "cancel" as const });

    Alert.alert(
      `"${problem.title}"`,
      "문제에 대한 작업을 선택하세요.",
      options,
      { cancelable: true }
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        '{persona.title}'에 정의된 문제가 없습니다.
      </Text>
      <Text style={styles.emptySubText}>새로운 문제를 추가해보세요.</Text>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity
      style={styles.newProblemButton}
      onPress={onPressNewProblem}
    >
      <Feather name="plus" size={18} color="#495057" />
      <Text style={styles.newProblemButtonText}>New Problem</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          페르소나 - <Text style={styles.personaTitle}>{persona.title}</Text>의
          문제들:
        </Text>
      </View>
      <FlatList
        data={problems}
        renderItem={({ item }) => (
          <ProblemItem
            problem={item}
            persona={persona}
            onPress={onPressProblem}
            onLongPress={handleLongPress}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContentContainer}
        scrollEnabled={false}
      />
    </View>
  );
}

// --- 스타일시트 ---

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    margin: 16,
    borderRadius: 8,
    borderColor: "#e9ecef",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listContentContainer: {},
  titleContainer: {
    padding: 16,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#495057",
  },
  personaTitle: {
    fontWeight: "700",
    color: "#212529",
  },
  emptyContainer: {
    minHeight: Dimensions.get("window").height * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
    marginTop: 8,
  },
  newProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    margin: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },
  newProblemButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
});
