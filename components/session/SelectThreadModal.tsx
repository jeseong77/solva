import { useAppStore } from "@/store/store";
import { Problem, ThreadItem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

// 컴포넌트가 받을 Props 정의
interface SelectThreadModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (threadId: string) => void;
}

// SectionList에 사용될 데이터 형식 정의
interface ThreadSection {
  title: string; // Problem 제목
  data: ThreadItem[];
}

export default function SelectThreadModal({
  isVisible,
  onClose,
  onConfirm,
}: SelectThreadModalProps) {
  // 현재 선택된 스레드를 추적하기 위한 상태
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // 스토어에서 필요한 데이터 가져오기
  const { problems, threadItems, selectedPersonaId } = useAppStore(
    useShallow((state) => ({
      problems: state.problems,
      threadItems: state.threadItems,
      selectedPersonaId: state.selectedPersonaId,
    }))
  );

  // 현재 선택된 페르소나의 문제 및 스레드 목록을 SectionList 형식으로 가공
  const threadSections = useMemo((): ThreadSection[] => {
    if (!selectedPersonaId) return [];

    // 1. 현재 페르소나에 속한 문제들을 필터링
    const personaProblems = problems.filter(
      (p) => p.personaId === selectedPersonaId
    );

    // 2. 각 문제별로 스레드 목록을 구성하여 섹션 데이터 생성
    return personaProblems
      .map((problem) => {
        // 문제에 속한 모든 스레드 필터링 ('Session' 타입 제외)
        const threadsForProblem = threadItems.filter(
          (t) => t.problemId === problem.id && t.type !== "Session"
        );
        // 스레드가 있는 경우에만 섹션에 포함
        return threadsForProblem.length > 0
          ? { title: problem.title, data: threadsForProblem }
          : null;
      })
      .filter((section): section is ThreadSection => section !== null); // null인 항목 제거
  }, [selectedPersonaId, problems, threadItems]);

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    if (selectedThreadId) {
      onConfirm(selectedThreadId);
      handleClose(); // 모달 닫기
    }
  };

  // 모달 닫기 핸들러 (선택 상태 초기화)
  const handleClose = () => {
    setSelectedThreadId(null);
    onClose();
  };

  // 각 스레드 아이템 렌더링
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
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>작업할 스레드 선택</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#343a40" />
          </TouchableOpacity>
        </View>

        {/* 스레드 목록 */}
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

        {/* 푸터 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
            disabled={!selectedThreadId} // 스레드가 선택되지 않으면 비활성화
          >
            <Text
              style={[
                styles.buttonText,
                styles.confirmButtonText,
                !selectedThreadId && styles.buttonDisabledText,
              ]}
            >
              선택하고 세션 시작
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    left: 16,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 푸터에 가려지지 않도록
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#495057",
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: "#ffffff",
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginBottom: 8,
  },
  itemSelected: {
    borderColor: "#1971c2",
    backgroundColor: "#e7f5ff",
  },
  itemText: {
    fontSize: 15,
    color: "#212529",
  },
  itemTextSelected: {
    color: "#1971c2",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
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
    padding: 16,
    paddingBottom: 32, // iOS 하단 노치 고려
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#1971c2",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: "#ffffff",
  },
  buttonDisabledText: {
    color: "#ffffff",
    opacity: 0.5,
  },
});
