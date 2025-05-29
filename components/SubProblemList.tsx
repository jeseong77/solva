// src/components/SubProblemList.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Problem } from "@/types";
import { Ionicons } from "@expo/vector-icons";

// HomeScreen 등에서 사용된 버튼 스타일 (재사용 또는 props로 전달 가능)
const basicButtonStyle = {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderWidth: 1,
  borderColor: "#000",
  alignItems: "center" as "center",
  marginVertical: 5,
  flexDirection: "row" as "row",
  justifyContent: "center" as "center",
  backgroundColor: "#f0f0f0", // 기본 버튼 배경색
  marginTop: 16,
};
const basicButtonTextStyle = {
  color: "#000",
  fontSize: 16,
  marginLeft: 5, // 아이콘과 텍스트 간격
};

interface SubProblemListProps {
  subProblems: Problem[]; // 현재 문제의 하위 문제 객체 배열
  currentProblemId: string; // 새 하위 문제 추가 시 부모가 될 현재 문제의 ID
  onPressSubProblemItem: (problemId: string) => void; // 목록의 하위 문제 항목 클릭 시
  onPressAddSubProblem: (parentId: string) => void; // "Add Sub-problem" 버튼 클릭 시
}

const SubProblemList: React.FC<SubProblemListProps> = ({
  subProblems,
  currentProblemId,
  onPressSubProblemItem,
  onPressAddSubProblem,
}) => {
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
              <Text
                style={styles.subProblemTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {sub.title}
              </Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={basicButtonStyle}
        onPress={() => onPressAddSubProblem(currentProblemId)}
      >
        <Ionicons name="add-outline" size={18} color="#000" />
        <Text style={basicButtonTextStyle}>Add Sub-problem</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // ProblemEditorScreen의 <View style={styles.section}> 스타일과 유사하게
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subProblemTitle: {
    fontSize: 16,
    flex: 1, // 제목이 길 경우 말줄임표 처리를 위해
  },
});

export default SubProblemList;
