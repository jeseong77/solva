// components/objective/GapList.tsx

import { useAppStore } from "@/store/store";
import { Gap } from "@/types";
import { Feather } from "@expo/vector-icons";
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

// 개별 Gap 아이템을 표시하는 컴포넌트
const GapListItem = ({ gap }: { gap: Gap }) => {
  return (
    <View style={styles.gapItemContainer}>
      <Text style={styles.gapTitle}>{gap.title}</Text>
      <View style={styles.gapDetailsRow}>
        <View style={styles.gapDetailBox}>
          <Text style={styles.gapDetailLabel}>이상 (Ideal)</Text>
          <Text style={styles.gapDetailValue}>{gap.idealState}</Text>
        </View>
        <View style={styles.gapDetailBox}>
          <Text style={styles.gapDetailLabel}>현실 (Reality)</Text>
          <Text style={styles.gapDetailValue}>{gap.currentState}</Text>
        </View>
      </View>
    </View>
  );
};

// GapList 컴포넌트 Props 정의
interface GapListProps {
  objectiveId: string;
}

export default function GapList({ objectiveId }: GapListProps) {
  // ✅ [수정] 스토어에서는 필터링되지 않은 전체 'gaps' 배열을 가져옵니다.
  const { allGaps, addGap } = useAppStore(
    useShallow((state) => ({
      allGaps: state.gaps, // state.gaps 전체를 가져옴
      addGap: state.addGap,
    }))
  );

  // ✅ [추가] useMemo를 사용하여 필요한 경우에만 필터링을 수행합니다.
  const gaps = useMemo(
    () => allGaps.filter((g) => g.objectiveId === objectiveId),
    [allGaps, objectiveId] // allGaps나 objectiveId가 바뀔 때만 다시 계산됨
  );
  // 모달 및 입력 필드 상태 관리
  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [idealState, setIdealState] = useState("");
  const [currentState, setCurrentState] = useState("");

  const handleOpenModal = () => {
    // 모달을 열 때 필드 초기화
    setTitle("");
    setIdealState("");
    setCurrentState("");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleAddGap = async () => {
    if (!title.trim() || !idealState.trim() || !currentState.trim()) {
      Alert.alert("입력 필요", "모든 필드를 입력해주세요.");
      return;
    }

    const newGap = await addGap({
      objectiveId,
      title: title.trim(),
      idealState: idealState.trim(),
      currentState: currentState.trim(),
    });

    if (newGap) {
      console.log("새로운 Gap이 추가되었습니다:", newGap.title);
      handleCloseModal();
    } else {
      Alert.alert("오류", "Gap을 추가하는 데 실패했습니다.");
    }
  };

  return (
    <View>
      {gaps.map((gap) => (
        <GapListItem key={gap.id} gap={gap} />
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleOpenModal}>
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
            <Text style={styles.modalTitle}>새로운 Gap 정의</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Gap 이름 (예: 독서량, 개발 실력)"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="이상적인 상태 (예: 한 달에 3권 읽기)"
              value={idealState}
              onChangeText={setIdealState}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="현재 상태 (예: 한 달에 1권 겨우 읽음)"
              value={currentState}
              onChangeText={setCurrentState}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddGap}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Gap 리스트 아이템 스타일
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
    justifyContent: "space-between",
  },
  gapDetailBox: {
    flex: 1,
  },
  gapDetailLabel: {
    fontSize: 12,
    color: "#868e96",
    marginBottom: 4,
  },
  gapDetailValue: {
    fontSize: 14,
    color: "#495057",
  },
  // 추가 버튼 스타일
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
  // 모달 스타일
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
