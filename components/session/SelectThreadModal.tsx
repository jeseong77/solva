// components/session/SelectThreadScreen.tsx

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

// SectionList에 사용될 데이터 형식 정의
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
        const threadsForProblem = threadItems.filter(
          (t) => t.problemId === problem.id && t.type !== "Session"
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
        <Text
          style={[styles.itemText, isSelected && styles.itemTextSelected]}
          numberOfLines={1}
        >
          {item.content}
        </Text>
        {isSelected && (
          <Feather name="check-circle" size={20} color="#ffffff" />
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
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              현재 페르소나에 작업할 스레드가 없습니다.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
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
    backgroundColor: "#f8f9fa",
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    fontSize: 15,
    fontWeight: "bold",
    color: "#495057",
    backgroundColor: "#f8f9fa",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
  itemSelected: {
    backgroundColor: "#1971c2",
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
    paddingBottom: 40, // SafeArea 고려
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  button: {
    backgroundColor: "#1971c2",
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
});
