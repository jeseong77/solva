import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleProp, ViewStyle } from "react-native"; // ✅ 타입 import 추가

interface FloatingActionButtonProps {
  mode: "solva" | "todo";
  onPress: () => void;
  style?: StyleProp<ViewStyle>; // ✅ [추가] 부모로부터 스타일을 받기 위한 prop
}

// 각 모드에 따른 색상 정의
const COLORS = {
  solva: "#1971c2", // 파란색
  todo: "#212529", // 검은색
};

export default function FloatingActionButton({
  mode,
  onPress,
}: FloatingActionButtonProps) {
  // 1. 애니메이션을 위한 공유 값 생성 (0: solva, 1: todo)
  const progress = useSharedValue(0);

  // 3. 'mode' prop이 변경될 때마다 애니메이션 트리거
  useEffect(() => {
    progress.value = withTiming(mode === "solva" ? 0 : 1, { duration: 250 });
  }, [mode]);

  // 4. 공유 값(progress)의 변화에 따라 배경색을 부드럽게 변경하는 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1], // 입력 범위: 0에서 1로
      [COLORS.solva, COLORS.todo] // 출력 색상: 파란색에서 검은색으로
    );
    return {
      backgroundColor,
    };
  });

  return (
    <Pressable
      onPress={onPress}
    >
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <Feather name="plus" size={28} color="#ffffff" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    // 그림자 효과 (iOS & Android)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
