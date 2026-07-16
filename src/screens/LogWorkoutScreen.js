import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, Image, Pressable, Alert, Platform, StatusBar, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { addWorkoutStat } from "../storage/fitnessStorage";

const MOCK_EXERCISES = [
  { id: "e1", title: "Jumping Jacks", duration: 30, image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg" },
  { id: "e2", title: "Squats", duration: 45, image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg" },
  { id: "e3", title: "Push Ups", duration: 30, image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg" },
  { id: "e4", title: "Plank", duration: 60, image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg" },
];

export default function LogWorkoutScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const { height } = useWindowDimensions();
  const { workout } = route.params || { workout: { title: "Workout" } };
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_EXERCISES[0].duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNext();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleNext = () => {
    if (currentExIndex < MOCK_EXERCISES.length - 1) {
      const nextIdx = currentExIndex + 1;
      setCurrentExIndex(nextIdx);
      setTimeLeft(MOCK_EXERCISES[nextIdx].duration);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    const mockKcal = Math.floor(Math.random() * 50) + 100;
    const mockMins = Math.floor(MOCK_EXERCISES.reduce((acc, curr) => acc + curr.duration, 0) / 60);
    
    await addWorkoutStat(mockKcal, mockMins);
    
    Alert.alert(
      "Workout Complete! 🎉",
      `Amazing work! You burned ${mockKcal} kcal in ${mockMins} minutes.`,
      [{ text: "View Results", onPress: () => navigation.navigate("MainTabs", { screen: "Progress" }) }]
    );
  };

  const currentEx = MOCK_EXERCISES[currentExIndex];
  const totalProgress = (currentExIndex + 1) / MOCK_EXERCISES.length;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const styles = makeStyles(C, height);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Navigation */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={C.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{workout.title}</Text>
            <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTxt}>LIVE TRACKER</Text>
            </View>
        </View>
        <Pressable style={styles.closeBtn}>
          <Ionicons name="settings-outline" size={20} color={C.text} />
        </Pressable>
      </View>

      <View style={styles.mainContent}>
        {/* Progress Dots */}
        <View style={styles.progressDots}>
            {MOCK_EXERCISES.map((_, i) => (
                <View 
                    key={i} 
                    style={[
                        styles.dot, 
                        i < currentExIndex && styles.dotDone,
                        i === currentExIndex && styles.dotActive
                    ]} 
                />
            ))}
        </View>

        {/* Exercise Card */}
        <View style={styles.imageCard}>
            <Image source={{ uri: currentEx.image }} style={styles.exImg} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={styles.imageOverlay}
            />
            <View style={styles.exInfoTag}>
                <Text style={styles.exName}>{currentEx.title}</Text>
                <Text style={styles.exStep}>Exercise {currentExIndex + 1} of {MOCK_EXERCISES.length}</Text>
            </View>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
            <View style={styles.timerRingOuter}>
                <View style={styles.timerRingInner}>
                    <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerLabel}>SEC REMAINING</Text>
                </View>
            </View>
        </View>
      </View>

      {/* Modern Controls */}
      <View style={styles.controls}>
        <Pressable 
            style={styles.secondaryBtn} 
            onPress={() => setIsActive(!isActive)}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={28} color={C.text} />
        </Pressable>
        
        <Pressable style={styles.primaryBtn} onPress={handleNext}>
          <LinearGradient
            colors={[C.primary, '#FF758C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnTxt}>
              {currentExIndex === MOCK_EXERCISES.length - 1 ? "Finish" : "Next Move"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C, height) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9FA" },
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 0 : 10, paddingBottom: 15 
  },
  closeBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fff', alignItems: "center", justifyContent: "center", shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: C.text },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 6 },
  liveTxt: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#3B82F6', letterSpacing: 0.5 },
  
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotDone: { backgroundColor: C.primary, width: 20 },
  dotActive: { backgroundColor: C.primary, width: 24, borderRadius: 4 },

  imageCard: { 
    width: '100%', height: height * 0.35, borderRadius: 32, overflow: 'hidden', 
    backgroundColor: '#fff', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15
  },
  exImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  exInfoTag: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  exName: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 10 },
  exStep: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timerRingOuter: { 
    width: 220, height: 220, borderRadius: 110, backgroundColor: '#fff', 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
    borderWidth: 2, borderColor: '#F1F5F9'
  },
  timerRingInner: { 
    width: 180, height: 180, borderRadius: 90, backgroundColor: '#FAF9FA',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 8, borderColor: C.soft
  },
  timerValue: { fontSize: 56, fontFamily: 'Outfit_700Bold', color: C.text },
  timerLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: C.muted, letterSpacing: 1, marginTop: -5 },

  controls: { 
    flexDirection: "row", alignItems: "center", gap: 15, 
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  secondaryBtn: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#fff', alignItems: "center", justifyContent: "center", shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  primaryBtn: { flex: 1, height: 64, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  primaryBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnTxt: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: "#fff" },
});

