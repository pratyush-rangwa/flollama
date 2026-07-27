import React from "react";
import { Pressable, PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
  children: React.ReactNode;
  className?: string;
  scaleTo?: number;
};

/**
 * Shared press-feedback primitive: scale down + opacity dip on press-in,
 * spring back on release. Every tappable surface in this app should go
 * through this instead of a bare Pressable/TouchableOpacity.
 */
export function AnimatedPressable({
  children,
  className,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      className={className}
      style={[animatedStyle, style as object]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 100 });
        opacity.value = withTiming(0.85, { duration: 100 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        opacity.value = withTiming(1, { duration: 150 });
        onPressOut?.(e);
      }}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
}
