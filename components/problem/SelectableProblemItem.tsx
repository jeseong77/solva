import { Priority, Problem } from "@/types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Priority에 따른 색상 맵 (No changes here)
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
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
      activeOpacity={0.7}
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
    // FIX: Changed border and background color to your main green theme
    borderColor: "#40c057",
    backgroundColor: "#e6fcf5", // A light green tint for consistency
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 11,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  selectedTitle: {
    // FIX: Changed text color to your main green theme
    color: "#40c057",
    fontWeight: "bold",
  },
});
