// components/problem/ProblemList.tsx

import { useAppStore } from "@/store/store";
import { Objective, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ProblemItem from "./ProblemItem";

interface ProblemListProps {
  problems: Problem[];
  objective: Objective;
  onPressProblem: (problemId: string) => void;
  onPressEdit?: (problemId: string) => void;
  onPressEmpty?: () => void;
}

export default function ProblemList({
  problems,
  objective,
  onPressProblem,
  onPressEdit,
  onPressEmpty,
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

  const renderEmptyComponent = () => (
    <TouchableOpacity
      style={styles.emptyContainer}
      onPress={onPressEmpty}
      activeOpacity={0.7}
    >
      <Feather name="plus-circle" size={24} color="#adb5bd" />
      <Text style={styles.emptyText}>새로운 문제를 추가해보세요</Text>
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

      {/* ✅ [변경] problems 배열 길이에 따라 조건부 렌더링 */}
      {problems.length > 0 ? (
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
            scrollEnabled={false}
            ItemSeparatorComponent={Separator}
            // ✅ [변경] ListEmptyComponent는 외부에서 처리하므로 여기서 제거
          />
        </View>
      ) : (
        // ✅ [변경] 배열이 비어있을 경우 emptyComponent를 직접 렌더링
        renderEmptyComponent()
      )}
    </View>
  );
}

// ✅ [변경] 스타일 일부 수정
const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 16,
    // 가로 패딩은 각 컴포넌트에서 개별적으로 제어하도록 제거
  },
  listContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16, // 좌우 마진 추가
  },
  titleContainer: {
    paddingBottom: 12,
    paddingHorizontal: 16, // 제목에만 좌우 패딩 적용
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  objectiveTitle: {
    color: "#40c057",
  },
  // WeeklyProblemCard의 emptyContainer와 유사하게 스타일 조정
  emptyContainer: {
    backgroundColor: "transparent",
    flexDirection: "row", // 아이콘과 텍스트를 가로로 배치
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80, // 높이 조정
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ced4da",
    borderStyle: "dashed",
    marginTop: 4, // 제목과의 간격
    marginHorizontal: 16, // 좌우 마진 추가
  },
  emptyText: {
    marginLeft: 12, // 아이콘과의 간격
    fontSize: 16,
    color: "#868e96",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginLeft: 16,
  },
});
