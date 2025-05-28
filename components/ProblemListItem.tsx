// src/components/ProblemListItem.tsx
import { Problem, Task } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ProblemListItemProps {
  problem: Problem;
  allProblems: Problem[];
  allTasks: Task[];
  onPress: (problemId: string) => void;
  onDelete: (problemId: string) => void;
}

// --- Constants for Swipe Action (레퍼런스와 유사하게) ---
const TRASH_ICON_ONLY_SIZE = 24;
const CIRCULAR_BUTTON_PADDING = 10;
const CIRCULAR_BUTTON_DIAMETER =
  TRASH_ICON_ONLY_SIZE + CIRCULAR_BUTTON_PADDING * 2; // 44
// REVEAL_WIDTH는 삭제 버튼을 포함한 전체 노출 영역의 너비입니다.
// 레퍼런스에서는 CIRCULAR_BUTTON_DIAMETER * 1.5 (66)을 사용했습니다.
// 현재 ProblemListItem에서는 버튼 하나만 있으므로, 버튼 지름 + 양옆 여백 정도로 설정 가능합니다.
const REVEAL_WIDTH = CIRCULAR_BUTTON_DIAMETER + 20; // 예: 44 + 20 = 64
// SWIPE_THRESHOLD는 REVEAL_WIDTH의 일정 비율로 설정합니다.
// 레퍼런스에서는 REVEAL_WIDTH / 2.5 (REVEAL_WIDTH의 40%)를 사용했습니다.
const SWIPE_THRESHOLD = REVEAL_WIDTH / 2.5;
const VELOCITY_THRESHOLD_TO_OPEN = -500; // 레퍼런스와 동일한 값 사용

const ProblemListItem: React.FC<ProblemListItemProps> = ({
  problem,
  allProblems,
  allTasks,
  onPress,
  onDelete,
}) => {
  const parentProblem = problem.parentId
    ? allProblems.find((p) => p.id === problem.parentId)
    : null;

  const isTerminal =
    !problem.childProblemIds || problem.childProblemIds.length === 0;
  const subProblemCount = problem.childProblemIds?.length || 0;

  let associatedTaskCount = 0;
  if (isTerminal) {
    associatedTaskCount = allTasks.filter(
      (task) => task.problemId === problem.id
    ).length;
  }

  let metaInfo = "";
  if (parentProblem) {
    metaInfo += `${parentProblem.title} · `;
  } else {
    metaInfo += "최상위 문제 · ";
  }

  if (isTerminal) {
    metaInfo += `종점 문제 · Task ${associatedTaskCount}개`;
  } else {
    metaInfo += `하위 문제 ${subProblemCount}개`;
  }

  const translateX = useSharedValue(0);
  const isSwipedOpen = useSharedValue(false);

  const showDeleteConfirmation = () => {
    Alert.alert(
      "문제 삭제",
      `"${problem.title}" 문제를 정말 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          onPress: () => {
            translateX.value = withTiming(0);
            isSwipedOpen.value = false;
          },
          style: "cancel",
        },
        {
          text: "삭제",
          onPress: () => {
            onDelete(problem.id);
          },
          style: "destructive",
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          translateX.value = withTiming(0);
          isSwipedOpen.value = false;
        },
      }
    );
  };

  const handleDeletePress = () => {
    runOnJS(showDeleteConfirmation)();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      const newX = event.translationX;
      if (isSwipedOpen.value) {
        // 이미 열려있다면, 열린 위치(-REVEAL_WIDTH)에서부터의 변화를 적용
        translateX.value = Math.max(
          -REVEAL_WIDTH,
          Math.min(0, -REVEAL_WIDTH + newX)
        );
      } else {
        // 닫혀있다면, 0에서부터의 변화를 적용
        translateX.value = Math.max(-REVEAL_WIDTH, Math.min(0, newX));
      }
    })
    .onEnd((event) => {
      // --- 레퍼런스 코드의 onEnd 로직 적용 ---
      if (
        event.translationX < -SWIPE_THRESHOLD ||
        event.velocityX < VELOCITY_THRESHOLD_TO_OPEN
      ) {
        translateX.value = withTiming(-REVEAL_WIDTH);
        isSwipedOpen.value = true;
      } else {
        translateX.value = withTiming(0);
        isSwipedOpen.value = false;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleItemPress = () => {
    if (isSwipedOpen.value) {
      translateX.value = withTiming(0);
      isSwipedOpen.value = false;
    } else {
      onPress(problem.id);
    }
  };

  return (
    <View style={styles.swipeableOuterContainer}>
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          onPress={handleDeletePress}
          style={styles.deleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={TRASH_ICON_ONLY_SIZE}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.draggableCard, animatedStyle]}>
          <TouchableOpacity
            style={styles.itemContainerContent}
            onPress={handleItemPress}
            activeOpacity={1} // 스와이프 중 부모 터치 효과 방지
          >
            <View style={styles.infoContainer}>
              <Text
                style={styles.titleText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {problem.title}
              </Text>
              <Text
                style={styles.metaText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {metaInfo}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={22}
              color="#cccccc"
            />
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeableOuterContainer: {
    backgroundColor: "white",
    marginVertical: 6,
  },
  deleteActionContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: REVEAL_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: CIRCULAR_BUTTON_DIAMETER,
    height: CIRCULAR_BUTTON_DIAMETER,
    borderRadius: CIRCULAR_BUTTON_DIAMETER / 2,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  draggableCard: {
    backgroundColor: "white",
    // 스와이프 시 뒷 배경이 보이지 않도록 확실히 배경색 지정
  },
  itemContainerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 3,
  },
  metaText: {
    fontSize: 13,
    color: "#555555",
  },
});

export default ProblemListItem;
