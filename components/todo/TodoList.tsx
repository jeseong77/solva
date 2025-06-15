import { useAppStore } from "@/store/store";
import { ActionThreadItem, TaskThreadItem, Todo } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import TodoListItem from "./TodoListItem";

// TodoListItem에 전달할 통일된 데이터 모델
interface UnifiedTodo {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: Date;
  type: "standalone" | "thread"; // 출처 구분
  sourceProblem?: {
    id: string;
    title: string;
  };
}

export default function TodoList() {
  const [newTodoContent, setNewTodoContent] = useState("");

  // 1. 스토어에서 필요한 모든 데이터와 액션을 가져옵니다.
  const {
    todos,
    threadItems,
    problems,
    addTodo,
    updateTodo,
    updateThreadItem,
  } = useAppStore(
    useShallow((state) => ({
      todos: state.todos,
      threadItems: state.threadItems,
      problems: state.problems,
      addTodo: state.addTodo,
      updateTodo: state.updateTodo,
      updateThreadItem: state.updateThreadItem,
    }))
  );

  // 2. 두 종류의 데이터를 하나의 리스트로 합치고 정렬합니다.
  const unifiedTodoList = useMemo((): UnifiedTodo[] => {
    // 독립적인 Todo 목록
    const standaloneTodos: UnifiedTodo[] = todos.map((todo) => ({
      ...todo,
      type: "standalone",
    }));

    // 문제에 속한 Task/Action 목록
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

    // 두 리스트를 합치고 최신순으로 정렬
    return [...standaloneTodos, ...problemTasks].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [todos, threadItems, problems]);

  // 3. 완료 상태를 토글하는 핸들러
  const handleToggleComplete = (
    id: string,
    currentStatus: boolean,
    isStandalone: boolean
  ) => {
    if (isStandalone) {
      // 독립적인 Todo 업데이트
      const todo = todos.find((t) => t.id === id);
      if (todo) {
        updateTodo({
          ...todo,
          isCompleted: !currentStatus,
          completedAt: !currentStatus ? new Date() : undefined,
        });
      }
    } else {
      // 문제에 속한 Task/Action 업데이트
      const thread = threadItems.find((t) => t.id === id);
      if (!thread) return;

      if (thread.type === "Task") {
        updateThreadItem({ ...thread, isCompleted: !currentStatus });
      } else if (thread.type === "Action") {
        updateThreadItem({
          ...thread,
          status: !currentStatus ? "completed" : "todo",
          completedAt: !currentStatus ? new Date() : undefined,
        });
      }
    }
  };

  // 4. 새로운 독립 Todo를 추가하는 핸들러
  const handleAddNewTodo = () => {
    const content = newTodoContent.trim();
    if (!content) return;
    addTodo({ content });
    setNewTodoContent("");
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={unifiedTodoList}
        renderItem={({ item }) => (
          <TodoListItem
            id={item.id}
            content={item.content}
            isCompleted={item.isCompleted}
            sourceProblem={item.sourceProblem}
            onToggleComplete={handleToggleComplete}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.title}>모든 할 일</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>모든 할 일을 마치셨어요! 🎉</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
    color: "#212529",
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
  },
});
