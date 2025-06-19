import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleProp, ViewStyle } from "react-native";

interface FloatingActionButtonProps {
  mode: "solva" | "todo";
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

// 각 모드에 따른 색상 정의
const BG_COLORS = {
  solva: "#40c057", // 녹색
  todo: "#212529", // 검은색
};

// 각 모드에 따른 아이콘 색상 정의
const ICON_COLORS = {
  solva: "#212529", // 검은색
  todo: "#ffffff", // 흰색
};

export default function FloatingActionButton({
  mode,
  onPress,
}: FloatingActionButtonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(mode === "solva" ? 0 : 1, { duration: 250 });
  }, [mode]);

  // 배경색을 변경하는 애니메이션 스타일 (기존과 동일)
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [BG_COLORS.solva, BG_COLORS.todo]
    );
    return {
      backgroundColor,
    };
  });

  // ✅ [수정] 'mode' 값에 따라 아이콘 색상을 직접 결정합니다.
  const iconColor = mode === "solva" ? ICON_COLORS.solva : ICON_COLORS.todo;

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        {/* ✅ [수정] 아이콘 색상을 직접 전달합니다. */}
        <Feather name="plus" size={28} color={iconColor} />
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
