import { useAppStore } from "@/store/store";
import { Priority, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  high: "#e57373", // 연한 빨강 -> 진한 빨강 계열
  medium: "#ffb74d", // 연한 주황 -> 진한 주황 계열
  low: "#81c784", // 연한 녹색 -> 진한 녹색 계열
  none: "#bdbdbd", // 연한 회색 -> 진한 회색 계열
};

// Define an interface for the component's props
interface SaveButtonAccessoryViewProps {
  nativeID: string;
  onSave: () => void;
}

// Apply the interface to the component's props
const SaveButtonAccessoryView = React.memo(
  ({ nativeID, onSave }: SaveButtonAccessoryViewProps) => {
    return (
      <InputAccessoryView nativeID={nativeID}>
        <View style={styles.accessoryContainer}>
          <TouchableOpacity onPress={onSave} style={styles.accessorySaveButton}>
            <Text style={styles.accessorySaveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    );
  }
);

interface ProblemEditProps {
  isVisible: boolean;
  onClose: () => void;
  problemId?: string;
  personaId?: string;
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

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const inputAccessoryViewID = "saveButtonAccessoryView";

  // 내용(description) 입력창으로 포커스를 옮기는 함수
  const focusDescriptionInput = () => {
    descriptionInputRef.current?.focus();
  };

  const { getProblemById, getPersonaById, addProblem, updateProblem } =
    useAppStore(
      useShallow((state) => ({
        getProblemById: state.getProblemById,
        getPersonaById: state.getPersonaById,
        addProblem: state.addProblem,
        updateProblem: state.updateProblem,
      }))
    );

  const problemToEdit = problemId ? getProblemById(problemId) : undefined;
  const finalPersonaId = problemToEdit ? problemToEdit.personaId : personaId;
  const personaForProblem = finalPersonaId
    ? getPersonaById(finalPersonaId)
    : undefined;

  // 폼 상태 초기화 로직
  useEffect(() => {
    if (isVisible) {
      if (problemId && problemToEdit) {
        setTitle(problemToEdit.title);
        setDescription(problemToEdit.description || "");
        setPriority(problemToEdit.priority);
      } else {
        setTitle("");
        setDescription("");
        setPriority("none");
      }
    }
  }, [isVisible, problemId, problemToEdit]);

  // 모달이 활성화될 때 제목 입력창에 자동으로 포커스를 주는 로직
  useEffect(() => {
    if (isVisible) {
      // formSheet 애니메이션이 끝난 후 포커스를 주기 위해 약간의 딜레이를 줍니다.
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer); // 컴포넌트 unmount 시 타이머 정리
    }
  }, [isVisible]);

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

  // handleSave 함수를 useCallback으로 감싸서 불필요한 재생성 방지
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }

    if (problemId && problemToEdit) {
      const updatedProblem: Problem = {
        ...problemToEdit,
        title: title.trim(),
        description: description.trim(),
        priority,
      };
      await updateProblem(updatedProblem);
    } else if (personaId) {
      await addProblem({
        personaId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
    }
    onClose();
  }, [
    title,
    description,
    priority,
    problemId,
    personaId,
    problemToEdit,
    updateProblem,
    addProblem,
    onClose,
  ]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={"formSheet"}
    >
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
            <View style={{ width: 26 }} />
          </View>
          {/* 서브헤더 */}
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
              ref={titleInputRef}
              style={styles.titleInput}
              placeholder="제목"
              placeholderTextColor="#adb5bd"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={focusDescriptionInput}
              inputAccessoryViewID={inputAccessoryViewID}
            />
            <TextInput
              ref={descriptionInputRef}
              style={styles.bodyInput}
              placeholder="내용 (선택 사항)"
              placeholderTextColor="#adb5bd"
              value={description}
              onChangeText={setDescription}
              multiline
              inputAccessoryViewID={inputAccessoryViewID}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* 분리된 메모이즈 컴포넌트 사용 */}
      {Platform.OS === "ios" && (
        <SaveButtonAccessoryView
          nativeID={inputAccessoryViewID}
          onSave={handleSave}
        />
      )}
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
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 4,
  },
  personaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 12,
    marginRight: 12,
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
    paddingTop: 16,
    color: "#212529",
    lineHeight: 32,
  },
  bodyInput: {
    flex: 1,
    minHeight: 200,
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    color: "#343a40",
    textAlignVertical: "top",
  },
  accessoryContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    padding: 12,
    alignItems: "flex-end",
  },
  accessorySaveButton: {
    backgroundColor: "#212529",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  accessorySaveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
