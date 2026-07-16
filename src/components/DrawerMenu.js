import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Modal, TouchableWithoutFeedback, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const DRAWER_TABS = [
  { id: "Home", label: "Home", icon: "home-outline" },
  { id: "Workout", label: "Workouts", icon: "barbell-outline" },
  { id: "Nutrition", label: "Nutrition", icon: "leaf-outline" },
  { id: "Progress", label: "Report", icon: "stats-chart-outline" },
  { id: "Coach", label: "Assistant", icon: "chatbubbles-outline" },
  { id: "Profile", label: "Profile", icon: "person-outline" },
];

export default function DrawerMenu({ visible, onClose, activeTab, onNavigate }) {
  const { user, signOut } = useAuth();
  const { colors: C } = useTheme();
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const DRAWER_W = width >= 768 ? 320 : width * 0.82;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const s = styles(C, DRAWER_W);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[s.drawerBackdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[s.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>
        <View style={s.drawerHero}>
          <Image
            source={{ uri: user?.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }}
            style={s.drawerHeroImg}
            resizeMode="cover"
          />
          <View style={[s.drawerHeroOverlay, { backgroundColor: C.primary + "55" }]} />
          <Pressable style={s.drawerClose} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
          <View style={s.drawerUserInfo}>
            <Text style={s.drawerName}>{user ? user.name : "Guest"}</Text>
            <View style={s.drawerBadge}>
              <Text style={s.drawerBadgeTxt}>🔥 1-day streak</Text>
            </View>
          </View>
        </View>

        <ScrollView style={s.drawerNav} showsVerticalScrollIndicator={false}>
          {DRAWER_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                style={[s.drawerItem, isActive && s.drawerItemActive]}
                onPress={() => { onNavigate(tab.id); onClose(); }}
              >
                {isActive && <View style={[s.drawerActiveBar, { backgroundColor: C.primary }]} />}
                <View style={[s.drawerIconWrap, isActive && { backgroundColor: C.primary + "18" }]}>
                  <Ionicons name={tab.icon} size={17} color={isActive ? C.primary : C.muted} />
                </View>
                <Text style={[s.drawerItemTxt, isActive && s.drawerItemTxtActive]}>
                  {tab.label}
                </Text>
                {isActive && <Ionicons name="chevron-forward" size={14} color={C.primary} style={{ marginLeft: "auto" }} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.drawerFooter}>
          <View style={[s.drawerDivider, { backgroundColor: C.border }]} />
          <Pressable style={s.drawerLogout} onPress={() => { signOut(); onClose(); }}>
            <Ionicons name="log-out-outline" size={17} color={C.primary} />
            <Text style={[s.drawerLogoutTxt, { color: C.primary }]}>Log Out</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = (C, DRAWER_W) =>
  StyleSheet.create({
    drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
    drawerPanel: { position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: C.card, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 6, height: 0 }, elevation: 12, overflow: "hidden" },
    drawerHero: { width: "100%", height: 200, position: "relative", overflow: "hidden" },
    drawerHeroImg: { width: "100%", height: 350 },
    drawerHeroOverlay: { ...StyleSheet.absoluteFillObject },
    drawerClose: { position: "absolute", top: 44, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
    drawerUserInfo: { position: "absolute", bottom: 16, left: 16 },
    drawerName: { fontSize: 17, fontWeight: "900", color: "#fff", marginBottom: 5 },
    drawerBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
    drawerBadgeTxt: { fontSize: 11, color: "#fff", fontWeight: "700" },
    drawerNav: { flex: 1, paddingTop: 8, paddingHorizontal: 10 },
    drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 10, borderRadius: 14, gap: 10, position: "relative", marginBottom: 2 },
    drawerItemActive: { backgroundColor: C.soft },
    drawerActiveBar: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
    drawerIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
    drawerItemTxt: { fontSize: 14, fontWeight: "600", color: C.muted },
    drawerItemTxtActive: { fontSize: 14, fontWeight: "800", color: C.text },
    drawerFooter: { paddingHorizontal: 10, paddingBottom: 28 },
    drawerDivider: { height: 1, marginBottom: 10 },
    drawerLogout: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 10 },
    drawerLogoutTxt: { fontSize: 14, fontWeight: "700" },
  });
