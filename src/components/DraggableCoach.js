import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, Image, StyleSheet, Dimensions, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const ICON_SIZE = 64;

export default function DraggableCoach({ onPress }) {
  const { colors: C } = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: 20, y: height - 300 })).current;

  const BOUNDARY = {
    top: 100,
    bottom: height - 160,
    left: 10,
    right: width - ICON_SIZE - 10,
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        let newX = pan.x._value;
        let newY = pan.y._value;
        if (newX < BOUNDARY.left) newX = BOUNDARY.left;
        if (newX > BOUNDARY.right) newX = BOUNDARY.right;
        if (newY < BOUNDARY.top) newY = BOUNDARY.top;
        if (newY > BOUNDARY.bottom) newY = BOUNDARY.bottom;
        newX = newX < width / 2 ? BOUNDARY.left : BOUNDARY.right;
        Animated.spring(pan, { toValue: { x: newX, y: newY }, useNativeDriver: false, friction: 6, tension: 40 }).start();
      },
    })
  ).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={[pan.getLayout(), { position: 'absolute', zIndex: 9999 }]}>
      <Pressable onPress={onPress} style={[s.button, { shadowColor: C.primary, backgroundColor: C.card }]}>
        <Image source={require("../../assets/coach.png")} style={[s.image, { borderColor: C.primary }]} />
        <View style={[s.badge, { borderColor: C.card }]} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  button: {
    width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  image: { width: ICON_SIZE - 4, height: ICON_SIZE - 4, borderRadius: (ICON_SIZE - 4) / 2, borderWidth: 2 },
  badge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2 },
});
