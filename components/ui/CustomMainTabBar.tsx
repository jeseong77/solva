// components/ui/CustomMainTabBar.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SceneRendererProps, NavigationState } from "react-native-tab-view";

// 컴포넌트가 받을 props의 타입을 정의합니다.
interface CustomMainTabBarProps extends SceneRendererProps {
  navigationState: NavigationState<{ key: string; title: string }>;
}

export default function CustomMainTabBar({
  navigationState,
  jumpTo,
}: CustomMainTabBarProps) {
  const { routes, index: activeIndex } = navigationState;

  return (
    <View style={styles.container}>
      {routes.map((route, i) => {
        const isActive = i === activeIndex;
        const textColor = isActive ? "#212529" : "#adb5bd";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => jumpTo(route.key)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, { color: textColor }]}>
              {route.title}
            </Text>
            <View
              style={[
                styles.tabIndicator,
                { backgroundColor: isActive ? "#212529" : "transparent" },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "none",
  },
  tabIndicator: {
    height: 3,
    // 너비를 텍스트 길이에 맞추려면 더 복잡한 계산이 필요하므로
    // 여기서는 버튼 전체 너비의 일부를 차지하도록 설정할 수 있습니다.
    // 혹은 고정 값으로 지정합니다.
    width: "40%", // 인디케이터 너비 예시
    marginTop: 4, // 텍스트와의 간격
  },
});
