// components/problem/ProblemEdit.tsx

// ... (all imports remain the same)
import { useAppStore } from "@/store/store";
import { Priority, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

// ... (priorityColors and FloatingToolbar components remain the same)
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};
interface FloatingToolbarProps {
  onSave: () => void;
  onPickImage: () => void;
  bottom: number;
}
const FloatingToolbar = React.memo(
  ({ onSave, onPickImage, bottom }: FloatingToolbarProps) => {
    const opacity = useSharedValue(0);
    useEffect(() => {
      opacity.value = withTiming(1, { duration: 250 });
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
      <Animated.View
        style={[styles.floatingContainer, { bottom }, animatedStyle]}
      >
        
        <View style={styles.floatingActionsWrapper}>
          
          <TouchableOpacity
            onPress={onPickImage}
            style={styles.floatingIconButton}
          >
            
            <Feather name="image" size={24} color="#495057" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.floatingSaveButton}>
          
          <Text style={styles.floatingSaveButtonText}>저장</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function ProblemEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const problemId = params.problemId as string | undefined;
  const objectiveId = params.objectiveId as string | undefined;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const focusDescriptionInput = () => descriptionInputRef.current?.focus();
  const { getProblemById, getObjectiveById, addProblem, updateProblem } =
    useAppStore(
      useShallow((state) => ({
        getProblemById: state.getProblemById,
        getObjectiveById: state.getObjectiveById,
        addProblem: state.addProblem,
        updateProblem: state.updateProblem,
      }))
    );
  const isEditMode = !!problemId;
  const problemToEdit = isEditMode ? getProblemById(problemId) : undefined;
  const finalObjectiveId = isEditMode
    ? problemToEdit?.objectiveId
    : objectiveId;
  const objectiveForProblem = finalObjectiveId
    ? getObjectiveById(finalObjectiveId)
    : undefined;

  useEffect(() => {
    if (isEditMode && problemToEdit) {
      setTitle(problemToEdit.title);
      setDescription(problemToEdit.description || "");
      setPriority(problemToEdit.priority);
      setImageUrls(problemToEdit.imageUrls || []);
    } else {
      setTitle("");
      setDescription("");
      setPriority("none");
      setImageUrls([]);
    }
  }, [problemId, problemToEdit, isEditMode]);
  useEffect(() => {
    const timer = setTimeout(() => titleInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const onKeyboardDidShow = (e: KeyboardEvent) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onKeyboardDidHide = () => setKeyboardHeight(0);
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

  const handlePickImages = async () => {
    const selectionLimit = 20 - imageUrls.length;
    if (selectionLimit <= 0) {
      Alert.alert("알림", "이미지는 최대 20개까지 추가할 수 있습니다.");
      return;
    }
    setIsPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit,
      });
      if (!result.canceled) {
        const newUris = result.assets.map((asset) => asset.uri);
        setImageUrls((prevUris) => [...prevUris, ...newUris]);
      }
    } catch (error) {
      console.error("Image picking error:", error);
      Alert.alert("오류", "이미지를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsPickingImage(false);
    }
  };
  const handleRemoveImage = (uriToRemove: string) => {
    setImageUrls((prevUris) => prevUris.filter((uri) => uri !== uriToRemove));
  };
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
        imageUrls,
      };
      await updateProblem(updatedProblem);
    } else if (finalObjectiveId) {
      await addProblem({
        objectiveId: finalObjectiveId,
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls,
      });
    }
    router.back();
  }, [
    title,
    description,
    priority,
    isEditMode,
    finalObjectiveId,
    problemToEdit,
    updateProblem,
    addProblem,
    router,
    imageUrls,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.metaText}>
            목표 → {objectiveForProblem?.title || "선택"}
          </Text>

          <TouchableOpacity
            style={styles.priorityContainer}
            onPress={handleChangePriority}
          >
            <Text style={styles.metaText}>우선순위: </Text>
            <View
              style={[
                styles.indicator,
                { backgroundColor: priorityColors[priority] },
              ]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.contentScrollView}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="무슨 문제가 있나요?"
            placeholderTextColor="#adb5bd"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            onSubmitEditing={focusDescriptionInput}
          />
          <TextInput
            ref={descriptionInputRef}
            style={styles.bodyInput}
            placeholder="이 문제에 대해 더 자세히 알려주세요"
            placeholderTextColor="#adb5bd"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {imageUrls.length > 0 && (
            <FlatList
              horizontal
              data={imageUrls}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={styles.imageList}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(item)}
                  >
                    <Feather name="x" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
          {isPickingImage && <ActivityIndicator style={{ marginTop: 20 }} />}
        </ScrollView>
      </SafeAreaView>

      {Platform.OS === "ios" && keyboardHeight > 0 && (
        <FloatingToolbar
          onSave={handleSave}
          onPickImage={handlePickImages}
          bottom={keyboardHeight}
        />
      )}
    </KeyboardAvoidingView>
  );
}

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
  // REMOVED: personaInfo style is no longer needed
  // ADD: New container for the priority elements
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#495057",
  },
  contentScrollView: { flex: 1 },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    paddingTop: 16,
    color: "#212529",
    lineHeight: 32,
    paddingHorizontal: 20,
  },
  bodyInput: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    color: "#343a40",
    textAlignVertical: "top",
    paddingHorizontal: 20,
  },
  floatingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  floatingActionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  floatingIconButton: {
    padding: 8,
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
  imageList: {
    paddingBottom: 16,
    maxHeight: 240, // Adjusted height for 3x4 ratio
  },
  imageContainer: {
    marginRight: 10,
    position: "relative",
  },
  image: {
    width: 180,
    height: 240, // Your new 3x4 aspect ratio
    borderRadius: 8,
    backgroundColor: "#f1f3f5",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
