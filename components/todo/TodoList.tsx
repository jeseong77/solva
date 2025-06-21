// components/todo/TodoList.tsx

import { useAppStore } from "@/store/store";
import { ActionThreadItem, TaskThreadItem, ThreadItem, Todo } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
// ✅ [제거] FlatList는 더 이상 사용하지 않습니다.
import { StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import TodoListItem from "./TodoListItem";

// ... (interface, type 정의는 변경 없음)
interface UnifiedTodo {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: Date;
  type: "standalone" | "thread";
  sourceProblem?: {
    id: string;
    title: string;
  };
}
type ListItem =
  | { type: "HEADER"; title: string; id: string }
  | { type: "TODO_ITEM"; data: UnifiedTodo }
  | { type: "EMPTY_STATE"; id: string };

export default function TodoList() {
  const { todos, threadItems, problems, updateTodo, updateThreadItem } =
    useAppStore(
      // ... (zustand 로직 변경 없음)
      useShallow((state) => ({
        todos: state.todos,
        threadItems: state.threadItems,
        problems: state.problems,
        updateTodo: state.updateTodo,
        updateThreadItem: state.updateThreadItem,
      }))
    );

  // ... (useMemo, handleToggleComplete 로직 변경 없음)
  const { activeTodos, completedTodos } = useMemo(() => {
    const standaloneTodos: UnifiedTodo[] = todos.map((todo) => ({
      ...todo,
      type: "standalone",
    }));
    const problemTasks: UnifiedTodo[] = threadItems
      .filter(
        (item): item is TaskThreadItem | ActionThreadItem =>
          item.type === "Task" || item.type === "Action"
      )
      .map((item) => {
        const problem = problems.find((p) => p.id === item.problemId);
        return {
          id: item.id,
          content: item.content,
          isCompleted:
            item.type === "Task"
              ? !!item.isCompleted
              : item.status === "completed",
          createdAt: item.createdAt as Date,
          type: "thread",
          sourceProblem: problem
            ? { id: problem.id, title: problem.title }
            : undefined,
        };
      });
    const unifiedList = [...standaloneTodos, ...problemTasks];
    const active = unifiedList
      .filter((todo) => !todo.isCompleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const completed = unifiedList
      .filter((todo) => todo.isCompleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { activeTodos: active, completedTodos: completed };
  }, [todos, threadItems, problems]);
  const handleToggleComplete = (id: string, currentStatus: boolean) => {
    const allItems: (Todo | ThreadItem)[] = [...todos, ...threadItems];
    const itemToUpdate = allItems.find((item) => item.id === id);
    if (!itemToUpdate) {
      console.error("토글할 아이템을 찾지 못했습니다:", id);
      return;
    }
    if ("type" in itemToUpdate && "problemId" in itemToUpdate) {
      const thread = itemToUpdate as ThreadItem;
      if (thread.type === "Task") {
        updateThreadItem({ ...thread, isCompleted: !currentStatus });
      } else if (thread.type === "Action") {
        updateThreadItem({
          ...thread,
          status: !currentStatus ? "completed" : "todo",
          completedAt: !currentStatus ? new Date() : null,
        });
      }
    } else {
      const todo = itemToUpdate as Todo;
      updateTodo({
        ...todo,
        isCompleted: !currentStatus,
        completedAt: !currentStatus ? new Date() : null,
      });
    }
  };

  const listData = useMemo<ListItem[]>(() => {
    // ... (listData 생성 로직 변경 없음)
    const data: ListItem[] = [];
    data.push({ type: "HEADER", title: "나의 할 일", id: "header-active" });
    if (activeTodos.length === 0) {
      data.push({ type: "EMPTY_STATE", id: "empty-active" });
    } else {
      activeTodos.forEach((todo) => {
        data.push({ type: "TODO_ITEM", data: todo });
      });
    }
    if (completedTodos.length > 0) {
      data.push({
        type: "HEADER",
        title: `완료된 할 일 (${completedTodos.length})`,
        id: "header-completed",
      });
      completedTodos.forEach((todo) => {
        data.push({ type: "TODO_ITEM", data: todo });
      });
    }
    return data;
  }, [activeTodos, completedTodos]);

  // ✅ [변경] renderListItem 함수가 더 이상 필요하지 않습니다. map 안에서 직접 처리합니다.

  return (
    // ✅ [변경] 루트 View의 스타일만 남깁니다. 카드 스타일은 내부로 이동합니다.
    <View style={styles.container}>
      {/* ✅ [변경] 카드 스타일을 가진 listWrapper가 컨텐츠를 감쌉니다. */}
      <View style={styles.listWrapper}>
        {/* ✅ [변경] FlatList 대신, listData.map()을 사용합니다. */}
        {listData.map((item) => {
          // 각 아이템에 대한 고유 key를 설정합니다.
          const key = item.type === "TODO_ITEM" ? item.data.id : item.id;

          switch (item.type) {
            case "HEADER":
              const style =
                item.title === "나의 할 일"
                  ? styles.mainSectionHeader
                  : styles.subSectionHeader;
              return (
                <Text key={key} style={style}>
                  {item.title}
                </Text>
              );

            case "TODO_ITEM":
              const todo = item.data;
              return (
                <TodoListItem
                  key={key}
                  id={todo.id}
                  content={todo.content}
                  isCompleted={todo.isCompleted}
                  sourceProblem={todo.sourceProblem}
                  onToggleComplete={handleToggleComplete}
                />
              );

            case "EMPTY_STATE":
              return (
                <View key={key} style={styles.emptyContainer}>
                  <Feather name="flag" size={32} color="#ced4da" />
                  <Text style={styles.emptyText}>
                    아직 등록된 할 일이 없어요.
                  </Text>
                </View>
              );

            default:
              return null;
          }
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // 부모 탭 뷰에서 공간을 차지하기 위해 flex:1 유지
    backgroundColor: "#F2F2F7",
  },
  listWrapper: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  // 나머지 스타일은 이전과 동일
  mainSectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subSectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#868e96",
    marginTop: 12,
    textAlign: "center",
  },
});
