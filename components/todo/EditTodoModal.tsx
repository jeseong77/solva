import React, { useEffect, useState, useCallback } from "react";
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

interface EditTodoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

export default function EditTodoModal({
  isVisible,
  onClose,
  onSave,
}: EditTodoModalProps) {
  const [content, setContent] = useState("");

  // 모달이 닫힐 때 내용 초기화
  useEffect(() => {
    if (!isVisible) {
      setContent("");
    }
  }, [isVisible]);

  // 저장 핸들러 (useCallback으로 최적화)
  const handleSave = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert("알림", "할 일을 입력해주세요.");
      return;
    }
    onSave(trimmedContent);
  }, [content, onSave]);

  return (
    <Modal
      visible={isVisible}
      transparent // ✅ 배경을 투명하게 설정
      animationType="slide" // ✅ 슬라이드 애니메이션
      onRequestClose={onClose}
    >
      {/* ✅ 모달 바깥 영역 터치 시 닫기 위한 Pressable 백드롭 */}
      <Pressable style={styles.modalBackdrop} onPress={onClose} />

      {/* ✅ 키보드를 피하는 뷰를 화면 하단에 위치 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.container}>
          <TextInput
            style={styles.textInput}
            placeholder="새로운 할 일을 입력하세요..."
            placeholderTextColor="#adb5bd"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />

          {/* ✅ 하단 컨트롤 영역 (저장 버튼만 위치) */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ✅ 참조 파일의 스타일을 기반으로 새롭게 작성된 스타일시트
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
  textInput: {
    minHeight: 90,
    maxHeight: 250,
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: "top",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "flex-end", // 버튼을 오른쪽으로 정렬
    alignItems: "center",
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#212529",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
