// components/problem/ProblemList.tsx

import { useAppStore } from "@/store/store";
import { Objective, Problem } from "@/types";
import React from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity, // FIX: Import TouchableOpacity
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ProblemItem from "./ProblemItem";
import { Feather } from "@expo/vector-icons"; // ADD: Import Feather icons

// FIX: Add a new prop for handling the press on the empty state
interface ProblemListProps {
  problems: Problem[];
  objective: Objective;
  onPressProblem: (problemId: string) => void;
  onPressEdit?: (problemId: string) => void;
  onPressEmpty?: () => void; // <-- ADD THIS
}

export default function ProblemList({
  problems,
  objective,
  onPressProblem,
  onPressEdit,
  onPressEmpty, // <-- ADD THIS
}: ProblemListProps) {
  const deleteProblem = useAppStore((state) => state.deleteProblem);

  // ... (showDeleteConfirmation and handleLongPress handlers remain the same)
  const showDeleteConfirmation = (problemId: string, title: string) => {
    Alert.alert(
      `"${title}" 문제 삭제`,
      "이 문제와 연결된 모든 스레드 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deleteProblem(problemId);
            if (success) {
              Toast.show({
                type: "success",
                text1: "삭제 완료",
                text2: `"${title}" 문제가 삭제되었습니다.`,
                position: "top",
                visibilityTime: 2000,
              });
            } else {
              Alert.alert("오류", "문제 삭제에 실패했습니다.");
            }
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
    if (onPressEdit) {
      options.push({ text: "편집하기", onPress: () => onPressEdit(problemId) });
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

  // FIX: Wrap the empty component in a TouchableOpacity that calls the new prop
  const renderEmptyComponent = () => (
    <TouchableOpacity
      style={styles.emptyContainer}
      onPress={onPressEmpty}
      activeOpacity={0.7}
    >
      <Feather name="plus" size={28} color="#adb5bd" />
      <Text style={styles.emptyText}>
        '{objective.title}'에 정의된 문제가 없습니다.
      </Text>
      <Text style={styles.emptySubText}>새로운 문제를 추가해보세요.</Text>
    </TouchableOpacity>
  );

  const Separator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          <Text style={styles.objectiveTitle}>'{objective.title}'</Text> 목표의
          문제들
        </Text>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={problems}
          renderItem={({ item }) => (
            <ProblemItem
              problem={item}
              objective={objective}
              onPress={onPressProblem}
              onLongPress={handleLongPress}
            />
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyComponent}
          scrollEnabled={false}
          ItemSeparatorComponent={Separator}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  titleContainer: {
    paddingBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  objectiveTitle: {
    color: "#40c057",
  },
  // FIX: Updated styles to look more interactive
  emptyContainer: {
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa", // A slightly different background to indicate interactivity
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#dee2e6",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12, // Add margin from the icon
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginLeft: 16,
  },
});
