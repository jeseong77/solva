import { StarReport } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import StarReportContent from "./StarReportContent"; // ✅ 새로 만든 컴포넌트 import

// 컴포넌트가 받을 Props 정의
interface StarReportPreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  reportData: Partial<StarReport>;
}

export default function StarReportPreviewModal({
  isVisible,
  onClose,
  reportData,
}: StarReportPreviewModalProps) {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="formSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>STAR 리포트 미리보기</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>

        {/* ✅ [수정] 리포트 내용 부분을 StarReportContent 컴포넌트로 교체 */}
        <StarReportContent reportData={reportData} />

        {/* 푸터 */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  closeButton: { position: "absolute", right: 16 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e9ecef",
    paddingBottom: 32,
  },
  confirmButton: {
    backgroundColor: "#212529",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
