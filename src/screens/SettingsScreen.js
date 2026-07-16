import React, { useState, useCallback, useRef } from "react";
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet,
  Pressable, Modal, Platform, Alert, Switch, TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { getSettings, saveSettings, getProfile, saveProfile, resetAllData } from "../storage/fitnessStorage";

const ITEM_H = 44;

// ─── Drum column ──────────────────────────────────────────────────────────────
const DrumColumn = ({ data, selected, onSelect, label, colWidth = 100 }) => {
  const ref = useRef(null);
  return (
    <View style={{ alignItems: "center", width: colWidth }}>
      {label ? <Text style={drum.label}>{label}</Text> : null}
      <View style={drum.wrap}>
        <View style={drum.highlight} pointerEvents="none" />
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
            onSelect(data[Math.max(0, Math.min(i, data.length - 1))]);
          }}
          onLayout={() => {
            const idx = data.indexOf(selected);
            if (idx >= 0) ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
          }}
        >
          {data.map((item) => (
            <Pressable key={item} style={drum.item}
              onPress={() => { onSelect(item); ref.current?.scrollTo({ y: data.indexOf(item) * ITEM_H, animated: true }); }}>
              <Text style={[drum.txt, selected === item && drum.txtActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const drum = StyleSheet.create({
  label: { fontSize: 10, fontWeight: "600", color: "#9B8E93", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  wrap: { height: ITEM_H * 5, overflow: "hidden", position: "relative", width: "100%" },
  highlight: { position: "absolute", top: ITEM_H * 2, left: 0, right: 0, height: ITEM_H, borderRadius: 10, backgroundColor: "#E8607A08", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E8607A20", zIndex: 1 },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  txt: { fontSize: 16, fontWeight: "500", color: "#C0B0B8" },
  txtActive: { fontSize: 18, fontWeight: "700", color: "#E8607A" },
});

// ─── Stepper ──────────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 0, max = 300, step = 5, unit = "s" }) => (
  <View style={step_.row}>
    <Pressable style={step_.btn} onPress={() => onChange(Math.max(min, value - step))}>
      <Ionicons name="remove" size={20} color="#E8607A" />
    </Pressable>
    <View style={step_.mid}>
      <Text style={step_.val}>{value}</Text>
      <Text style={step_.unit}>{unit}</Text>
    </View>
    <Pressable style={step_.btn} onPress={() => onChange(Math.min(max, value + step))}>
      <Ionicons name="add" size={20} color="#E8607A" />
    </Pressable>
  </View>
);

const step_ = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  btn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: "#E8607A30", backgroundColor: "#FFF8F9", alignItems: "center", justifyContent: "center" },
  mid: { alignItems: "center", minWidth: 72 },
  val: { fontSize: 36, fontWeight: "700", color: "#2D1B20", lineHeight: 42 },
  unit: { fontSize: 12, fontWeight: "600", color: "#9B8E93", marginTop: -2 },
});

// ─── Segmented ────────────────────────────────────────────────────────────────
const Seg = ({ options, selected, onSelect }) => (
  <View style={seg.wrap}>
    {options.map((o) => (
      <Pressable key={o} style={[seg.opt, selected === o && seg.optActive]} onPress={() => onSelect(o)}>
        <Text style={[seg.txt, selected === o && seg.txtActive]}>{o}</Text>
      </Pressable>
    ))}
  </View>
);

const seg = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: "#F5F0F2", borderRadius: 12, padding: 3, marginBottom: 18 },
  opt: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  optActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  txt: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },
  txtActive: { fontWeight: "700", color: "#E8607A" },
});

// ─── Sheet ────────────────────────────────────────────────────────────────────
const Sheet = ({ visible, title, onClose, onConfirm, confirmLabel = "Save", children }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Pressable style={sh.overlay} onPress={onClose}>
      <Pressable style={sh.card} onPress={e => e.stopPropagation()}>
        <View style={sh.handle} />
        <View style={sh.header}>
          <Text style={sh.title}>{title}</Text>
          <Pressable style={sh.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#9B8E93" />
          </Pressable>
        </View>
        <View style={sh.body}>{children}</View>
        <View style={sh.footer}>
          <Pressable style={sh.cancelBtn} onPress={onClose}>
            <Text style={sh.cancelTxt}>Cancel</Text>
          </Pressable>
          <Pressable style={sh.confirmBtn} onPress={onConfirm}>
            <Text style={sh.confirmTxt}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  card: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === "ios" ? 34 : 20, maxHeight: "85%" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5DDE0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "#F0E8EB" },
  title: { fontSize: 15, fontWeight: "700", color: "#2D1B20" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F0F2", alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingVertical: 18 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F5F0F2", alignItems: "center" },
  cancelTxt: { fontSize: 14, fontWeight: "700", color: "#9B8E93" },
  confirmBtn: { flex: 1.6, paddingVertical: 13, borderRadius: 14, backgroundColor: "#E8607A", alignItems: "center" },
  confirmTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const THEMES = [
  { key: "rose",     name: "Rose",     primary: "#E8607A" },
  { key: "ocean",    name: "Ocean",    primary: "#2196F3" },
  { key: "forest",   name: "Forest",   primary: "#2E7D5B" },
  { key: "sunset",   name: "Sunset",   primary: "#FF6D3A" },
  { key: "lavender", name: "Lavender", primary: "#9B72CF" },
  { key: "midnight", name: "Midnight", primary: "#E8607A" },
];
const LANGUAGES = ["English", "Spanish", "French", "German", "Urdu", "Arabic"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { colors: C, setTheme, themeKey } = useTheme();
  const [settings, setSettings] = useState({
    reminderTime: "20:00", restTime: "30", countdownTime: "10",
    soundEnabled: true, language: "English", units: "Metric (kg, m)",
    darkMode: false, notificationsEnabled: true, theme: "Rose Pink",
  });
  const [profile, setProfile] = useState({ height: "165 cm", weight: "55 kg" });

  const [showReminder,  setShowReminder]  = useState(false);
  const [showRest,      setShowRest]      = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showLanguage,  setShowLanguage]  = useState(false);
  const [showUnits,     setShowUnits]     = useState(false);
  const [showTheme,     setShowTheme]     = useState(false);
  const [showHeight,    setShowHeight]    = useState(false);
  const [showWeight,    setShowWeight]    = useState(false);

  const [tempHour,      setTempHour]      = useState("20");
  const [tempMin,       setTempMin]       = useState("00");
  const [tempRest,      setTempRest]      = useState(30);
  const [tempCountdown, setTempCountdown] = useState(10);
  const [heightUnit,    setHeightUnit]    = useState("cm");
  const [tempCm,        setTempCm]        = useState("165");
  const [tempFt,        setTempFt]        = useState("5");
  const [tempIn,        setTempIn]        = useState("5");
  const [weightUnit,    setWeightUnit]    = useState("kg");
  const [tempWeight,    setTempWeight]    = useState("55");

  const hours   = Array.from({ length: 24  }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];
  const cmOpt   = Array.from({ length: 151 }, (_, i) => (100 + i).toString());
  const feetOpt = ["4", "5", "6", "7"];
  const inchOpt = Array.from({ length: 12 }, (_, i) => i.toString());
  const kgOpt   = Array.from({ length: 201 }, (_, i) => (20 + i).toString());
  const lbOpt   = Array.from({ length: 441 }, (_, i) => (44 + i).toString());

  useFocusEffect(useCallback(() => {
    (async () => {
      const [sett, p] = await Promise.all([getSettings(), getProfile()]);
      setSettings(sett); setProfile(p);
      if (sett.restTime) setTempRest(parseInt(sett.restTime) || 30);
      if (sett.countdownTime) setTempCountdown(parseInt(sett.countdownTime) || 10);
    })();
  }, []));

  const persist = async (key, value) => {
    const u = { ...settings, [key]: value }; setSettings(u); await saveSettings(u);
  };

  const toggleSetting = async (key) => {
    const u = { ...settings, [key]: !settings[key] }; setSettings(u); await saveSettings(u);
  };

  const handleReset = () => Alert.alert("Reset all data?",
    "Permanently deletes ALL fitness data. This cannot be undone.",
    [{ text: "Cancel", style: "cancel" },
     { text: "Reset", style: "destructive", onPress: async () => {
       await resetAllData();
       const [sett, p] = await Promise.all([getSettings(), getProfile()]);
       setSettings(sett); setProfile(p);
       Alert.alert("Done", "Data reset successfully.");
     }}]
  );

  const SettingRow = ({ label, value, onPress, icon, iconBg, isLast = false }) => (
    <Pressable style={[s.row, isLast && s.rowLast]} onPress={onPress}>
      <View style={s.rowLeft}>
        <View style={[s.iconBox, { backgroundColor: iconBg || "#E8607A10" }]}>
          <Ionicons name={icon} size={16} color="#E8607A" />
        </View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={14} color="#C5B8BC" />
      </View>
    </Pressable>
  );

  const ToggleRow = ({ label, valueKey, icon, iconBg, isLast = false }) => (
    <View style={[s.row, isLast && s.rowLast]}>
      <View style={s.rowLeft}>
        <View style={[s.iconBox, { backgroundColor: iconBg || "#E8607A10" }]}>
          <Ionicons name={icon} size={16} color="#E8607A" />
        </View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <Switch value={!!settings[valueKey]} onValueChange={() => toggleSetting(valueKey)}
        trackColor={{ false: "#E0D8DB", true: "#E8607A" }} thumbColor="#fff" ios_backgroundColor="#E0D8DB" />
    </View>
  );

  const SectionCard = ({ title, children }) => (
    <View style={s.sectionWrap}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <LinearGradient colors={["#E8607A", "#FF758C"]} style={s.gradHeader}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={s.backCircle}><Ionicons name="chevron-back" size={20} color="#E8607A" /></View>
        </Pressable>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      {/* Sheets */}

      <Sheet visible={showReminder} title="Daily reminder" onClose={() => setShowReminder(false)}
        onConfirm={async () => { await persist("reminderTime", `${tempHour}:${tempMin}`); setShowReminder(false); }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <DrumColumn data={hours}   selected={tempHour} onSelect={setTempHour} label="Hour" colWidth={100} />
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#E8607A", marginTop: 18 }}>:</Text>
          <DrumColumn data={minutes} selected={tempMin}  onSelect={setTempMin}  label="Min"  colWidth={100} />
        </View>
      </Sheet>

      <Sheet visible={showRest} title="Rest between sets" onClose={() => setShowRest(false)}
        onConfirm={async () => { await persist("restTime", tempRest.toString()); setShowRest(false); }}>
        <Stepper value={tempRest} onChange={setTempRest} min={5} max={300} step={5} unit="sec" />
        <View style={s.chips}>
          {[15, 30, 45, 60, 90, 120].map(v => (
            <Pressable key={v} style={[s.chip, tempRest === v && s.chipActive]} onPress={() => setTempRest(v)}>
              <Text style={[s.chipTxt, tempRest === v && s.chipTxtActive]}>{v}s</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={showCountdown} title="Countdown timer" onClose={() => setShowCountdown(false)}
        onConfirm={async () => { await persist("countdownTime", tempCountdown.toString()); setShowCountdown(false); }}>
        <Stepper value={tempCountdown} onChange={setTempCountdown} min={3} max={60} step={1} unit="sec" />
        <View style={s.chips}>
          {[3, 5, 10, 15, 20].map(v => (
            <Pressable key={v} style={[s.chip, tempCountdown === v && s.chipActive]} onPress={() => setTempCountdown(v)}>
              <Text style={[s.chipTxt, tempCountdown === v && s.chipTxtActive]}>{v}s</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={showLanguage} title="Language" onClose={() => setShowLanguage(false)}
        onConfirm={() => setShowLanguage(false)} confirmLabel="Done">
        <View style={s.optList}>
          {LANGUAGES.map(l => (
            <Pressable key={l} style={[s.optRow, settings.language === l && s.optRowActive]}
              onPress={async () => await persist("language", l)}>
              <Text style={[s.optTxt, settings.language === l && s.optTxtActive]}>{l}</Text>
              {settings.language === l && <Ionicons name="checkmark" size={16} color="#E8607A" />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={showUnits} title="Measurement units" onClose={() => setShowUnits(false)}
        onConfirm={() => setShowUnits(false)} confirmLabel="Done">
        <View style={s.optList}>
          {["Metric (kg, m)", "Imperial (lb, ft)"].map(u => (
            <Pressable key={u} style={[s.optRow, settings.units === u && s.optRowActive]}
              onPress={async () => await persist("units", u)}>
              <View>
                <Text style={[s.optTxt, settings.units === u && s.optTxtActive]}>{u}</Text>
                <Text style={s.optSub}>{u.includes("Imperial") ? "lb, ft/in" : "kg, cm"}</Text>
              </View>
              {settings.units === u && <Ionicons name="checkmark" size={16} color="#E8607A" />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={showTheme} title="App theme" onClose={() => setShowTheme(false)}
        onConfirm={() => setShowTheme(false)} confirmLabel="Done">
        <View style={s.themeGrid}>
          {THEMES.map(t => (
            <Pressable key={t.key}
              style={[s.themeCell, { borderColor: themeKey === t.key ? t.primary : "#EDE6E9" }]}
              onPress={() => setTheme(t.key)}>
              <View style={[s.themeDot, { backgroundColor: t.primary }]} />
              <Text style={[s.themeName, themeKey === t.key && { color: t.primary, fontWeight: "700" }]}>{t.name}</Text>
              {themeKey === t.key && (
                <View style={[s.themeCheck, { backgroundColor: t.primary }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={showHeight} title="Height" onClose={() => setShowHeight(false)}
        onConfirm={async () => {
          const val = heightUnit === "ft" ? `${tempFt}ft ${tempIn}in` : `${tempCm} cm`;
          const u = { ...profile, height: val }; setProfile(u); await saveProfile(u);
          setShowHeight(false);
        }}>
        <Seg options={["ft / in", "cm"]} selected={heightUnit === "ft" ? "ft / in" : "cm"}
          onSelect={v => setHeightUnit(v === "ft / in" ? "ft" : "cm")} />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {heightUnit === "ft" ? (<>
            <DrumColumn data={feetOpt} selected={tempFt} onSelect={setTempFt} label="Feet"   colWidth={110} />
            <DrumColumn data={inchOpt} selected={tempIn} onSelect={setTempIn} label="Inches"  colWidth={110} />
          </>) : (
            <DrumColumn data={cmOpt} selected={tempCm} onSelect={setTempCm} label="cm" colWidth={200} />
          )}
        </View>
      </Sheet>

      <Sheet visible={showWeight} title="Weight" onClose={() => setShowWeight(false)}
        onConfirm={async () => {
          const val = `${tempWeight} ${weightUnit}`;
          const u = { ...profile, weight: val }; setProfile(u); await saveProfile(u);
          setShowWeight(false);
        }}>
        <Seg options={["kg", "lb"]} selected={weightUnit} onSelect={setWeightUnit} />
        <View style={{ alignItems: "center" }}>
          <DrumColumn data={weightUnit === "kg" ? kgOpt : lbOpt} selected={tempWeight}
            onSelect={setTempWeight} label={weightUnit === "kg" ? "kg" : "lb"} colWidth={200} />
        </View>
      </Sheet>

      {/* Main scroll */}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SectionCard title="Timers">
          <SettingRow label="Daily reminder"    icon="alarm-outline"   iconBg="#FFF0F3" value={settings.reminderTime}
            onPress={() => { const [h, m] = (settings.reminderTime || "20:00").split(":"); setTempHour(h); setTempMin(m || "00"); setShowReminder(true); }} />
          <SettingRow label="Rest between sets" icon="cafe-outline"    iconBg="#FFF4E5" value={`${settings.restTime}s`}
            onPress={() => { setTempRest(parseInt(settings.restTime) || 30); setShowRest(true); }} />
          <SettingRow label="Countdown"         icon="timer-outline"   iconBg="#E0F2FE" value={`${settings.countdownTime}s`} isLast
            onPress={() => { setTempCountdown(parseInt(settings.countdownTime) || 10); setShowCountdown(true); }} />
        </SectionCard>

        <SectionCard title="Appearance">
          <SettingRow label="Theme"    icon="color-palette-outline"    iconBg="#F3E8FF" value={THEMES.find(t => t.key === themeKey)?.name || "Rose"}  onPress={() => setShowTheme(true)} />
          <SettingRow label="Language" icon="language-outline"         iconBg="#E0F2FE" value={settings.language || "English"} onPress={() => setShowLanguage(true)} />
          <SettingRow label="Units"    icon="swap-horizontal-outline"  iconBg="#DCFCE7" value={settings.units?.includes("Imperial") ? "Imperial" : "Metric"} isLast onPress={() => setShowUnits(true)} />
        </SectionCard>

        <SectionCard title="Body">
          <SettingRow label="Height" icon="resize-outline"  iconBg="#FFF0F3" value={profile.height || "—"} onPress={() => setShowHeight(true)} />
          <SettingRow label="Weight" icon="fitness-outline" iconBg="#FFF4E5" value={profile.weight || "—"} isLast onPress={() => setShowWeight(true)} />
        </SectionCard>

        <SectionCard title="Notifications & sound">
          <ToggleRow label="Sound effects"      valueKey="soundEnabled"         icon="musical-notes-outline"        iconBg="#FFF9E6" />
          <ToggleRow label="Push notifications" valueKey="notificationsEnabled" icon="notifications-circle-outline" iconBg="#F3E8FF" isLast />
        </SectionCard>

        {/* About */}
        <View style={s.aboutCard}>
          <View style={s.aboutIconWrap}><Ionicons name="heart" size={22} color="#E8607A" /></View>
          <Text style={s.aboutTitle}>PulseFit</Text>
          <Text style={s.aboutVersion}>Version 1.0.0</Text>
          <Text style={s.aboutDesc}>Your personal female fitness companion.</Text>
        </View>

        <SectionCard title="Danger zone">
          <Pressable style={s.resetRow} onPress={handleReset}>
            <View style={[s.iconBox, { backgroundColor: "#FFF0F0" }]}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </View>
            <Text style={s.resetLabel}>Reset all data</Text>
            <Ionicons name="chevron-forward" size={14} color="#EF4444" />
          </Pressable>
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9FA" },
  gradHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },

  scroll: { padding: 20, paddingTop: 22 },
  sectionWrap: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#9B8E93", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 },
  card: { backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, borderWidth: 0.5, borderColor: "#F0E8EB" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "#F5EFF1" },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#2D1B20" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },

  aboutCard: { backgroundColor: "#fff", borderRadius: 18, padding: 20, alignItems: "center", marginBottom: 20, borderWidth: 0.5, borderColor: "#F0E8EB" },
  aboutIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF0F3", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  aboutTitle: { fontSize: 16, fontWeight: "700", color: "#2D1B20" },
  aboutVersion: { fontSize: 11, fontWeight: "600", color: "#9B8E93", marginTop: 3, marginBottom: 6 },
  aboutDesc: { fontSize: 12, color: "#9B8E93", textAlign: "center" },

  resetRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  resetLabel: { fontSize: 14, fontWeight: "600", color: "#EF4444", flex: 1 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F5F0F2", borderWidth: 1, borderColor: "#EDE6E9" },
  chipActive: { backgroundColor: "#E8607A", borderColor: "#E8607A" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },
  chipTxtActive: { color: "#fff" },

  optList: { gap: 8 },
  optRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: "#EDE6E9", backgroundColor: "#FDFBFC" },
  optRowActive: { borderColor: "#E8607A40", backgroundColor: "#FFF8F9" },
  optTxt: { fontSize: 14, fontWeight: "600", color: "#6B5A5F" },
  optTxtActive: { color: "#E8607A", fontWeight: "700" },
  optSub: { fontSize: 11, color: "#9B8E93", marginTop: 2 },

  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCell: { width: "47%", flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: "#FDFBFC", position: "relative" },
  themeDot: { width: 26, height: 26, borderRadius: 13 },
  themeName: { fontSize: 12, fontWeight: "600", color: "#6B5A5F", flex: 1 },
  themeCheck: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
});