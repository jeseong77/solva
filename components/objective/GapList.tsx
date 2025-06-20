// components/objective/GapList.tsx

import { useAppStore } from "@/store/store";
import { Gap, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { useShallow } from "zustand/react/shallow";

// --- 타입 정의 ---

interface GapListProps {
  objectiveId?: string;
  gaps: (Partial<Gap> & { tempId?: string })[];
  setGaps: React.Dispatch<React.SetStateAction<GapListProps["gaps"]>>;
  problems: (Partial<Problem> & { tempId?: string })[];
  setProblems: React.Dispatch<React.SetStateAction<GapListProps["problems"]>>;
}

// ✅ [수정] linkedProblems의 타입을 바로잡았습니다.
interface GapListItemProps {
  gap: Partial<Gap> & { tempId?: string };
  linkedProblems: (Partial<Problem> & { tempId?: string })[];
  onEdit: () => void;
  onAddProblem: () => void;
}

const GapListItem = ({
  gap,
  linkedProblems,
  onEdit,
  onAddProblem,
}: GapListItemProps) => {
  return (
    <TouchableOpacity onLongPress={onEdit} delayLongPress={200}>
      <View style={styles.gapItemContainer}>
        <Text style={styles.gapTitle}>{gap.title}</Text>
        <View style={styles.gapDetailsRow}>
          <Text style={styles.gapStateText} numberOfLines={2}>
            현재: {gap.currentState}
          </Text>
          <Feather
            name="arrow-right"
            size={14}
            color="#adb5bd"
            style={styles.arrowIcon}
          />
          <Text
            style={[styles.gapStateText, styles.idealStateText]}
            numberOfLines={2}
          >
            이상: {gap.idealState}
          </Text>
        </View>

        <View style={styles.problemSection}>
          <Text style={styles.problemLabel}>원인 문제들</Text>
          {linkedProblems.length > 0 ? (
            linkedProblems.map((p) => (
              <Text key={p.id || p.tempId} style={styles.problemText}>
                - {p.title}
              </Text>
            ))
          ) : (
            <Text style={styles.problemPlaceholder}>
              아직 정의된 문제가 없습니다.
            </Text>
          )}
          <TouchableOpacity
            style={styles.addProblemButton}
            onPress={onAddProblem}
          >
            <Feather name="plus" size={16} color="#007AFF" />
            <Text style={styles.addProblemButtonText}>문제 정의하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function GapList({
  objectiveId,
  gaps,
  setGaps,
  problems,
  setProblems,
}: GapListProps) {
  const { addGap, updateGap, addProblem, deleteGap } = useAppStore(
    useShallow((state) => ({
      addGap: state.addGap,
      updateGap: state.updateGap,
      addProblem: state.addProblem,
      deleteGap: state.deleteGap
    }))
  );

  // Gap 추가/수정 모달 상태
  const [isGapModalVisible, setGapModalVisible] = useState(false);
  const [editingGap, setEditingGap] = useState<
    (Partial<Gap> & { tempId?: string }) | null
  >(null);
  const [gapTitle, setGapTitle] = useState("");
  const [idealState, setIdealState] = useState("");
  const [currentState, setCurrentState] = useState("");

  // Problem 추가 모달 상태
  const [isProblemModalVisible, setProblemModalVisible] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [currentGapId, setCurrentGapId] = useState<string | null>(null);

  // --- Gap 모달 핸들러 ---
  const handleOpenAddGapModal = () => {
    setEditingGap(null);
    setGapTitle("");
    setIdealState("");
    setCurrentState("");
    setGapModalVisible(true);
  };

  const handleOpenEditGapModal = (
    gapToEdit: Partial<Gap> & { tempId?: string }
  ) => {
    setEditingGap(gapToEdit);
    setGapTitle(gapToEdit.title || "");
    setIdealState(gapToEdit.idealState || "");
    setCurrentState(gapToEdit.currentState || "");
    setGapModalVisible(true);
  };

  const handleCloseGapModal = () => {
    setGapModalVisible(false);
    setEditingGap(null);
  };

  const handleLongPressGap = (gap: Partial<Gap> & { tempId?: string }) => {
    Alert.alert(
      "Gap 관리", // Alert Title: "Manage Gap"
      `'${gap.title}'에 대한 작업을 선택하세요.`, // Alert Message: "Select an action for '[gap title]'"
      [
        {
          text: "수정하기", // "Edit" button
          onPress: () => handleOpenEditGapModal(gap), // Re-uses the existing function to open the modal
        },
        {
          text: "삭제하기", // "Delete" button
          onPress: () => {
            // Logic to delete the gap
            if (gap.id) {
              // If the gap has a real ID, it's saved in the database.
              // Use the store function to delete it everywhere.
              deleteGap(gap.id);
            } else if (gap.tempId) {
              // If it only has a tempId, it's a new, unsaved gap.
              // Just remove it from the local component state.
              setGaps((prev) => prev.filter((g) => g.tempId !== gap.tempId));
            }
          },
          style: "destructive", // This gives the button a red color on iOS for emphasis.
        },
        {
          text: "취소", // "Cancel" button
          style: "cancel",
        },
      ]
    );
  };

  const handleSaveGap = () => {
    if (!gapTitle.trim()) {
      Alert.alert("입력 필요", "Gap 이름을 입력해주세요.");
      return;
    }

    const gapData = {
      title: gapTitle.trim(),
      idealState: idealState.trim(),
      currentState: currentState.trim(),
    };

    if (editingGap) {
      setGaps((prev) =>
        prev.map((g) =>
          g.id === editingGap.id || g.tempId === editingGap.tempId
            ? { ...g, ...gapData }
            : g
        )
      );
    } else {
      const newGap = {
        tempId: `temp_gap_${Date.now()}`,
        ...gapData,
      };
      setGaps((prev) => [...prev, newGap]);
    }

    handleCloseGapModal();
  };

  // --- Problem 모달 핸들러 ---
  const handleOpenProblemModal = (gapId: string | undefined) => {
    if (!gapId) {
      Alert.alert("오류", "Gap 정보가 올바르지 않습니다.");
      return;
    }
    setCurrentGapId(gapId);
    setProblemTitle("");
    setProblemDescription("");
    setProblemModalVisible(true);
  };

  const handleCloseProblemModal = () => {
    setProblemModalVisible(false);
    setCurrentGapId(null);
  };

  const handleSaveProblem = () => {
    if (!problemTitle.trim()) {
      Alert.alert("입력 필요", "문제의 제목을 입력해주세요.");
      return;
    }
    if (!objectiveId) {
      Alert.alert(
        "오류",
        "먼저 목표를 저장해야 합니다. (개발자 참고: objectiveId 없음)"
      );
      return;
    }

    const newProblem = {
      tempId: `temp_problem_${Date.now()}`,
      title: problemTitle.trim(),
      description: problemDescription.trim(),
      objectiveId: objectiveId,
      gapId: currentGapId,
    };

    setProblems((prev) => [...prev, newProblem]);

    handleCloseProblemModal();
  };

  // --- 렌더링 ---
  return (
    <View>
      {gaps.map((gap) => {
        const linkedProblems = problems.filter(
          (p) => p.gapId && (p.gapId === gap.id || p.gapId === gap.tempId)
        );
        const id = gap.id || gap.tempId;

        return (
          <GapListItem
            key={id}
            gap={gap}
            linkedProblems={linkedProblems}
            onEdit={() => handleLongPressGap(gap)}
            onAddProblem={() => handleOpenProblemModal(id)}
          />
        );
      })}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenAddGapModal}
      >
        <Feather name="plus-circle" size={20} color="#2b8a3e" />
        <Text style={styles.addButtonText}>새로운 Gap 정의하기</Text>
      </TouchableOpacity>

      {/* Gap 추가/수정 모달 */}
      <Modal
        isVisible={isGapModalVisible}
        onBackdropPress={handleCloseGapModal}
        onBackButtonPress={handleCloseGapModal}
        avoidKeyboard
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGap ? "Gap 수정" : "새로운 Gap 정의"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Gap 이름 (예: 영어 실력)"
              value={gapTitle}
              onChangeText={setGapTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="이상적인 상태 (예: 원어민과 편하게 대화)"
              value={idealState}
              onChangeText={setIdealState}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="현재 상태 (예: 간단한 자기소개만 가능)"
              value={currentState}
              onChangeText={setCurrentState}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveGap}>
              <Text style={styles.saveButtonText}>
                {editingGap ? "변경사항 저장" : "Gap 추가"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Problem 추가 모달 */}
      <Modal
        isVisible={isProblemModalVisible}
        onBackdropPress={handleCloseProblemModal}
        onBackButtonPress={handleCloseProblemModal}
        avoidKeyboard
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새로운 문제 정의</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="문제 제목 (예: 어휘력 부족)"
              value={problemTitle}
              onChangeText={setProblemTitle}
            />
            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              placeholder="문제에 대한 간단한 설명 (선택 사항)"
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProblem}
            >
              <Text style={styles.saveButtonText}>문제 추가</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// 전체 스타일시트
const styles = StyleSheet.create({
  gapItemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  gapTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  gapDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
  },
  gapStateText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    textAlign: "center",
  },
  idealStateText: {
    color: "#2b8a3e",
    fontWeight: "600",
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  problemSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  problemLabel: {
    fontSize: 13,
    color: "#868e96",
    marginBottom: 8,
    fontWeight: "500",
  },
  problemText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
    paddingLeft: 4,
  },
  problemPlaceholder: {
    fontSize: 14,
    color: "#adb5bd",
    fontStyle: "italic",
  },
  addProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  addProblemButtonText: {
    color: "#007AFF",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#d8f5a2",
    backgroundColor: "#f4fce3",
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#2b8a3e",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#868e96",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#2b8a3e",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
