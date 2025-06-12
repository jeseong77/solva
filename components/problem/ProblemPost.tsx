// app/components/problem/ProblemPost.tsx

import { useAppStore } from "@/store/store";
import { Persona, Priority, Problem, ThreadItemType } from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Priority에 따른 색상 맵 (기존과 동일)
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

  // ✅ [수정] 통계 계산 로직 변경
  const stats = useMemo(() => {
    // 1. problemId를 기준으로 이 문제에 속한 '모든' 스레드를 가져옵니다.
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );

    // 2. '총 스레드 수'는 보통 작업 내용을 담은 스레드를 의미하므로, 'Session' 타입은 제외하고 계산합니다.
    const contentThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    );

    // 3. 타입별 개수는 전체 스레드에서 계산합니다.
    const countByType = (type: ThreadItemType) => {
      return allThreadsInProblem.filter((item) => item.type === type).length;
    };

    return {
      totalThreads: contentThreads.length, // 세션을 제외한 전체 쓰레드 수
      tasks: countByType("Task"),
      actions: countByType("Action"),
      sessions: countByType("Session"),
    };
  }, [problem.id, threadItems]); // 의존성을 problem.id로 변경하여 더 명확하게 함

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(problem.createdAt));

  return (
    <View style={styles.postContainer}>
      {/* 헤더 (기존과 동일) */}
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            persona/<Text style={styles.personaTitle}>{persona.title}</Text>
          </Text>
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>
      </View>

      {/* 본문 (기존과 동일) */}
      <View style={styles.body}>
        <Text style={styles.problemTitle}>{problem.title}</Text>
        {problem.description && (
          <Text style={styles.problemDescription}>{problem.description}</Text>
        )}
      </View>

      {/* 푸터 (기존과 동일) */}
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

// styles는 기존과 동일
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
