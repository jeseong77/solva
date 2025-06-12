// app/components/problem/ProblemItem.tsx

import { useAppStore } from "@/store/store";
import { Persona, Priority, Problem, ThreadItemType } from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#ffcdd2",
  medium: "#ffe0b2",
  low: "#c8e6c9",
  none: "#e9ecef",
};

// 컴포넌트가 받을 Props 정의
interface ProblemItemProps {
  problem: Problem;
  persona: Persona;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export default function ProblemItem({
  problem,
  persona,
  onPress,
  onLongPress,
}: ProblemItemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

  // 문제에 속한 전체 스레드를 대상으로 통계 계산
  const stats = useMemo(() => {
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );
    const contentThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    );
    const countByType = (type: ThreadItemType) => {
      return allThreadsInProblem.filter((item) => item.type === type).length;
    };
    return {
      totalThreads: contentThreads.length,
      tasks: countByType("Task"),
      actions: countByType("Action"),
      sessions: countByType("Session"),
    };
  }, [problem.id, threadItems]);

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(problem.id)}
      onLongPress={() => onLongPress?.(problem.id)}
      delayLongPress={500}
    >
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.contentContainer}>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>persona/{persona.title}</Text>
        </View>
        <Text style={styles.itemTitle}>{problem.title}</Text>
        <View style={styles.statsContainer}>
          <Feather name="git-branch" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.totalThreads}</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="check-square" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.tasks}</Text>
          <Text style={styles.separator}>·</Text>
          <MaterialCommunityIcons name="run-fast" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.actions}</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="clock" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.sessions}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  metaContainer: {
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#868e96",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 13,
    color: "#6c757d",
    marginLeft: 4,
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
    fontSize: 14,
  },
});
