import { Objective, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ResolvedProblemListProps {
  problems: Problem[];
  objective: Objective; // persona -> objective
  onPressProblem: (problemId: string) => void;
}

// 아이템 렌더링을 위한 간단한 Dumb Component
const ResolvedProblemItem = ({
  problem,
  onPress,
  isLast,
}: {
  problem: Problem;
  onPress: (problemId: string) => void;
  isLast: boolean;
}) => {
  const statusInfo = {
    resolved: {
      name: "Resolved",
      icon: "check-circle" as const,
      color: "#1971c2",
      backgroundColor: "#e7f5ff",
    },
    archived: {
      name: "Archived",
      icon: "archive" as const,
      color: "#495057",
      backgroundColor: "#f1f3f5",
    },
  };
  if (problem.status !== "resolved" && problem.status !== "archived") {
    return null;
  }
  const currentStatus = statusInfo[problem.status] || statusInfo.archived;
  const date =
    problem.status === "resolved" ? problem.resolvedAt : problem.archivedAt;

  const formattedDate = date
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(new Date(date))
    : "";

  return (
    <TouchableOpacity
      style={[styles.itemContainer, isLast && styles.lastItemContainer]}
      onPress={() => onPress(problem.id)}
    >
      {/* ✅ [수정] 아이콘을 '상태 칩' View로 감싸고 텍스트 추가 */}
      <View
        style={[
          styles.statusChip,
          { backgroundColor: currentStatus.backgroundColor },
        ]}
      >
        <Feather
          name={currentStatus.icon}
          size={14}
          color={currentStatus.color}
        />
        <Text style={[styles.statusChipText, { color: currentStatus.color }]}>
          {currentStatus.name}
        </Text>
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {problem.title}
      </Text>
      <Text style={styles.itemDate}>{formattedDate}</Text>
    </TouchableOpacity>
  );
};

// ✅ [변경] props 이름 변경
export default function ResolvedProblemList({
  problems,
  objective,
  onPressProblem,
}: ResolvedProblemListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {/* ✅ [변경] 제목 텍스트 및 스타일 수정 */}
        <Text style={styles.titleText}>
          <Text style={styles.objectiveTitle}>'{objective.title}'</Text> 목표의
          해결된 문제들
        </Text>
      </View>
      <FlatList
        data={problems}
        // ✅ renderItem에서 index를 함께 받아 마지막 항목인지 확인
        renderItem={({ item, index }) => (
          <ResolvedProblemItem
            problem={item}
            onPress={onPressProblem}
            isLast={index === problems.length - 1} // ✅ isLast prop 전달
          />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    marginHorizontal: 16,
    borderRadius: 8,
    borderColor: "#e9ecef",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    padding: 16,
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
  // ResolvedProblemItem 스타일
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    color: "#495057",
    marginLeft: 12,
  },
  itemDate: {
    fontSize: 13,
    color: "#adb5bd",
    fontVariant: ["tabular-nums"],
  },
  // ✅ [추가] 상태 칩 관련 스타일
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusChipText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "bold",
  },
  lastItemContainer: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});
