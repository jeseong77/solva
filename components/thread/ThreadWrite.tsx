// app/components/thread/ThreadWrite.tsx

import { useAppStore } from "@/store/store";
import { ThreadItemType } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

// 선택 가능한 스레드 타입 (Session 제외)
const SELECTABLE_TYPES: Exclude<ThreadItemType, "Session">[] = [
  "General",
  "Bottleneck",
  "Task",
  "Action",
];

// 타입별 색상 및 이름 정의
const typeInfo: {
  [key in Exclude<ThreadItemType, "Session">]: { color: string; name: string };
} = {
  General: { color: "#4dabf7", name: "일반" },
  Bottleneck: { color: "#f76707", name: "병목" },
  Task: { color: "#2b8a3e", name: "할 일" },
  Action: { color: "#d9480f", name: "액션" },
};

// 컴포넌트가 받을 Props 정의
interface ThreadWriteProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string;
  parentThreadId?: string | null; // 답글을 달 대상 스레드 ID
}

export default function ThreadWrite({
  isVisible,
  onClose,
  problemId,
  parentThreadId,
}: ThreadWriteProps) {
  // 폼 내부 상태
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] =
    useState<Exclude<ThreadItemType, "Session">>("General");

  // 전역 스토어에서 필요한 액션과 함수 가져오기
  const { addThreadItem, getThreadItemById } = useAppStore(
    useShallow((state) => ({
      addThreadItem: state.addThreadItem,
      getThreadItemById: state.getThreadItemById,
    }))
  );

  // 답글 모드일 경우, 부모 스레드 정보 조회
  const parentThread = parentThreadId
    ? getThreadItemById(parentThreadId)
    : null;

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isVisible) {
      setContent("");
      setSelectedType("General");
    }
  }, [isVisible]);

  // 저장 핸들러
  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("내용을 입력해주세요.");
      return;
    }

    await addThreadItem({
      problemId,
      parentId: parentThreadId || null,
      type: selectedType,
      content: content.trim(),
    });

    onClose(); // 저장 후 모달 닫기
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.container}>
          {/* 답글 모드일 때만 표시되는 부모 스레드 정보 */}
          {parentThread && (
            <View style={styles.replyingToContainer}>
              <Feather name="corner-down-right" size={16} color="#868e96" />
              <Text style={styles.replyingToText} numberOfLines={1}>
                Replying to: {parentThread.content}
              </Text>
            </View>
          )}

          {/* 메인 텍스트 입력창 */}
          <TextInput
            style={styles.textInput}
            placeholder="새로운 스레드를 추가하세요..."
            placeholderTextColor="#adb5bd"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus // 모달이 열리면 바로 키보드 포커스
          />

          {/* 하단 컨트롤러: 타입 선택 및 Post 버튼 */}
          <View style={styles.bottomControls}>
            <View style={styles.typeSelector}>
              {SELECTABLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && {
                      backgroundColor: typeInfo[type].color,
                    },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type && { color: "#fff" },
                    ]}
                  >
                    {typeInfo[type].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.postButton} onPress={handleSave}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  keyboardAvoidingView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16, // iOS 하단 여백 추가
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: "#868e96",
    marginLeft: 8,
    flex: 1,
  },
  textInput: {
    minHeight: 80,
    maxHeight: 200,
    fontSize: 16,
    textAlignVertical: "top",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  typeSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f1f3f5",
    marginRight: 8,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#495057",
  },
  postButton: {
    backgroundColor: "#212529",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  postButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
