import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface InteractivePressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleTo?: number;
  hapticType?: Haptics.ImpactFeedbackStyle;
  containerStyle?: ViewStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function InteractivePressable({
  children,
  scaleTo = 0.98,
  hapticType = Haptics.ImpactFeedbackStyle.Light,
  onPress,
  style,
  containerStyle,
  ...props
}: InteractivePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleTo, { damping: 14, stiffness: 260 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handlePress = (event: any) => {
    if (hapticType) {
      Haptics.impactAsync(hapticType);
    }
    onPress?.(event);
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}
