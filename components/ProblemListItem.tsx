// src/components/ProblemListItem.tsx
import React from "react"; // React import 추가
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Problem, Task, Project } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

interface ProblemListItemProps {
  problem: Problem;
  allProblems: Problem[];
  allProjects: Project[];
  allTasks: Task[];
  onPress: (problemId: string) => void;
  onDelete: (problemId: string) => void;
}

const TRASH_ICON_ONLY_SIZE = 24;
const CIRCULAR_BUTTON_PADDING = 10;
const CIRCULAR_BUTTON_DIAMETER =
  TRASH_ICON_ONLY_SIZE + CIRCULAR_BUTTON_PADDING * 2;
const REVEAL_WIDTH = CIRCULAR_BUTTON_DIAMETER + 20;
const SWIPE_THRESHOLD = REVEAL_WIDTH / 2.5;
const VELOCITY_THRESHOLD_TO_OPEN = -500;

// 함수 선언 방식으로 변경 및 export default 사용
export default function ProblemListItem({
  problem,
  allProblems,
  allProjects,
  allTasks,
  onPress,
  onDelete,
}: ProblemListItemProps) {
  // props 타입 명시
  const parentProblem = problem.parentId
    ? allProblems.find((p) => p.id === problem.parentId)
    : null;

  const isTerminal =
    !problem.childProblemIds || problem.childProblemIds.length === 0;
  const subProblemCount = problem.childProblemIds?.length || 0;

  let associatedTaskCount = 0;
  if (isTerminal && problem.projectId) {
    const projectForThisProblem = allProjects.find(
      (proj) => proj.id === problem.projectId
    );
    if (projectForThisProblem) {
      associatedTaskCount = allTasks.filter(
        (task) => task.projectId === projectForThisProblem.id
      ).length;
    }
  }

  let metaInfo = "";
  if (parentProblem) {
    metaInfo += `${parentProblem.title} · `;
  } else {
    metaInfo += "최상위 문제 · ";
  }

  if (isTerminal) {
    if (problem.projectId) {
      metaInfo += `해결 진행 중 (Project) · Task ${associatedTaskCount}개`;
    } else {
      metaInfo += `종점 문제 (해결 방법 필요)`;
    }
  } else {
    metaInfo += `하위 문제 ${subProblemCount}개`;
  }

  const translateX = useSharedValue(0);
  const isSwipedOpen = useSharedValue(false);

  const handleDeletePress = () => {
    onDelete(problem.id);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      const newX = event.translationX;
      if (isSwipedOpen.value) {
        translateX.value = Math.max(
          -REVEAL_WIDTH,
          Math.min(0, -REVEAL_WIDTH + newX)
        );
      } else {
        translateX.value = Math.max(-REVEAL_WIDTH, Math.min(0, newX));
      }
    })
    .onEnd((event) => {
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
            activeOpacity={1}
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
}

const styles = StyleSheet.create({
  swipeableOuterContainer: {
    backgroundColor: "white",
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
  },
  itemContainerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
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

// export default ProblemListItem; // 기존 export 방식은 제거
