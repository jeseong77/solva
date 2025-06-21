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
      {/* FIX: Added a conditional style for when the item is selected */}
      <View
        style={[
          styles.indicator,
          { backgroundColor: indicatorColor },
          isSelected && styles.selectedIndicator,
        ]}
      />

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
  // FIX: Default container is now flat with a transparent background
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 12, // Reduced padding slightly for a tighter list feel
    paddingHorizontal: 16,
    borderRadius: 10, // Add borderRadius here to be used by the selected state
    marginBottom: 4, // Reduced margin for a tighter list
  },
  // FIX: Selected container now has a solid background color
  selectedContainer: {
    backgroundColor: "#40c057", // Use your app's main color
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8, // Make it a perfect circle
    marginRight: 16, // Increased spacing
  },
  // ADD: New style for the indicator when its row is selected
  selectedIndicator: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  // FIX: Selected title is now white for contrast
  selectedTitle: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
