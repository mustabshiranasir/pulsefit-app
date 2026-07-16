import React from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Image, Pressable, useWindowDimensions, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

const MOCK_EXERCISES = [
  { id: "e1", title: "Jumping Jacks", duration: "30s", reps: "x20", image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg?auto=compress&w=200" },
  { id: "e2", title: "Squats", duration: "45s", reps: "x15", image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg?auto=compress&w=200" },
  { id: "e3", title: "Push Ups", duration: "30s", reps: "x10", image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg?auto=compress&w=200" },
  { id: "e4", title: "Plank", duration: "60s", reps: "1 set", image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&w=200" },
];

export default function WorkoutDetailScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const { width, height } = useWindowDimensions();
  const { workout } = route.params || { workout: { title: "Workout", image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg", mins: "15 Mins" } };

  return (
    <SafeAreaView style={styles(C, width, height).safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles(C, width, height).scroll}>
        {/* Header Image Section */}
        <View style={styles(C, width, height).header}>
          <Image source={{ uri: workout.image }} style={styles(C, width, height).headerImg} />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={styles(C, width, height).headerOverlay}
          />
          <Pressable style={styles(C, width, height).backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          
          <View style={styles(C, width, height).headerTitleWrap}>
            <Text style={styles(C, width, height).headerTitle}>{workout.title}</Text>
            <View style={styles(C, width, height).tag}>
                <Text style={styles(C, width, height).tagTxt}>PREMIUM WORKOUT</Text>
            </View>
          </View>
        </View>

        <View style={styles(C, width, height).content}>
          <View style={styles(C, width, height).indicator} />
          
          <View style={styles(C, width, height).metaRow}>
            <View style={styles(C, width, height).metaItem}>
              <View style={[styles(C, width, height).metaIcon, { backgroundColor: '#FFEDF1' }]}>
                <Ionicons name="time" size={20} color={C.primary} />
              </View>
              <Text style={styles(C, width, height).metaText}>{workout.mins || "15 Min"}</Text>
              <Text style={styles(C, width, height).metaLabel}>Duration</Text>
            </View>
            <View style={styles(C, width, height).metaItem}>
              <View style={[styles(C, width, height).metaIcon, { backgroundColor: '#FFF4E5' }]}>
                <Ionicons name="flame" size={20} color="#F59E0B" />
              </View>
              <Text style={styles(C, width, height).metaText}>120 kcal</Text>
              <Text style={styles(C, width, height).metaLabel}>Burn</Text>
            </View>
            <View style={styles(C, width, height).metaItem}>
              <View style={[styles(C, width, height).metaIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="stats-chart" size={20} color="#3B82F6" />
              </View>
              <Text style={styles(C, width, height).metaText}>Intermediate</Text>
              <Text style={styles(C, width, height).metaLabel}>Level</Text>
            </View>
          </View>

          <Text style={styles(C, width, height).sectionTitle}>Overview</Text>
          <Text style={styles(C, width, height).description}>
            This curated fitness routine is specifically designed to maximize efficiency. 
            Transform your body with this high-intensity circuit that targets multiple muscle groups 
            while keeping your heart rate in the fat-burning zone.
          </Text>

          <View style={styles(C, width, height).exHeader}>
            <Text style={styles(C, width, height).sectionTitle}>Exercises</Text>
            <View style={styles(C, width, height).badge}>
                <Text style={styles(C, width, height).badgeTxt}>{MOCK_EXERCISES.length} Rounds</Text>
            </View>
          </View>

          {MOCK_EXERCISES.map((ex, idx) => (
            <Pressable key={ex.id} style={styles(C, width, height).exerciseCard}>
              <Image source={{ uri: ex.image }} style={styles(C, width, height).exImg} />
              <View style={styles(C, width, height).exInfo}>
                <Text style={styles(C, width, height).exTitle}>{ex.title}</Text>
                <View style={styles(C, width, height).exMetaRow}>
                   <Ionicons name="play-circle-outline" size={14} color={C.primary} />
                   <Text style={styles(C, width, height).exSub}>{ex.duration}</Text>
                   <View style={styles(C, width, height).dot} />
                   <Text style={styles(C, width, height).exSub}>{ex.reps}</Text>
                </View>
              </View>
              <Pressable style={styles(C, width, height).exPlayBtn}>
                <Ionicons name="play" size={12} color="#fff" />
              </Pressable>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Glass Footer */}
      <View style={styles(C, width, height).bottomBar}>
        <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            style={styles(C, width, height).bottomGradient}
        />
        <Pressable 
          style={styles(C, width, height).startBtn} 
          onPress={() => navigation.navigate("LogWorkout", { workout })}
        >
          <LinearGradient
            colors={[C.primary, '#FF758C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles(C, width, height).startBtnGradient}
          >
            <Text style={styles(C, width, height).startBtnTxt}>Start Training Now</Text>
            <View style={styles(C, width, height).startIconBox}>
                <Ionicons name="chevron-forward" size={20} color={C.primary} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = (C, width, height) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1 },
  header: { width: "100%", height: height * 0.45, position: "relative" },
  headerImg: { width: "100%", height: "100%", position: 'absolute' },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: { 
    position: "absolute", top: Platform.OS === 'ios' ? 60 : 40, left: 20, 
    width: 44, height: 44, borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  headerTitleWrap: { position: 'absolute', bottom: 60, left: 24, right: 24 },
  headerTitle: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: "#fff", marginBottom: 8 },
  tag: { backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  tagTxt: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 1 },

  content: { 
    flex: 1, padding: 24, backgroundColor: "#fff", 
    borderTopLeftRadius: 40, borderTopRightRadius: 40, 
    marginTop: -40,
  },
  indicator: { width: 40, height: 5, backgroundColor: C.soft, borderRadius: 10, alignSelf: 'center', marginBottom: 25 },
  
  metaRow: { flexDirection: "row", justifyContent: 'space-between', marginBottom: 35 },
  metaItem: { alignItems: "center", flex: 1 },
  metaIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metaText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: C.text },
  metaLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: C.muted, marginTop: 2 },

  sectionTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.text, marginBottom: 12 },
  description: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.muted, lineHeight: 22, marginBottom: 30 },

  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { backgroundColor: C.soft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTxt: { fontSize: 12, color: C.primary, fontFamily: 'Poppins_700Bold' },

  exerciseCard: { 
    flexDirection: "row", alignItems: "center", 
    backgroundColor: "#fff", borderRadius: 24, 
    padding: 12, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#F7F6F8'
  },
  exImg: { width: 80, height: 80, borderRadius: 18 },
  exInfo: { flex: 1, marginLeft: 16 },
  exTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: C.text, marginBottom: 4 },
  exMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exSub: { fontSize: 13, color: C.muted, fontFamily: 'Poppins_600SemiBold' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border },
  exPlayBtn: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, 
    alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, 
    shadowOpacity: 0.3, shadowRadius: 5
  },

  bottomBar: { 
    position: "absolute", bottom: 0, left: 0, right: 0, 
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  bottomGradient: { ...StyleSheet.absoluteFillObject, height: 150, top: -50 },
  startBtn: { height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  startBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 },
  startBtnTxt: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: "#fff" },
  startIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
