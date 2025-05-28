// src/components/ProblemList.tsx
import ProblemListItem from "@/components/ProblemListItem";
import { Problem, Task } from "@/types";
import { Ionicons } from "@expo/vector-icons"; // Ionicons import 추가
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "@/store/store"; 

interface ProblemListProps {
  problems: Problem[];
  tasks: Task[];
  isLoading: boolean;
  onPressProblem: (problemId: string) => void;
  onPressAddProblem: () => void;
  allProblemsForContext: Problem[];
  onDeleteProblem: (problemId: string) => void;
}

const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  tasks,
  isLoading,
  onPressProblem,
  onPressAddProblem,
  allProblemsForContext,
  onDeleteProblem,
}) => {
  if (isLoading && problems.length === 0) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.messageText}>Loading problems...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listOuterContainer}>
      {problems.length === 0 && !isLoading && (
        <View style={styles.messageContainerNoFlex}>
          <Text style={styles.messageText}>
            문제가 없습니다. 첫 번째 문제를 추가해보세요!
          </Text>
        </View>
      )}
      {problems.map((problem) => (
        <ProblemListItem
          key={problem.id}
          problem={problem}
          allProblems={allProblemsForContext}
          allTasks={tasks}
          onPress={onPressProblem}
          onDelete={onDeleteProblem} // onDelete prop 전달
        />
      ))}
      <TouchableOpacity style={styles.addButton} onPress={onPressAddProblem}>
        <Ionicons
          name="add-circle-outline"
          size={22}
          color="#000000"
          style={styles.addButtonIcon}
        />
        <Text style={styles.addButtonText}>Add Problem</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  listOuterContainer: {
    paddingHorizontal: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  messageContainerNoFlex: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  messageText: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    marginTop: 10,
  },
  // "Add Problem" 버튼을 위한 새로운 스타일
  addButton: {
    flexDirection: "row", // 아이콘과 텍스트를 가로로 배열
    alignItems: "center", // 세로 중앙 정렬
    justifyContent: "center", // 가로 중앙 정렬 (버튼 내용물)
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#f7f7f7",
    borderRadius: 0, // 직각 유지
    marginTop: 20, // 목록과의 간격
    marginBottom: 10, // 하단 여백
  },
  addButtonIcon: {
    marginRight: 8, // 아이콘과 텍스트 사이 간격
  },
  addButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ProblemList;
