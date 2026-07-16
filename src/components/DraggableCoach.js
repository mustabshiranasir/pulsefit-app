import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, Image, StyleSheet, Dimensions, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const ICON_SIZE = 64;
const BOUNDARY = {
  top: 100,
  bottom: height - 160,
  left: 10,
  right: width - ICON_SIZE - 10,
};

export default function DraggableCoach({ onPress }) {
  // Start from the bottom-left roughly as shown in the screenshot
  const pan = useRef(new Animated.ValueXY({ x: 20, y: height - 300 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        // Only start dragging if the user moves a bit, so taps are registered
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();

        // Snap to boundaries
        let newX = pan.x._value;
        let newY = pan.y._value;

        if (newX < BOUNDARY.left) newX = BOUNDARY.left;
        if (newX > BOUNDARY.right) newX = BOUNDARY.right;
        if (newY < BOUNDARY.top) newY = BOUNDARY.top;
        if (newY > BOUNDARY.bottom) newY = BOUNDARY.bottom;

        // Snap to left or right edge
        if (newX < width / 2) {
          newX = BOUNDARY.left;
        } else {
          newX = BOUNDARY.right;
        }

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 6,
          tension: 40
        }).start();
      }
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        pan.getLayout(),
        styles.container
      ]}
    >
      <Pressable onPress={onPress} style={styles.button}>
        <Image 
          source={require("../../assets/coach.png")} 
          style={styles.image} 
        />
        <View style={styles.badge} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8607A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  image: {
    width: ICON_SIZE - 4,
    height: ICON_SIZE - 4,
    borderRadius: (ICON_SIZE - 4) / 2,
    borderWidth: 2,
    borderColor: '#E8607A',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  }
});
