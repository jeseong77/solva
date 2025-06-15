import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  InputAccessoryView, // ✅ InputAccessoryView 임포트
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

interface AddTodoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

export default function AddTodoModal({
  isVisible,
  onClose,
  onSave,
}: AddTodoModalProps) {
  const [content, setContent] = useState("");
  const inputAccessoryViewID = "saveButtonAccessoryView"; // ✅ Accessory View ID 선언

  useEffect(() => {
    if (!isVisible) {
      setContent("");
    }
  }, [isVisible]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert("알림", "할 일을 입력해주세요.");
      return;
    }
    onSave(trimmedContent);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "formSheet" : undefined}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Feather name="x" size={24} color="#343a40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>새로운 할 일</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* 입력창 영역 */}
          <View style={styles.contentWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="새로운 할 일을 입력하세요..."
              placeholderTextColor="#adb5bd"
              value={content}
              onChangeText={setContent}
              autoFocus
              multiline
              // ✅ TextInput에 Accessory View ID 연결
              inputAccessoryViewID={inputAccessoryViewID}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ✅ 3. 키보드 위에 위치할 InputAccessoryView 정의 */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.accessoryContainer}>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.accessorySaveButton}
            >
              <Text style={styles.accessorySaveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
  },
  headerButton: {
    padding: 4,
    // ✅ width 속성 제거하여 아이콘 잘림 문제 해결
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  // ✅ InputAccessoryView 내부에 들어갈 스타일
  accessoryContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    padding: 12,
    // ✅ 버튼을 오른쪽으로 정렬하기 위한 스타일 추가
    alignItems: "flex-end",
  },
  accessorySaveButton: {
    backgroundColor: "#1971c2",
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
