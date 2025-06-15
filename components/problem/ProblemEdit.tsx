import { useAppStore } from "@/store/store";
import { Priority, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardEvent, // [수정] KeyboardEvent 타입을 react-native에서 직접 import 합니다.
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";


// Priority에 따른 색상 맵 (변경 없음)
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};

// 플로팅 저장 버튼 컴포넌트 (변경 없음)
interface FloatingSaveButtonProps {
  onSave: () => void;
  bottom: number;
}
const FloatingSaveButton = React.memo(
  ({ onSave, bottom }: FloatingSaveButtonProps) => {
    const opacity = useSharedValue(0);

    // 버튼이 나타날 때 애니메이션을 적용합니다.
    useEffect(() => {
      opacity.value = withTiming(1, { duration: 250 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });

    return (
      <Animated.View
        style={[styles.floatingContainer, { bottom }, animatedStyle]}
      >
        <TouchableOpacity onPress={onSave} style={styles.floatingSaveButton}>
          <Text style={styles.floatingSaveButtonText}>저장</Text>
        </TouchableOpacity>
      </Animated.View>
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    // [수정] e의 타입을 import한 KeyboardEvent로 명시합니다.
    const onKeyboardDidShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onKeyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      onKeyboardDidShow
    );
    const hideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardDidHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
          <View style={styles.contentContainer}>
            <TextInput
              ref={titleInputRef}
              style={styles.titleInput}
              placeholder="제목"
              placeholderTextColor="#adb5bd"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={focusDescriptionInput}
            />
            <TextInput
              ref={descriptionInputRef}
              style={styles.bodyInput}
              placeholder="내용 (선택 사항)"
              placeholderTextColor="#adb5bd"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* 새로운 플로팅 버튼 (변경 없음) */}
      {Platform.OS === "ios" && keyboardHeight > 0 && (
        <FloatingSaveButton onSave={handleSave} bottom={keyboardHeight} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: "#ffffff" },
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
  personaInfo: { flexDirection: "row", alignItems: "center" },
  indicator: { width: 16, height: 16, borderRadius: 12, marginRight: 12 },
  metaText: { fontSize: 14, color: "#495057" },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    paddingTop: 16,
    color: "#212529",
    lineHeight: 32,
  },
  bodyInput: {
    flex: 1,
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    color: "#343a40",
    textAlignVertical: "top",
  },
  // [수정] 플로팅 컨테이너 스타일 추가
  floatingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "flex-end",
  },
  floatingSaveButton: {
    backgroundColor: "#212529",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  floatingSaveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
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
