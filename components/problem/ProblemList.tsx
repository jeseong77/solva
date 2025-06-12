// app/components/problem/ProblemList.tsx

import { Persona, Problem } from "@/types"; // 필요한 타입만 남김
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProblemItem from "./ProblemItem"; // ✅ 분리된 ProblemItem 컴포넌트를 import

// --- ProblemList 컴포넌트 ---

interface ProblemListProps {
  problems: Problem[];
  persona: Persona;
  onPressProblem: (problemId: string) => void;
  onPressNewProblem: () => void;
  onLongPressProblem?: (problemId: string) => void;
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
          // ✅ 분리된 ProblemItem 컴포넌트 사용
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

// --- 스타일시트: ProblemItem 관련 스타일은 제거됨 ---

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
