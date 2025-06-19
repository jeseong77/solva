// app/components/problem/ProblemList.tsx

import { useAppStore } from "@/store/store";
import { Objective, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ProblemItem from "./ProblemItem";

// ✅ [변경] Props 정의
interface ProblemListProps {
  problems: Problem[];
  objective: Objective; // persona -> objective
  onPressProblem: (problemId: string) => void;
  onLongPressProblem?: (problemId: string) => void;
}

// ✅ [변경] props 이름 변경
export default function ProblemList({
  problems,
  objective,
  onPressProblem,
  onLongPressProblem,
}: ProblemListProps) {
  const deleteProblem = useAppStore((state) => state.deleteProblem);

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

  const handleLongPress = (problemId: string) => {
    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return;

    const options = [];
    if (onLongPressProblem) {
      options.push({
        text: "편집하기",
        onPress: () => onLongPressProblem(problemId),
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
        '{objective.title}'에 정의된 문제가 없습니다.
      </Text>
      <Text style={styles.emptySubText}>새로운 문제를 추가해보세요.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          <Text style={styles.objectiveTitle}>'{objective.title}'</Text> 목표의
          문제들
        </Text>
      </View>
      <FlatList
        data={problems}
        renderItem={({ item, index }) => (
          <ProblemItem
            problem={item}
            objective={objective}
            onPress={onPressProblem}
            onLongPress={handleLongPress}
            isLast={index === problems.length - 1} // 마지막 아이템인지 확인
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContentContainer}
        scrollEnabled={false}
      />
    </View>
  );
}

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
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  titleText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#495057",
  },
  objectiveTitle: {
    fontWeight: "700",
    color: "#212529",
  },
  emptyContainer: {
    minHeight: Dimensions.get("window").height * 0.2,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
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
});
