// app/components/problem/ProblemList.tsx

import { useAppStore } from "@/store/store";
import { Persona, Priority, Problem, ThreadItemType } from "@/types"; // Priority 타입 임포트
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- ProblemItem 컴포넌트: Reddit 스타일로 재구성 ---

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#ffcdd2", // 파스텔 레드
  medium: "#ffe0b2", // 파스텔 오렌지
  low: "#c8e6c9", // 파스텔 그린
  none: "#e9ecef", // 없음: 회색
};

interface ProblemItemProps {
  problem: Problem;
  persona: Persona; // persona 객체를 props로 받도록 수정
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const ProblemItem = ({
  problem,
  persona,
  onPress,
  onLongPress,
}: ProblemItemProps) => {
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

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(problem.id)}
      onLongPress={() => onLongPress?.(problem.id)} // onLongPress 핸들러 연결
      delayLongPress={500} // 0.5초 이상 누르면 롱프레스로 간주
    >
      {/* 왼쪽: Priority 색상 인디케이터 */}
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />

      {/* 오른쪽: 콘텐츠 영역 */}
      <View style={styles.contentContainer}>
        {/* 상단: 페르소나 정보 */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>persona/{persona.title}</Text>
        </View>

        {/* 중앙: 문제 제목 */}
        <Text style={styles.itemTitle}>{problem.title}</Text>

        {/* 하단: 통계 정보 */}
        <View style={styles.statsContainer}>
          <Feather name="git-branch" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.totalThreads}</Text>
          {stats.tasks > 0 && (
            <>
              <Text style={styles.separator}>·</Text>
              <Feather name="check-square" size={14} color="#6c757d" />
              <Text style={styles.statsText}>{stats.tasks}</Text>
            </>
          )}
          {stats.actions > 0 && (
            <>
              <Text style={styles.separator}>·</Text>
              <MaterialCommunityIcons
                name="run-fast"
                size={14}
                color="#6c757d"
              />
              <Text style={styles.statsText}>{stats.actions}</Text>
            </>
          )}
          {stats.sessions > 0 && (
            <>
              <Text style={styles.separator}>·</Text>
              <Feather name="clock" size={14} color="#6c757d" />
              <Text style={styles.statsText}>{stats.sessions}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- ProblemList 컴포넌트 및 기타 부분 (변경 없음) ---

interface ProblemListProps {
  problems: Problem[];
  persona: Persona;
  onPressProblem: (problemId: string) => void;
  onPressNewProblem: () => void;
  onLongPressProblem?: (problemId: string) => void; // 길게 누르기 이벤트 핸들러 추가
}

export default function ProblemList({
  problems,
  persona,
  onPressProblem,
  onPressNewProblem,
  onLongPressProblem,
}: ProblemListProps) {
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        '{persona.title}'에 정의된 문제가 없습니다.
      </Text>
      <Text style={styles.emptySubText}>새로운 문제를 추가해보세요.</Text>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity
      style={styles.newProblemButton}
      onPress={onPressNewProblem}
    >
      <Feather name="plus" size={18} color="#495057" />
      <Text style={styles.newProblemButtonText}>New Problem</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          페르소나 - <Text style={styles.personaTitle}>{persona.title}</Text>의
          문제들:
        </Text>
      </View>

      <FlatList
        data={problems}
        renderItem={({ item }) => (
          // ProblemItem에 persona prop 전달
          <ProblemItem
            problem={item}
            persona={persona}
            onPress={onPressProblem}
            onLongPress={onLongPressProblem}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContentContainer}
        scrollEnabled={false}
      />
    </View>
  );
}

// --- 스타일시트: ProblemItem 관련 스타일 추가/수정 ---

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    margin: 16,
    borderRadius: 8,
    borderColor: "#e9ecef",
  },
  listContentContainer: {},
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
  // -- ProblemItem 관련 스타일 --
  itemContainer: {
    flexDirection: "row", // 가로 배치
    alignItems: "flex-start", // 상단 정렬
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14, // 원형
    marginTop: 4, // 상단 여백
  },
  contentContainer: {
    flex: 1, // 남은 공간 모두 차지
    marginLeft: 12, // 인디케이터와의 간격
  },
  metaContainer: {
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#868e96",
  },
  itemTitle: {
    fontSize: 16, // 제목 폰트 크기 조정
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
    lineHeight: 22, // 줄 간격 추가
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
  // -- 나머지 스타일 (변경 없음) --
  emptyContainer: {
    minHeight: Dimensions.get("window").height * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
    marginTop: 8,
  },
  newProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    margin: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },
  newProblemButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
});
