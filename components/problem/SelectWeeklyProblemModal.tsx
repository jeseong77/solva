// components/problem/SelectWeeklyProblemModal.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
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
          <SafeAreaView>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#343a40" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>이번 주 문제 선택</Text>
            </View>

            <FlatList
              data={selectableProblems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SelectableProblemItem
                  problem={item}
                  isSelected={item.id === selectedProblemId}
                  onPress={setSelectedProblemId}
                />
              )}
              ListHeaderComponent={() => (
                <Text style={styles.listTitle}>
                  이번 주에 집중할 문제를 선택하세요.
                </Text>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>선택할 문제가 없습니다.</Text>
                </View>
              }
              contentContainerStyle={styles.listContentContainer}
            />

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
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    left: 16,
    padding: 4,
  },
  listContentContainer: {
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
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  button: {
    // FIX: Changed the background color to your app's main color.
    backgroundColor: "#2b8a3e",
    padding: 16,
    borderRadius: 8,
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
