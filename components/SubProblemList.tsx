// src/components/SubProblemList.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  // FlatList, // 항목이 매우 많아질 경우 FlatList 고려 가능
} from "react-native";
import { Problem } from "@/types";
import { Ionicons } from "@expo/vector-icons";

// 버튼 스타일 정의 (기본, 비활성화)
const getButtonStyles = (isDisabled: boolean) => ({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: isDisabled ? "#ccc" : "#000", // 비활성화 시 테두리 색 변경
    alignItems: "center" as "center",
    marginVertical: 5,
    flexDirection: "row" as "row",
    justifyContent: "center" as "center",
    backgroundColor: isDisabled ? "#f5f5f5" : "#f0f0f0", // 비활성화 시 배경색 변경
    marginTop: 16,
    opacity: isDisabled ? 0.5 : 1, // 비활성화 시 투명도 조절
  },
  text: {
    color: isDisabled ? "#aaa" : "#000", // 비활성화 시 텍스트 색 변경
    fontSize: 16,
    marginLeft: 5,
  },
  icon: {
    color: isDisabled ? "#aaa" : "#000", // 비활성화 시 아이콘 색 변경
  }
});

interface SubProblemListProps {
  subProblems: Problem[];
  currentProblemId: string; // 새 하위 문제 추가 시 부모가 될 현재 문제의 ID (유효한 ID 또는 빈 문자열/null)
  isParentProblemSaved: boolean; // 부모 문제가 저장된 상태인지 여부 (버튼 활성화 제어용)
  onPressSubProblemItem: (problemId: string) => void;
  onPressAddSubProblem: (parentId: string) => void;
}

// 함수 선언 방식으로 변경 및 React.FC 제거
export default function SubProblemList({
  subProblems,
  currentProblemId,
  isParentProblemSaved, // 새로운 prop
  onPressSubProblemItem,
  onPressAddSubProblem,
}: SubProblemListProps) { // props 타입 명시

  const buttonCurrentStyles = getButtonStyles(!isParentProblemSaved); // isParentProblemSaved가 false면 disabled

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>하위 문제 (Sub-problems)</Text>
      {subProblems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>구성 문제들이 비어 있습니다.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {subProblems.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subProblemItem}
              onPress={() => onPressSubProblemItem(sub.id)}
            >
              <Text style={styles.subProblemTitle} numberOfLines={1} ellipsizeMode="tail">{sub.title}</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={buttonCurrentStyles.button}
        onPress={() => {
          if (isParentProblemSaved && currentProblemId) { // 유효한 currentProblemId도 확인
            onPressAddSubProblem(currentProblemId);
          }
        }}
        disabled={!isParentProblemSaved || !currentProblemId} // currentProblemId 유효성도 체크
      >
        <Ionicons name="add-outline" size={18} style={buttonCurrentStyles.icon} />
        <Text style={buttonCurrentStyles.text}>Add Sub-problem</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "gray",
    fontStyle: "italic",
  },
  list: {
    // 하위 문제 목록이 있을 경우
  },
  subProblemItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  subProblemTitle: {
    fontSize: 16,
    flex: 1,
  },
});