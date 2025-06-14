import { Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 컴포넌트가 받을 Props 정의
// Todo 또는 ThreadItem(Task/Action)의 정보를 조합하여 받습니다.
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
  // 상세 보기 등 추가 액션을 위해 남겨둡니다.
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
  // 독립적인 Todo인지, 문제에 속한 Task/Action인지 구분
  const isStandaloneTodo = !sourceProblem;

  return (
    <View style={styles.container}>
      {/* 완료 토글 체크박스 */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggleComplete(id, isCompleted, isStandaloneTodo)}
      >
        <Feather
          name={isCompleted ? "check-square" : "square"}
          size={22}
          color={isCompleted ? "#adb5bd" : "#343a40"}
        />
      </TouchableOpacity>

      {/* 할 일 내용 및 출처 정보 */}
      <View style={styles.contentWrapper}>
        <Text
          style={[styles.contentText, isCompleted && styles.completedText]}
          numberOfLines={2}
        >
          {content}
        </Text>
        {/* 문제에 속한 Task/Action일 경우 출처 표시 */}
        {sourceProblem && (
          <View style={styles.sourceContainer}>
            <Feather name="git-branch" size={12} color="#868e96" />
            <Text style={styles.sourceText} numberOfLines={1}>
              {sourceProblem.title}
            </Text>
          </View>
        )}
      </View>
    </View>
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
