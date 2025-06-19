// components/objective/GapList.tsx

import { useAppStore } from "@/store/store";
import { Gap } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Modal from "react-native-modal";
import { useShallow } from "zustand/react/shallow";

// ✅ [변경] onLongPress 핸들러를 props로 받도록 수정
const GapListItem = ({
  gap,
  objectiveId,
  onLongPress,
}: {
  gap: Partial<Gap>;
  objectiveId?: string;
  onLongPress: () => void;
}) => {
  const router = useRouter();
  const allProblems = useAppStore(useShallow((state) => state.problems));

  const linkedProblems = useMemo(() => {
    if (!gap.problemIds || gap.problemIds.length === 0) return [];
    return allProblems.filter((p) => gap.problemIds!.includes(p.id));
  }, [allProblems, gap.problemIds]);

  const handleAddProblem = () => {
    if (!objectiveId || !gap.id || gap.id.startsWith("temp_")) {
      Alert.alert(
        "알림",
        "먼저 목표와 Gap을 저장해야 문제를 추가할 수 있습니다."
      );
      return;
    }
    router.push({
      pathname: "/problem/create",
      params: { objectiveId, gapId: gap.id },
    });
  };

  return (
    // ✅ [변경] 길게 누르기 이벤트를 위해 TouchableOpacity로 감쌈
    <TouchableOpacity onLongPress={onLongPress} delayLongPress={200}>
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
              <Text key={p.id} style={styles.problemText}>
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
            onPress={handleAddProblem}
          >
            <Feather name="plus" size={16} color="#007AFF" />
            <Text style={styles.addProblemButtonText}>문제 정의하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface GapListProps {
  objectiveId?: string;
  gaps: Partial<Gap>[];
  setGaps: React.Dispatch<React.SetStateAction<Partial<Gap>[]>>;
}

export default function GapList({ objectiveId, gaps, setGaps }: GapListProps) {
  // ✅ [변경] updateGap 액션을 스토어에서 가져옵니다.
  const { addGap, updateGap } = useAppStore(
    useShallow((state) => ({
      addGap: state.addGap,
      updateGap: state.updateGap,
    }))
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [idealState, setIdealState] = useState("");
  const [currentState, setCurrentState] = useState("");
  // ✅ [추가] 현재 수정 중인 Gap 객체를 저장할 상태
  const [editingGap, setEditingGap] = useState<Partial<Gap> | null>(null);

  const handleOpenAddModal = () => {
    setEditingGap(null); // 수정 모드가 아님을 명시
    setTitle("");
    setIdealState("");
    setCurrentState("");
    setModalVisible(true);
  };

  // ✅ [추가] 수정 모달을 여는 핸들러
  const handleOpenEditModal = (gapToEdit: Partial<Gap>) => {
    setEditingGap(gapToEdit); // 수정할 Gap을 상태에 저장
    setTitle(gapToEdit.title || "");
    setIdealState(gapToEdit.idealState || "");
    setCurrentState(gapToEdit.currentState || "");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingGap(null); // 모달이 닫히면 수정 상태도 초기화
  };

  // ✅ [변경] handleAddGap -> handleSaveGap으로 변경하여 생성과 수정을 모두 처리
  const handleSaveGap = async () => {
    if (!title.trim() || !idealState.trim() || !currentState.trim()) {
      Alert.alert("입력 필요", "모든 필드를 입력해주세요.");
      return;
    }

    const gapData = {
      title: title.trim(),
      idealState: idealState.trim(),
      currentState: currentState.trim(),
    };

    // 수정 모드일 경우
    if (editingGap) {
      // 수정 모드에서는 로컬 상태를 직접 수정하지 않고, DB 업데이트 후 스토어를 통해 자동 반영됨
      await updateGap({ ...editingGap, ...gapData } as Gap);
    }
    // 생성 모드일 경우
    else {
      if (objectiveId) {
        // Objective가 DB에 저장된 경우
        await addGap({ objectiveId, ...gapData });
      } else {
        // Objective가 아직 저장되지 않은 경우 (로컬 상태만 업데이트)
        setGaps((prev) => [
          ...prev,
          { id: `temp_${Date.now()}`, problemIds: [], ...gapData },
        ]);
      }
    }

    handleCloseModal();
  };

  return (
    <View>
      {gaps.map((gap) => (
        <GapListItem
          key={gap.id}
          gap={gap}
          objectiveId={objectiveId}
          // ✅ [변경] onLongPress 핸들러 연결
          onLongPress={() => handleOpenEditModal(gap)}
        />
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
        <Feather name="plus-circle" size={20} color="#2b8a3e" />
        <Text style={styles.addButtonText}>새로운 Gap 정의하기</Text>
      </TouchableOpacity>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        avoidKeyboard
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            {/* ✅ [변경] 모달 제목을 동적으로 변경 */}
            <Text style={styles.modalTitle}>
              {editingGap ? "Gap 수정" : "새로운 Gap 정의"}
            </Text>
            <Text style={styles.modalDescription}>
              '이상'과 '현재'의 차이를 정의하여 해결할 문제를 명확히 합니다.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Gap 이름 (예: 영어 실력, 프로젝트 수익)"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="이상적인 상태 (예: 원어민과 편하게 대화)"
              value={idealState}
              onChangeText={setIdealState}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="현재 상태 (예: 간단한 자기소개만 가능)"
              value={currentState}
              onChangeText={setCurrentState}
              multiline
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveGap}>
              {/* ✅ [변경] 저장 버튼 텍스트를 동적으로 변경 */}
              <Text style={styles.saveButtonText}>
                {editingGap ? "변경사항 저장" : "Gap 추가"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ✅ [추가] 생략되었던 전체 스타일시트
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
    paddingBottom: 40, // 키보드와 관계없이 하단 여백 확보
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
