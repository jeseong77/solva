import { Persona, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 컴포넌트가 받을 Props 정의
interface ResolvedProblemListProps {
  problems: Problem[];
  persona: Persona;
  onPressProblem: (problemId: string) => void;
}

// 아이템 렌더링을 위한 간단한 Dumb Component
const ResolvedProblemItem = ({
  problem,
  onPress,
}: {
  problem: Problem;
  onPress: (problemId: string) => void;
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
      style={styles.itemContainer}
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

export default function ResolvedProblemList({
  problems,
  persona,
  onPressProblem,
}: ResolvedProblemListProps) {
  // --- UI 확인을 위한 예시 데이터 ---
  const dummyPersona: Persona = {
    id: "p1",
    title: "개발자",
    createdAt: new Date(),
    problemIds: ["d1", "d2"],
  };

  const dummyProblems: Problem[] = [
    {
      id: "d1",
      personaId: "p1",
      title: "1차 MVP 릴레이",
      status: "resolved",
      priority: "high",
      childThreadIds: [],
      timeSpent: 0,
      createdAt: new Date("2025-05-20"),
      resolvedAt: new Date("2025-06-01"),
    },
    {
      id: "d2",
      personaId: "p1",
      title: "오래된 프로젝트 문서 정리",
      status: "archived",
      priority: "low",
      childThreadIds: [],
      timeSpent: 0,
      createdAt: new Date("2025-01-10"),
      archivedAt: new Date("2025-03-15"),
    },
  ];
  // ---------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          페르소나 -{" "}
          <Text style={styles.personaTitle}>
            {/* 예시 데이터를 사용합니다. 실제 구현 시에는 persona로 교체 */}
            {dummyPersona.title}
          </Text>
          의 이전 문제들:
        </Text>
      </View>
      <FlatList
        // 예시 데이터를 사용합니다. 실제 구현 시에는 problems로 교체
        data={dummyProblems}
        renderItem={({ item }) => (
          <ResolvedProblemItem problem={item} onPress={onPressProblem} />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false} // 부모 스크롤을 사용하도록 설정
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 64,
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
  personaTitle: {
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
});
