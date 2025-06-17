import { useAppStore } from "@/store/store";
import { Priority, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
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
import { useLocalSearchParams, useRouter } from "expo-router"; // ✅ Expo Router 훅 임포트

// ... (priorityColors, FloatingSaveButton 컴포넌트는 변경 없이 그대로 둡니다)
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};

interface FloatingSaveButtonProps {
  onSave: () => void;
  bottom: number;
}
const FloatingSaveButton = React.memo(
  ({ onSave, bottom }: FloatingSaveButtonProps) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withTiming(1, { duration: 250 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

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

// ❌ 더 이상 Props를 받지 않으므로 interface를 제거합니다.
// interface ProblemEditProps { ... }

export default function ProblemEdit() {
  const router = useRouter();
  // ✅ URL에서 problemId와 personaId를 가져옵니다.
  const params = useLocalSearchParams();
  const problemId = params.problemId as string | undefined;
  const personaId = params.personaId as string | undefined;

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

  // ✅ problemId의 존재 여부로 수정 모드/생성 모드를 구분합니다.
  const isEditMode = !!problemId;
  const problemToEdit = isEditMode ? getProblemById(problemId) : undefined;

  // ✅ 생성 모드일 경우 personaId를 URL params에서, 수정 모드일 경우 기존 problem에서 가져옵니다.
  const finalPersonaId = isEditMode ? problemToEdit?.personaId : personaId;
  const personaForProblem = finalPersonaId
    ? getPersonaById(finalPersonaId)
    : undefined;

  // ✅ isVisible 대신 problemId를 기준으로 데이터 로딩 로직을 변경합니다.
  useEffect(() => {
    if (isEditMode && problemToEdit) {
      setTitle(problemToEdit.title);
      setDescription(problemToEdit.description || "");
      setPriority(problemToEdit.priority);
    } else {
      setTitle("");
      setDescription("");
      setPriority("none");
    }
  }, [problemId, problemToEdit, isEditMode]);

  // ✅ isVisible 대신 컴포넌트 마운트 시 한 번만 실행되도록 변경합니다.
  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ✅ 키보드 리스너는 그대로 유지합니다. 페이지에서도 잘 동작합니다.
  useEffect(() => {
    if (Platform.OS !== "ios") return;

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

    if (isEditMode && problemToEdit) {
      const updatedProblem: Problem = {
        ...problemToEdit,
        title: title.trim(),
        description: description.trim(),
        priority,
      };
      await updateProblem(updatedProblem);
    } else if (finalPersonaId) {
      await addProblem({
        personaId: finalPersonaId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
    }
    // ✅ onClose() 대신 router.back()으로 이전 화면으로 돌아갑니다.
    router.back();
  }, [
    title,
    description,
    priority,
    isEditMode,
    finalPersonaId,
    problemToEdit,
    updateProblem,
    addProblem,
    router,
  ]);

  // ❌ <Modal>을 제거하고, <KeyboardAvoidingView>가 최상위 컴포넌트가 됩니다.
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          {/* ✅ onClose 대신 router.back()으로 변경 */}
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
          {/* ✅ 저장 버튼은 플로팅 버튼으로 대체되었으므로 헤더에서 제거합니다. */}
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

      {/* ✅ 플로팅 저장 버튼은 모달이 아니어도 잘 동작하므로 그대로 둡니다. */}
      {Platform.OS === "ios" && keyboardHeight > 0 && (
        <FloatingSaveButton onSave={handleSave} bottom={keyboardHeight} />
      )}
    </KeyboardAvoidingView>
  );
}

// ✅ 스타일 이름 명확화 및 기존 스타일 유지
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
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
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
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
});
