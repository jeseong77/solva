import { Priority, Problem } from "@/types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373", // 연한 빨강 -> 진한 빨강 계열
  medium: "#ffb74d", // 연한 주황 -> 진한 주황 계열
  low: "#81c784", // 연한 녹색 -> 진한 녹색 계열
  none: "#bdbdbd", // 연한 회색 -> 진한 회색 계열
};

// 컴포넌트가 받을 Props 정의
interface SelectableProblemItemProps {
  problem: Problem;
  isSelected: boolean;
  onPress: (problemId: string) => void;
}

export default function SelectableProblemItem({
  problem,
  isSelected,
  onPress,
}: SelectableProblemItemProps) {
  // 우선순위에 맞는 인디케이터 색상 결정
  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPress(problem.id)}
    >
      {/* 우선순위 인디케이터 */}
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />

      {/* 문제 제목 */}
      <Text
        style={[styles.title, isSelected && styles.selectedTitle]}
        numberOfLines={2}
      >
        {problem.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginBottom: 10,
  },
  selectedContainer: {
    borderColor: "#1971c2",
    backgroundColor: "#e7f5ff",
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 11,
    marginRight: 12,
  },
  title: {
    flex: 1, // 텍스트가 남은 공간을 모두 차지하도록
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  selectedTitle: {
    color: "#1971c2",
    fontWeight: "bold",
  },
});
