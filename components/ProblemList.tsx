// src/components/ProblemList.tsx
import ProblemListItem from "@/components/ProblemListItem";
import { Problem, Project, Task } from "@/types"; // Project 타입 import 추가
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProblemListProps {
  problems: Problem[];
  tasks: Task[];
  projects: Project[]; // allProjects prop 추가 (HomeScreen에서 전달받을 projects 상태)
  isLoading: boolean;
  onPressProblem: (problemId: string) => void;
  onPressAddProblem: () => void;
  allProblemsForContext: Problem[]; // ProblemListItem의 allProblems prop에 전달됨
  onDeleteProblem: (problemId: string) => void;
}

export default function ProblemList({
  problems,
  tasks,
  projects, // props로 projects 받기
  isLoading,
  onPressProblem,
  onPressAddProblem,
  allProblemsForContext,
  onDeleteProblem,
}: ProblemListProps) {
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
          allProjects={projects} // 전달받은 projects를 allProjects prop으로 전달
          allTasks={tasks}
          onPress={onPressProblem}
          onDelete={onDeleteProblem}
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
}

const styles = StyleSheet.create({
  listOuterContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#a8cbe8",
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonIcon: {
    marginRight: 8,
    color: "#232f48",
  },
  addButtonText: {
    color: "#232f48",
    fontSize: 16,
    fontWeight: "500",
  },
});
