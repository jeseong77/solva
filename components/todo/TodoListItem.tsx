import { Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TodoListItemProps {
  id: string;
  content: string;
  isCompleted: boolean;
  sourceProblem?: {
    id: string;
    title: string;
  };
  onToggleComplete: (
    id: string,
    currentStatus: boolean,
    isStandalone: boolean
  ) => void;
  onPressItem?: () => void;
}

export default function TodoListItem({
  id,
  content,
  isCompleted,
  sourceProblem,
  onToggleComplete,
  onPressItem,
}: TodoListItemProps) {
  const isStandaloneTodo = !sourceProblem;

  // ✅ [변경] 루트 View를 TouchableOpacity로 변경하여 전체를 클릭 가능하게 만듭니다.
  return (
    <TouchableOpacity
      style={styles.container}
      // ✅ [이동] 클릭 이벤트를 루트 TouchableOpacity로 옮깁니다.
      onPress={() => onToggleComplete(id, isCompleted, isStandaloneTodo)}
      activeOpacity={0.6} // 클릭 시 시각적 피드백을 위한 옵션
    >
      {/* ✅ [변경] 기존 TouchableOpacity를 View로 변경하여 레이아웃만 유지합니다. */}
      <View style={styles.checkboxContainer}>
        <Feather
          name={isCompleted ? "check-square" : "square"}
          size={22}
          color={isCompleted ? "#adb5bd" : "#343a40"}
        />
      </View>

      {/* 할 일 내용 및 출처 정보 (이 부분은 변경 없음) */}
      <View style={styles.contentWrapper}>
        <Text
          style={[styles.contentText, isCompleted && styles.completedText]}
          numberOfLines={2}
        >
          {content}
        </Text>
        {sourceProblem && (
          <View style={styles.sourceContainer}>
            <Feather name="git-branch" size={12} color="#868e96" />
            <Text style={styles.sourceText} numberOfLines={1}>
              {sourceProblem.title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity> // ✅ [변경] TouchableOpacity로 닫습니다.
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
  checkboxContainer: {
    paddingRight: 12,
    paddingTop: 2,
  },
  contentWrapper: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#212529",
  },
  completedText: {
    color: "#adb5bd",
    textDecorationLine: "line-through",
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  sourceText: {
    fontSize: 12,
    color: "#868e96",
    marginLeft: 4,
  },
});
