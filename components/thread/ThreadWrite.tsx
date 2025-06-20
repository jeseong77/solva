import { useAppStore } from "@/store/store";
import { ThreadItem, ThreadItemType } from "@/types";
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

const SELECTABLE_TYPES: Exclude<ThreadItemType, "Session">[] = [
  "General",
  "Bottleneck",
  "Task",
  "Action",
  "Insight",
];

const typeInfo: {
  [key in Exclude<ThreadItemType, "Session">]: { color: string; name: string };
} = {
  General: { color: "#4dabf7", name: "일반" },
  Bottleneck: { color: "#f76707", name: "병목" },
  Task: { color: "#2b8a3e", name: "할 일" },
  Action: { color: "#d9480f", name: "액션" },
  Insight: { color: "#845ef7", name: "인사이트" },
};

interface ThreadWriteProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string;
  parentThreadId?: string | null;
  threadToEditId?: string | null;
}

export default function ThreadWrite({
  isVisible,
  onClose,
  problemId,
  parentThreadId,
  threadToEditId,
}: ThreadWriteProps) {
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] =
    useState<Exclude<ThreadItemType, "Session">>("General");

  const { addThreadItem, getThreadItemById, updateThreadItem } = useAppStore(
    useShallow((state) => ({
      addThreadItem: state.addThreadItem,
      getThreadItemById: state.getThreadItemById,
      updateThreadItem: state.updateThreadItem,
    }))
  );

  const parentThread = parentThreadId
    ? getThreadItemById(parentThreadId)
    : null;

  const isEditMode = !!threadToEditId;

  useEffect(() => {
    if (isVisible) {
      if (isEditMode) {
        const threadToEdit = getThreadItemById(threadToEditId);
        if (threadToEdit && threadToEdit.type !== "Session") {
          setContent(threadToEdit.content);
          setSelectedType(threadToEdit.type);
        }
      } else {
        setContent("");
        setSelectedType("General");
      }
    }
  }, [isVisible, threadToEditId, getThreadItemById, isEditMode]);
  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("내용을 입력해주세요.");
      return;
    }

    if (isEditMode) {
      // --- 수정 모드 ---
      const originalThread = getThreadItemById(threadToEditId);
      if (!originalThread) {
        Alert.alert("오류", "수정할 스레드를 찾을 수 없습니다.");
        return;
      }

      // `selectedType`에 따라 완전한 새 객체를 생성합니다.
      let updatedThread: ThreadItem;

      // 공통 기본 속성을 정의합니다.
      const baseProperties = {
        ...originalThread,
        content: content.trim(),
        type: selectedType,
      };

      switch (selectedType) {
        case "General":
        case "Insight": // Insight also just uses base properties
          updatedThread = {
            ...baseProperties,
            type: selectedType,
          };
          break;
        case "Bottleneck":
          updatedThread = {
            ...baseProperties,
            type: "Bottleneck",
            // 타입이 변경되었을 경우를 대비해 기본값을 설정합니다.
            isResolved:
              originalThread.type === "Bottleneck"
                ? originalThread.isResolved
                : false,
          };
          break;
        case "Task":
          updatedThread = {
            ...baseProperties,
            type: "Task",
            // 타입이 변경되었을 경우를 대비해 기본값을 설정합니다.
            isCompleted:
              originalThread.type === "Task"
                ? originalThread.isCompleted
                : false,
          };
          break;
        case "Action":
          updatedThread = {
            ...baseProperties,
            type: "Action",
            // 타입이 변경되었을 경우를 대비해 기본값을 설정합니다.
            status:
              originalThread.type === "Action" ? originalThread.status : "todo",
            timeSpent:
              originalThread.type === "Action" ? originalThread.timeSpent : 0,
            deadline:
              originalThread.type === "Action" ? originalThread.deadline : null,
            completedAt:
              originalThread.type === "Action"
                ? originalThread.completedAt
                : null,
          };
          break;
        default:
          // Session 타입 등 다른 예외 케이스 처리
          console.error("Unsupported type for editing:", selectedType);
          return;
      }

      await updateThreadItem(updatedThread);
    } else {
      // --- 생성 모드 ---
      // FIX: Add all missing required properties with default values.
      await addThreadItem({
        problemId,
        parentId: parentThreadId || null,
        type: selectedType,
        content: content.trim(),
        isImportant: false,
        authorId: null,
        isResolved: null,
        isCompleted: null,
        status: null,
        timeSpent: null,
        deadline: null,
        completedAt: null,
        startTime: null,
      });
    }

    onClose();
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
          {parentThread && (
            <View style={styles.replyingToContainer}>
              <Feather name="corner-down-right" size={16} color="#868e96" />
              <Text style={styles.replyingToText} numberOfLines={1}>
                Replying to: {parentThread.content}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.textInput}
            placeholder={
              isEditMode
                ? "스레드 내용 수정..."
                : "새로운 스레드를 추가하세요..."
            }
            placeholderTextColor="#adb5bd"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />

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
              <Text style={styles.postButtonText}>
                {isEditMode ? "Update" : "Post"}
              </Text>
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
