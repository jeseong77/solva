// components/problem/SelectWeeklyProblemModal.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView, // FIX: We will use ScrollView
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import SelectableProblemItem from "./SelectableProblemItem";

interface SelectWeeklyProblemModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (problemId: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SelectWeeklyProblemModal({
  isVisible,
  onClose,
  onConfirm,
}: SelectWeeklyProblemModalProps) {
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(
    null
  );

  const { problems, selectedObjectiveId } = useAppStore(
    useShallow((state) => ({
      problems: state.problems,
      selectedObjectiveId: state.selectedObjectiveId,
    }))
  );

  const selectableProblems = useMemo(() => {
    if (!selectedObjectiveId) return [];
    return problems.filter(
      (p) => p.objectiveId === selectedObjectiveId && p.status === "active"
    );
  }, [selectedObjectiveId, problems]);

  const handleConfirm = () => {
    if (selectedProblemId) {
      onConfirm(selectedProblemId);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedProblemId(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheetContainer} onPress={() => {}}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header remains fixed at the top */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#343a40" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>집중할 문제 선택</Text>
            </View>

            {/* FIX: The content area is now a ScrollView that will only scroll if the content is too tall. */}
            <ScrollView style={styles.contentScrollView}>
              <Text style={styles.listTitle}>
                집중해서 해결할 문제를 선택하세요.
              </Text>

              {selectableProblems.length > 0 ? (
                selectableProblems.map((item) => (
                  <SelectableProblemItem
                    key={item.id}
                    problem={item}
                    isSelected={item.id === selectedProblemId}
                    onPress={setSelectedProblemId}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>선택할 문제가 없습니다.</Text>
                </View>
              )}
            </ScrollView>

            {/* Footer remains fixed at the bottom */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  !selectedProblemId && styles.buttonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!selectedProblemId}
              >
                <Text style={styles.buttonText}>이 문제로 시작하기</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // FIX: Set a flexible max height as a safeguard against overly long lists.
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  // ADD: A safe area view that allows content to be structured inside
  safeArea: {
    // Let the content determine the height
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    left: 16,
    padding: 4,
  },
  // FIX: This is now the scrollable content area
  contentScrollView: {
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 16,
    color: "#495057",
    paddingVertical: 16,
    paddingTop: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#868e96",
  },
  footer: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 32, // More bottom padding for safe area
    backgroundColor: "#ffffff",
  },
  button: {
    backgroundColor: "#40c057",
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
