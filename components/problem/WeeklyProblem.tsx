// components/problem/WeeklyProblemCard.tsx

import { useAppStore } from "@/store/store";
import {
  InsightThreadItem,
  Objective,
  Problem,
  SessionThreadItem,
  TaskThreadItem,
  WeeklyProblem,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatSeconds = (totalSeconds: number): string => {
  // ... (helper function is unchanged)
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  if (hours > 0) {
    parts.unshift(String(hours).padStart(2, "0"));
  }
  return parts.join(":");
};

interface WeeklyProblemProps {
  weeklyProblem: WeeklyProblem | null | undefined;
  problem: Problem | null | undefined;
  objective: Objective | null | undefined;
  onPress: (problemId: string) => void;
  onPressNew: () => void;
  onChangeWeeklyProblem: () => void;
}

export default function WeeklyProblemCard({
  weeklyProblem,
  problem,
  objective,
  onPress,
  onPressNew,
  onChangeWeeklyProblem,
}: WeeklyProblemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

  // FIX: Replaced D-Day logic with "Time Elapsed" logic
  const timeElapsedDisplay = useMemo(() => {
    if (!weeklyProblem?.createdAt) return "";

    const now = new Date();
    const startTime = new Date(weeklyProblem.createdAt);
    const diffMs = now.getTime() - startTime.getTime();

    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (diffMs < oneDayInMs) {
      // Less than a day: show HH:mm
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    } else {
      // One day or more: show D+N
      const days = Math.floor(diffMs / oneDayInMs);
      return `D+${days}`;
    }
  }, [weeklyProblem?.createdAt]);

  // ADD: A state to force re-render the time every minute for the HH:mm format
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate((v) => v + 1);
    }, 60 * 1000); // Re-render every minute
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    // ... (stats logic is unchanged)
    if (!problem) return null;
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );
    const totalThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    ).length;
    const taskItems = allThreadsInProblem.filter(
      (item): item is TaskThreadItem => item.type === "Task"
    );
    const completedTasks = taskItems.filter(
      (item) => !!item.isCompleted
    ).length;
    const insightItems = allThreadsInProblem.filter(
      (item): item is InsightThreadItem => item.type === "Insight"
    );
    const sessionItems = allThreadsInProblem.filter(
      (item): item is SessionThreadItem => item.type === "Session"
    );
    const totalSessionTime = sessionItems.reduce(
      (sum, item) => sum + (item.timeSpent || 0),
      0
    );
    return {
      totalThreads,
      tasks: { completed: completedTasks, total: taskItems.length },
      insights: insightItems.length,
      totalSessionTime,
    };
  }, [problem, threadItems]);

  if (
    !weeklyProblem ||
    !problem ||
    !objective ||
    problem.status === "resolved" ||
    problem.status === "archived"
  ) {
    return (
      <View style={styles.container}>
        {/* ✅ [수정] 헤더 View로 제목을 감싸서 구조를 통일합니다. */}
        <View style={styles.header}>
          <Text style={styles.componentTitle}>집중 해결할 문제:</Text>
        </View>
        <TouchableOpacity style={styles.emptyContainer} onPress={onPressNew}>
          <Feather name="target" size={24} color="#adb5bd" />
          <Text style={styles.emptyText}>
            집중해서 해결할 문제를 설정해주세요.
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.componentTitle}>집중 해결할 문제</Text>
        <TouchableOpacity onPress={onChangeWeeklyProblem}>
          <Text style={styles.changeButtonText}>변경</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.contentContainer}
        onPress={() => onPress(problem.id)}
        activeOpacity={0.7}
      >
        <View style={styles.contentHeader}>
          <Text style={styles.metaText}>
            {objective.type}/{objective.title}
          </Text>
          <View style={styles.dDayChip}>
            <Text style={styles.dDayText}>{timeElapsedDisplay}</Text>
          </View>
        </View>

        <View style={styles.contentBody}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
          {problem.description && (
            <Text style={styles.problemDescription} numberOfLines={3}>
              {problem.description}
            </Text>
          )}
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <Feather name="git-branch" size={14} color="#6c757d" />
            <Text style={styles.statsText}>{stats.totalThreads}</Text>
            <Text style={styles.separator}>·</Text>
            <Feather name="check-square" size={14} color="#6c757d" />
            <Text style={styles.statsText}>
              {stats.tasks.completed} / {stats.tasks.total}
            </Text>
            <Text style={styles.separator}>·</Text>
            <Feather name="eye" size={14} color="#6c757d" />
            <Text style={styles.statsText}>{stats.insights}</Text>
            <Text style={styles.separator}>·</Text>
            <Feather name="clock" size={14} color="#6c757d" />
            <Text style={styles.statsText}>
              {formatSeconds(stats.totalSessionTime)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  componentTitle: { fontSize: 18, fontWeight: "bold", color: "#212529" },
  contentContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: { fontSize: 13, color: "#868e96" },
  dDayChip: {
    backgroundColor: "#495057",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dDayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  contentBody: { marginBottom: 16 },
  problemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  problemDescription: { fontSize: 15, color: "#495057", lineHeight: 22 },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  statsText: { fontSize: 13, color: "#6c757d", marginLeft: 4 },
  separator: { color: "#ced4da", marginHorizontal: 8 },
  emptyContainer: {
    backgroundColor: "transparent",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ced4da",
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: "#868e96",
    fontWeight: "500",
  },
  changeButtonText: { fontSize: 15, color: "#40c057", fontWeight: "600" },
});
