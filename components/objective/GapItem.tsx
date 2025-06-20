// components/objective/GapItem.tsx

import { Gap, Problem } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * ObjectiveEdit 컴포넌트의 로컬 상태에서만 사용될 타입입니다.
 * 각 Gap은 하위에 자신에게 속한 Problem 목록을 직접 가집니다.
 */
export type LocalProblem = Partial<Problem> & { tempId: string };
export type LocalGap = Partial<Gap> & {
  tempId: string;
  problems: LocalProblem[];
};

/**
 * GapItem 컴포넌트가 부모로부터 받을 Props 타입입니다.
 */
interface GapItemProps {
  gap: LocalGap;
  onEditGap: (gapTempId: string) => void;
  onAddProblem: (gapTempId: string) => void;
}

/**
 * Dumb Component: Gap 개별 항목을 표시하는 역할만 담당합니다.
 * 상태 관리나 데이터 처리 로직을 갖지 않습니다.
 */
const GapItem = ({ gap, onEditGap, onAddProblem }: GapItemProps) => {
  return (
    // 길게 누르면 Gap 수정 모달이 열리도록 이벤트를 부모에게 전달합니다.
    <TouchableOpacity
      onLongPress={() => onEditGap(gap.tempId)}
      delayLongPress={200}
    >
      <View style={styles.gapItemContainer}>
        {/* Gap 제목 */}
        <Text style={styles.gapTitle}>{gap.title}</Text>

        {/* 현재 상태와 이상적인 상태 */}
        <View style={styles.gapDetailsRow}>
          <Text style={styles.gapStateText} numberOfLines={2}>
            현재: {gap.currentState}
          </Text>
          <Feather
            name="arrow-right"
            size={14}
            color="#adb5bd"
            style={styles.arrowIcon}
          />
          <Text
            style={[styles.gapStateText, styles.idealStateText]}
            numberOfLines={2}
          >
            이상: {gap.idealState}
          </Text>
        </View>

        {/* 이 Gap에 연결된 원인 문제들 */}
        <View style={styles.problemSection}>
          <Text style={styles.problemLabel}>원인 문제들</Text>
          {gap.problems && gap.problems.length > 0 ? (
            gap.problems.map((p) => (
              <Text key={p.tempId} style={styles.problemText}>
                - {p.title}
              </Text>
            ))
          ) : (
            <Text style={styles.problemPlaceholder}>
              아직 정의된 문제가 없습니다.
            </Text>
          )}
          {/* '+ 문제 정의하기' 버튼 클릭 시, 이벤트를 부모에게 전달합니다. */}
          <TouchableOpacity
            style={styles.addProblemButton}
            onPress={() => onAddProblem(gap.tempId)}
          >
            <Feather name="plus" size={16} color="#007AFF" />
            <Text style={styles.addProblemButtonText}>문제 정의하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default GapItem;

const styles = StyleSheet.create({
  gapItemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  gapTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  gapDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
  },
  gapStateText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    textAlign: "center",
  },
  idealStateText: {
    color: "#2b8a3e",
    fontWeight: "600",
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  problemSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  problemLabel: {
    fontSize: 13,
    color: "#868e96",
    marginBottom: 8,
    fontWeight: "500",
  },
  problemText: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
    paddingLeft: 4,
  },
  problemPlaceholder: {
    fontSize: 14,
    color: "#adb5bd",
    fontStyle: "italic",
  },
  addProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  addProblemButtonText: {
    color: "#007AFF",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
});
