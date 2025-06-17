import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  TaskThreadItem,
  ThreadItem, // ✅ ThreadItem 유니온 타입 import
  Todo,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import TodoListItem from "./TodoListItem";

// TodoListItem에 전달할 통일된 데이터 모델
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

// FlatList에서 사용할 데이터 아이템의 타입을 정의합니다.
type ListItem =
  | { type: "HEADER"; title: string; id: string }
  | { type: "TODO_ITEM"; data: UnifiedTodo }
  | { type: "EMPTY_STATE"; id: string };

export default function TodoList() {
  const { todos, threadItems, problems, updateTodo, updateThreadItem } =
    useAppStore(
      useShallow((state) => ({
        todos: state.todos,
        threadItems: state.threadItems,
        problems: state.problems,
        updateTodo: state.updateTodo,
        updateThreadItem: state.updateThreadItem,
      }))
    );

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
              ? item.isCompleted
              : item.status === "completed",
          createdAt: item.createdAt,
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

  // ✅ [수정] 타입 에러를 해결한 핸들러 함수
  const handleToggleComplete = (id: string, currentStatus: boolean) => {
    // 모든 아이템을 한 배열에 넣어 탐색
    const allItems: (Todo | ThreadItem)[] = [...todos, ...threadItems];
    const itemToUpdate = allItems.find((item) => item.id === id);

    if (!itemToUpdate) {
      console.error("토글할 아이템을 찾지 못했습니다:", id);
      return;
    }

    // 'type' 속성의 존재 여부로 ThreadItem과 Todo를 구분하는 타입 가드
    if ("type" in itemToUpdate && "problemId" in itemToUpdate) {
      // 'type' 속성이 있으면 ThreadItem으로 간주
      const thread = itemToUpdate as ThreadItem;
      if (thread.type === "Task") {
        updateThreadItem({ ...thread, isCompleted: !currentStatus });
      } else if (thread.type === "Action") {
        updateThreadItem({
          ...thread,
          status: !currentStatus ? "completed" : "todo",
          completedAt: !currentStatus ? new Date() : undefined,
        });
      }
    } else {
      // 'type' 속성이 없으면 독립적인 Todo로 간주
      const todo = itemToUpdate as Todo;
      updateTodo({
        ...todo,
        isCompleted: !currentStatus,
        completedAt: !currentStatus ? new Date() : undefined,
      });
    }
  };

  const listData = useMemo<ListItem[]>(() => {
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

  const renderListItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "HEADER":
        const style =
          item.title === "나의 할 일"
            ? styles.mainSectionHeader
            : styles.subSectionHeader;
        return <Text style={style}>{item.title}</Text>;
      case "TODO_ITEM":
        const todo = item.data;
        return (
          <TodoListItem
            id={todo.id}
            content={todo.content}
            isCompleted={todo.isCompleted}
            sourceProblem={todo.sourceProblem}
            onToggleComplete={handleToggleComplete}
          />
        );
      case "EMPTY_STATE":
        return (
          <View style={styles.emptyContainer}>
            <Feather name="flag" size={32} color="#ced4da" />
            <Text style={styles.emptyText}>아직 등록된 할 일이 없어요.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item) =>
          item.type === "TODO_ITEM" ? item.data.id : item.id
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainSectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
  },
  subSectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
  },
  emptyContainer: {
    paddingVertical: 40,
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
