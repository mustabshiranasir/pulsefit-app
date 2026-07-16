import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function StickyNavbar({ navScrolled, onMenuPress, title, subtitle }) {
  const { user } = useAuth();
  const { colors: C } = useTheme();

  const s = styles(C);

  return (
    <View style={[s.navbar, navScrolled && s.navbarScrolled]}>
      <Pressable onPress={onMenuPress} hitSlop={8}>
        <View style={s.avatarWrap}>
          <Image
            source={{ uri: user?.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }}
            style={s.avatar}
          />
          <View style={s.avatarOnline} />
        </View>
      </Pressable>

      <View style={s.headerCenter}>
        <Text style={[s.brandName, navScrolled && s.brandNameScrolled]}>
          {title || "PulseFit"}
        </Text>
        {(!title || subtitle) && (
          <Text style={[s.brandSub, navScrolled ? s.brandSubScrolled : { color: C.muted }]}>
            {subtitle || "Female Fitness"}
          </Text>
        )}
      </View>

      <View style={s.streakBadge}>
        <Text style={s.streakFire}>🔥</Text>
        <Text style={s.streakTxt}>1</Text>
      </View>
    </View>
  );
}

const styles = (C) =>
  StyleSheet.create({
    navbar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 12,
      backgroundColor: C.bg,
      borderBottomWidth: 1.5,
      borderBottomColor: C.primary + "22",
      zIndex: 100,
    },
    navbarScrolled: {
      backgroundColor: C.primary,
      paddingHorizontal: 24,
      shadowColor: C.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 8,
    },
    avatarWrap: { position: "relative" },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: C.primary },
    avatarOnline: {
      position: "absolute",
      bottom: -1,
      right: -1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#22C55E",
      borderWidth: 1.5,
      borderColor: C.bg,
    },
    headerCenter: { flex: 1, alignItems: "center" },
    brandName: { fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.4 },
    brandNameScrolled: { color: C.card },
    brandSub: { fontSize: 11, color: C.text, fontWeight: "600", marginTop: 1 },
    brandSubScrolled: { color: "rgba(255,255,255,0.8)" },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.accent + "25",
      borderRadius: 20,
      paddingHorizontal: 11,
      paddingVertical: 6,
      gap: 4,
    },
    streakFire: { fontSize: 14 },
    streakTxt: { fontSize: 14, fontWeight: "800", color: C.accent },
  });
