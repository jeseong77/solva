import { useAppStore } from "@/store/store";
import { Priority, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#ffcdd2",
  medium: "#ffe0b2",
  low: "#c8e6c9",
  none: "#e9ecef",
};

// 컴포넌트가 받을 Props 정의
interface ProblemEditProps {
  isVisible: boolean; // 모달의 표시 여부
  onClose: () => void; // 모달을 닫는 함수
  problemId?: string; // 수정 모드일 때 전달받는 문제 ID
  personaId?: string; // 생성 모드일 때 전달받는 페르소나 ID
}

export default function ProblemEdit({
  isVisible,
  onClose,
  problemId,
  personaId,
}: ProblemEditProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const descriptionInputRef = useRef<TextInput>(null);

  const focusDescriptionInput = () => {
    descriptionInputRef.current?.focus();
  };

  // 1. 스토어에서는 데이터 탐색 로직이 아닌, 필요한 '도구'(함수)들만 가져옵니다.
  const { getProblemById, getPersonaById, addProblem, updateProblem } =
    useAppStore(
      useShallow((state) => ({
        getProblemById: state.getProblemById,
        getPersonaById: state.getPersonaById,
        addProblem: state.addProblem,
        updateProblem: state.updateProblem,
      }))
    );

  // 2. 가져온 함수들을 사용해 필요한 데이터를 조회합니다.
  // 이 로직은 렌더링 과정에서 실행되지만, 스토어의 상태가 바뀌지 않으면 재실행되지 않으므로 효율적입니다.
  const problemToEdit = problemId ? getProblemById(problemId) : undefined;

  const finalPersonaId = problemToEdit ? problemToEdit.personaId : personaId;
  const personaForProblem = finalPersonaId
    ? getPersonaById(finalPersonaId)
    : undefined;

  // 3. 모드가 변경될 때 (isVisible 또는 problemId) 폼 상태 초기화
  useEffect(() => {
    // 수정 모드일 경우, 기존 데이터로 폼을 채움
    if (problemId && problemToEdit) {
      setTitle(problemToEdit.title);
      setDescription(problemToEdit.description || "");
      setPriority(problemToEdit.priority);
    }
    // 생성 모드일 경우, 폼을 초기화
    else {
      setTitle("");
      setDescription("");
      setPriority("none");
    }
  }, [isVisible, problemId, problemToEdit]);

  // 4. 우선순위 변경 핸들러
  const handleChangePriority = () => {
    Alert.alert(
      "우선순위 변경",
      "이 문제의 우선순위를 선택하세요.",
      [
        { text: "High", onPress: () => setPriority("high") },
        { text: "Medium", onPress: () => setPriority("medium") },
        { text: "Low", onPress: () => setPriority("low") },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // 5. 저장 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }

    if (problemId && problemToEdit) {
      // 수정 모드
      const updatedProblem: Problem = {
        ...problemToEdit,
        title: title.trim(),
        description: description.trim(),
        priority,
      };
      await updateProblem(updatedProblem);
    } else if (personaId) {
      // 생성 모드
      await addProblem({
        personaId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
    }
    onClose(); // 저장 후 모달 닫기
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.flexContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={26} color="#343a40" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>

          {/* 서브헤더: 페르소나 정보, 우선순위 버튼 */}
          <View style={styles.subHeader}>
            <View style={styles.personaInfo}>
              <TouchableOpacity onPress={handleChangePriority}>
                <View
                  style={[
                    styles.indicator,
                    { backgroundColor: priorityColors[priority] },
                  ]}
                />
              </TouchableOpacity>

              <Text style={styles.metaText}>
                페르소나 → {personaForProblem?.title || "선택"}
              </Text>
            </View>
          </View>

          {/* 콘텐츠 영역 */}
          <ScrollView
            style={styles.contentScrollView}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.titleInput}
              placeholder="제목"
              placeholderTextColor="#adb5bd"
              value={title}
              onChangeText={setTitle}
            />
            <Pressable
              style={styles.bodyPressable}
              onPress={focusDescriptionInput}
            >
              <TextInput
                ref={descriptionInputRef}
                style={styles.bodyInput}
                placeholder="내용 (선택 사항)"
                placeholderTextColor="#adb5bd"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: "#212529",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  personaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#495057",
  },
  contentScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    height: 26,
    color: "#212529",
  },
  bodyPressable: {
    flex: 1,
    marginTop: 10,
    minHeight: 200, // 최소 터치 높이 확보
  },
  bodyInput: {
    fontSize: 17,
    color: "#343a40",
    textAlignVertical: "top",
  },
});
