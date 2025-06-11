// app/components/problem/ProblemPost.tsx

import { useAppStore } from "@/store/store";
import { Persona, Priority, Problem, ThreadItemType } from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#ffcdd2",
  medium: "#ffe0b2",
  low: "#c8e6c9",
  none: "#e9ecef",
};

// 컴포넌트가 받을 Props 정의
interface ProblemPostProps {
  problem: Problem;
  persona: Persona;
}

export default function ProblemPost({ problem, persona }: ProblemPostProps) {
  // 전역 상태에서 스레드 아이템을 가져와 통계 계산
  const threadItems = useAppStore((state) => state.threadItems);
  const stats = useMemo(() => {
    const relevantThreads = threadItems.filter((item) =>
      problem.childThreadIds.includes(item.id)
    );
    const countByType = (type: ThreadItemType) => {
      return relevantThreads.filter((item) => item.type === type).length;
    };
    return {
      totalThreads: problem.childThreadIds.length,
      tasks: countByType("Task"),
      actions: countByType("Action"),
      sessions: countByType("Session"),
    };
  }, [problem.childThreadIds, threadItems]);

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  // 생성 날짜 포맷팅
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(problem.createdAt);

  return (
    <View style={styles.postContainer}>
      {/* 헤더: 페르소나, 우선순위, 생성일 */}
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            persona/<Text style={styles.personaTitle}>{persona.title}</Text>
          </Text>
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>
      </View>

      {/* 본문: 제목, 설명 */}
      <View style={styles.body}>
        <Text style={styles.problemTitle}>{problem.title}</Text>
        {problem.description && (
          <Text style={styles.problemDescription}>{problem.description}</Text>
        )}
      </View>

      {/* 푸터: 통계 정보 */}
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
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  metaContainer: {
    marginLeft: 10,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
  },
  personaTitle: {
    fontWeight: "bold",
  },
  body: {
    marginBottom: 20,
  },
  problemTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  problemDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#495057",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  statsText: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 4,
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
  },
});
