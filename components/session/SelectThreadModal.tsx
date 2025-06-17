import { useAppStore } from "@/store/store";
import { ThreadItem } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

interface ThreadSection {
  title: string;
  data: ThreadItem[];
}

export default function SelectThreadScreen() {
  const router = useRouter();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { problems, threadItems, selectedPersonaId, startSession } =
    useAppStore(
      useShallow((state) => ({
        problems: state.problems,
        threadItems: state.threadItems,
        selectedPersonaId: state.selectedPersonaId,
        startSession: state.startSession,
      }))
    );

  const threadSections = useMemo((): ThreadSection[] => {
    if (!selectedPersonaId) return [];

    const personaProblems = problems.filter(
      (p) => p.personaId === selectedPersonaId
    );

    return personaProblems
      .map((problem) => {
        // ✅ [수정] 'Task'와 'Action' 타입의 스레드만 필터링하도록 변경
        const threadsForProblem = threadItems.filter(
          (t) =>
            t.problemId === problem.id &&
            (t.type === "Task" || t.type === "Action")
        );
        return threadsForProblem.length > 0
          ? { title: problem.title, data: threadsForProblem }
          : null;
      })
      .filter((section): section is ThreadSection => section !== null);
  }, [selectedPersonaId, problems, threadItems]);

  const handleConfirm = async () => {
    if (!selectedThreadId) return;
    setIsStarting(true);
    await startSession(selectedThreadId);
    setIsStarting(false);
    if (router.canGoBack()) {
      router.back();
    }
  };

  const renderThreadItem = ({ item }: { item: ThreadItem }) => {
    const isSelected = item.id === selectedThreadId;
    return (
      <TouchableOpacity
        style={[styles.itemContainer, isSelected && styles.itemSelected]}
        onPress={() => setSelectedThreadId(item.id)}
      >
        <View style={styles.itemTextContainer}>
          <Text
            style={[styles.itemText, isSelected && styles.itemTextSelected]}
            numberOfLines={1}
          >
            {item.content}
          </Text>
        </View>
        {isSelected && (
          <Feather name="check-circle" size={22} color="#ffffff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>작업할 스레드 선택</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color="#343a40" />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={threadSections}
        keyExtractor={(item) => item.id}
        renderItem={renderThreadItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Feather name="folder" size={16} color="#868e96" />
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              실행할 Task 또는 Action이 없습니다.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
        // ✅ [추가] 각 아이템 사이에 구분선을 렌더링
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedThreadId && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedThreadId || isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>선택하고 세션 시작</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: 16,
  },
  listContentContainer: {
    paddingBottom: 120,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
  },
  itemSelected: {
    backgroundColor: "#2b8a3e",
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#212529",
  },
  itemTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#868e96",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  button: {
    backgroundColor: "#2b8a3e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#adb5bd",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // ✅ [추가] 아이템 구분선 스타일
  divider: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginLeft: 20, // 왼쪽 여백
  },
});
