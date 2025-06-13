import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// 컴포넌트가 받을 Props 정의
interface LogSessionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (durationInSeconds: number, description: string) => void;
}

export default function LogSessionModal({
  isVisible,
  onClose,
  onSave,
}: LogSessionModalProps) {
  // 입력 폼을 위한 상태
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");

  // 모달이 닫힐 때 상태를 초기화하는 효과
  useEffect(() => {
    if (!isVisible) {
      setHours("");
      setMinutes("");
      setDescription("");
    }
  }, [isVisible]);

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    const hoursNum = parseInt(hours, 10) || 0;
    const minutesNum = parseInt(minutes, 10) || 0;

    if (hoursNum < 0 || minutesNum < 0 || minutesNum >= 60) {
      Alert.alert("입력 오류", "시간과 분을 올바르게 입력해주세요.");
      return;
    }

    const totalDurationInSeconds = hoursNum * 3600 + minutesNum * 60;

    if (totalDurationInSeconds <= 0) {
      Alert.alert("입력 오류", "세션 시간은 0보다 커야 합니다.");
      return;
    }

    onSave(totalDurationInSeconds, description.trim());
    onClose(); // 저장 후 모달 닫기
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* 반투명한 배경 (Backdrop) */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* 키보드가 UI를 가리지 않도록 설정 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.sheetContainer}>
          <SafeAreaView>
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#343a40" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>놓친 세션 기록</Text>
            </View>

            {/* 콘텐츠 입력 영역 */}
            <View style={styles.content}>
              <Text style={styles.label}>얼마나 작업하셨나요?</Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={hours}
                  onChangeText={setHours}
                  maxLength={2}
                />
                <Text style={styles.timeLabel}>시간</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="30"
                  keyboardType="number-pad"
                  value={minutes}
                  onChangeText={setMinutes}
                  maxLength={2}
                />
                <Text style={styles.timeLabel}>분</Text>
              </View>

              <Text style={styles.label}>어떤 작업을 하셨나요? (선택)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="예: 코딩 테스트 5문제 풀이"
                placeholderTextColor="#adb5bd"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* 푸터 (저장 버튼) */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>기록 저장하기</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  keyboardAvoidingView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    left: 16,
    padding: 4,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  timeInput: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    width: 60,
  },
  timeLabel: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  descriptionInput: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  saveButton: {
    backgroundColor: "#1971c2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
