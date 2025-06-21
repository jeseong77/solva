// components/problem/ProblemItem.tsx

import { useAppStore } from "@/store/store";
import {
  // REMOVED: ActionThreadItem is no longer needed
  InsightThreadItem, // ADD: Import InsightThreadItem for type guarding
  Objective,
  Priority,
  Problem,
  SessionThreadItem,
  TaskThreadItem,
} from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};

const formatSeconds = (totalSeconds: number): string => {
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

const statusInfo = {
  active: { name: "Active", color: "#2b8a3e", backgroundColor: "#e6fcf5" },
  onHold: { name: "On Hold", color: "#868e96", backgroundColor: "#f1f3f5" },
  resolved: { name: "Resolved", color: "#1971c2", backgroundColor: "#e7f5ff" },
  archived: { name: "Archived", color: "#495057", backgroundColor: "#e9ecef" },
};

interface ProblemItemProps {
  problem: Problem;
  objective: Objective;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export default function ProblemItem({
  problem,
  objective,
  onPress,
  onLongPress,
}: ProblemItemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

  const stats = useMemo(() => {
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

    // REMOVED: Logic for counting 'Action' items
    // const actionItems = ...
    // const completedActions = ...

    // ADD: New logic to count 'Insight' items
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
      tasks: {
        completed: completedTasks,
        total: taskItems.length,
      },
      insights: insightItems.length, // <-- New insight count
      totalSessionTime,
    };
  }, [problem.id, threadItems]);

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  const currentStatus = problem.status || "active";
  const currentStatusInfo = statusInfo[currentStatus];

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(problem.id)}
      onLongPress={() => onLongPress?.(problem.id)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.contentContainer}>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText} numberOfLines={1}>
            {objective.type}/{objective.title}
          </Text>
          <View
            style={[
              styles.statusTag,
              { backgroundColor: currentStatusInfo.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusTagText, { color: currentStatusInfo.color }]}
            >
              {currentStatusInfo.name}
            </Text>
          </View>
        </View>
        <Text style={styles.itemTitle}>{problem.title}</Text>
        <View style={styles.statsContainer}>
          <Feather name="git-branch" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.totalThreads}</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="check-square" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {stats.tasks.completed} / {stats.tasks.total}
          </Text>
          <Text style={styles.separator}>·</Text>

          {/* FIX: Replaced 'Action' stats with 'Insight' stats */}
          <Feather name="eye" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.insights}</Text>

          <Text style={styles.separator}>·</Text>
          <Feather name="clock" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {formatSeconds(stats.totalSessionTime)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 16,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
    flexShrink: 1,
  },
  statusTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: "auto",
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 10,
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
    fontVariant: ["tabular-nums"],
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
    fontSize: 14,
  },
});
