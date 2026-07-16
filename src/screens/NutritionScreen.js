/**
 * NutritionScreen.js — PulseFit
 *
 * Bug Fixes Applied:
 *  1. DELETION BUG: handleDeleteItem now calls deleteMealItem() from storage
 *     which persists the change.  Previously only React state was updated,
 *     so deleted items reappeared after navigation or a hot-reload.
 *  2. PORT INCONSISTENCY: All reads/writes go through getNutritionData /
 *     saveNutritionData from fitnessStorage.js, which uses a single
 *     "@pulsefit/nutrition_logs" key.  Different Metro ports therefore read
 *     from and write to the same key.
 *  3. DATA SYNC: loadNutritionData is triggered on every screen focus via
 *     useFocusEffect, so the UI always reflects the current storage state.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
    Alert, Image, KeyboardAvoidingView, Modal, Platform,
    Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
    useWindowDimensions,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import DraggableCoach from "../components/DraggableCoach";
import DrawerMenu from "../components/DrawerMenu";
import StickyNavbar from "../components/StickyNavbar";
import {
    getNutritionData,
    saveNutritionData,
    deleteMealItem,
    clearMeal,
} from "../storage/fitnessStorage";
import { useTheme } from "../context/ThemeContext";

export default function NutritionScreen({ navigation }) {
    const { colors: C } = useTheme();
    const { width } = useWindowDimensions();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [navScrolled, setNavScrolled] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeDrawerTab, setActiveDrawerTab] = useState("Nutrition");

    // ── Nutrition data state ──────────────────────────────────────────────────
    const [calories, setCalories] = useState(0);
    const [goal, setGoal] = useState(2000);
    const [meals, setMeals] = useState([]);
    // Flag: only sync-to-storage AFTER initial load to avoid overwriting with
    // empty state on first render
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // ── Add/Edit modal state ──────────────────────────────────────────────────
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMealId, setSelectedMealId] = useState(null);
    const [foodName, setFoodName] = useState("");
    const [foodCals, setFoodCals] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [calError, setCalError] = useState("");
    const [nameError, setNameError] = useState("");

    // ── Tip modal state ───────────────────────────────────────────────────────
    const [tipModalVisible, setTipModalVisible] = useState(false);
    const [selectedTip, setSelectedTip] = useState(null);

    // ── Static data ───────────────────────────────────────────────────────────
    const HEALTHY_TIPS = [
        {
            id: "t1", title: "Stay Hydrated",
            desc: "Drink at least 8 glasses of water daily.",
            full: "Water is essential for every cell in your body. It helps with digestion, skin health, and keeps your energy levels up. Try carrying a reusable bottle to remind you to sip throughout the day!",
            image: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg",
        },
        {
            id: "t2", title: "Eat Greens",
            desc: "Vegetables are rich in essential fibers.",
            full: "Leafy greens like spinach, kale, and broccoli are packed with vitamins and minerals. Aim to fill half your plate with veggies to boost your nutrient intake without extra calories.",
            image: "https://images.pexels.com/photos/1359326/pexels-photo-1359326.jpeg",
        },
        {
            id: "t3", title: "Protein Power",
            desc: "Build muscle with lean protein.",
            full: "Include lean protein like chicken, fish, beans, or tofu in every meal. Protein keeps you full for longer and is vital for repairing muscles after your workouts.",
            image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
        },
        {
            id: "t4", title: "Fiber First",
            desc: "Support your gut health.",
            full: "High-fiber foods like oats, lentils, and berries improve digestion and help maintain steady blood sugar levels. Start your day with fiber to feel energized and satisfied.",
            image: "https://media.istockphoto.com/id/2261362987/photo/selection-of-fiber-rich-sources.webp?a=1&b=1&s=612x612&w=0&k=20&c=VbuzYhDtTCWd0xG34bpafKDldXX9RdquGdYqmyamcwQ=",
        },
    ];

    // ── Load data on every screen focus ──────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            loadNutritionData();
        }, [])
    );

    /**
     * Sync React state → AsyncStorage whenever state changes AFTER initial load.
     * We skip the sync until isDataLoaded is true to avoid clobbering storage
     * with the initial empty state.
     */
    React.useEffect(() => {
        if (!isDataLoaded) return;
        const syncData = async () => {
            await saveNutritionData({ calories, goal, meals });
        };
        syncData();
    }, [calories, meals, goal, isDataLoaded]);

    /**
     * Load nutrition data from AsyncStorage and hydrate state.
     * Uses getNutritionData() which handles the "new day" reset automatically.
     */
    const loadNutritionData = async () => {
        try {
            const data = await getNutritionData();
            setCalories(data.calories ?? 0);
            setGoal(data.goal ?? 2000);
            setMeals(data.meals ?? []);
            setIsDataLoaded(true);
        } catch (e) {
            console.error("[NutritionScreen] loadNutritionData failed:", e);
            setIsDataLoaded(true);
        }
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    /**
     * Delete a single food item from a meal.
     *
     * Bug Fix: Now calls deleteMealItem() which PERSISTS the change to
     * AsyncStorage immediately, preventing the item from reappearing on reload.
     * Previously only setMeals / setCalories were called (state only).
     */
    const performDelete = async (mealId, itemId) => {
        // Close modal first if open to avoid state conflicts
        if (modalVisible) closeModal();

        const updated = await deleteMealItem(mealId, itemId);

        if (updated) {
            // Use the persisted result directly — most reliable path
            setMeals(updated.meals);
            setCalories(updated.calories);
        } else {
            // Fallback: compute from current state snapshot
            setMeals((prevMeals) => {
                let calsToRemove = 0;
                const newMeals = prevMeals.map((m) => {
                    if (m.id !== mealId) return m;
                    const item = m.items.find((i) => i.id === itemId);
                    calsToRemove = item?.cal ?? 0;
                    return {
                        ...m,
                        consumed: Math.max(0, m.consumed - calsToRemove),
                        items: m.items.filter((i) => i.id !== itemId),
                    };
                });
                // Update calories inside the setMeals callback so we have fresh data
                setCalories((prev) => Math.max(0, prev - calsToRemove));
                return newMeals;
            });
        }
    };

    const handleDeleteItem = (mealId, itemId) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Remove this item from your log?");
            if (!confirmed) return;
            performDelete(mealId, itemId);
        } else {
            Alert.alert("Delete Item?", "Remove this item from your log?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => performDelete(mealId, itemId),
                },
            ]);
        }
    };
    /**
     * Save a new food item or update an existing one.
     * Validates input, computes calorie diff, updates React state.
     * The useEffect above will then persist the new state.
     */
    const handleSaveFood = () => {
        // ── Validation ──
        let hasError = false;
        if (!foodName.trim()) {
            setNameError("Please name your delicious food! 🍎");
            hasError = true;
        } else {
            setNameError("");
        }
        if (!foodCals.trim()) {
            setCalError("Don't forget the calories! 🔥");
            hasError = true;
        } else if (!/^\d+$/.test(foodCals)) {
            setCalError("Numbers only, please! 🔢");
            hasError = true;
        } else {
            setCalError("");
        }
        if (hasError) return;

        const calValue = parseInt(foodCals, 10);
        let consumedDiff = 0;
        const currentMeal = meals.find((m) => m.id === selectedMealId);

        if (isEditing) {
            const existing = currentMeal?.items.find((i) => i.id === editingItemId);
            if (existing) consumedDiff = calValue - existing.cal;
        } else {
            consumedDiff = calValue;
        }

        // Update meals state
        setMeals((prevMeals) =>
            prevMeals.map((meal) => {
                if (meal.id !== selectedMealId) return meal;
                let newItems = [...meal.items];
                if (isEditing) {
                    newItems = newItems.map((item) =>
                        item.id === editingItemId ? { ...item, name: foodName, cal: calValue } : item
                    );
                } else {
                    newItems.push({ id: Date.now().toString(), name: foodName, cal: calValue });
                }
                return {
                    ...meal,
                    consumed: Math.max(0, meal.consumed + consumedDiff),
                    items: newItems,
                };
            })
        );

        // Update total calorie counter
        setCalories((prev) => Math.max(0, prev + consumedDiff));
        closeModal();
    };

    /** Open modal in edit mode pre-filled with the item's current values */
    const openEditModal = (mealId, item) => {
        setSelectedMealId(mealId);
        setEditingItemId(item.id);
        setFoodName(item.name);
        setFoodCals(item.cal.toString());
        setIsEditing(true);
        setModalVisible(true);
    };

    /** Reset and close the add/edit modal */
    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setEditingItemId(null);
        setFoodName("");
        setFoodCals("");
        setNameError("");
        setCalError("");
    };

    /**
     * Clear all items from a meal category.
     * Calls clearMeal() which persists the change immediately.
     */
    const handleClearMeal = (mealId) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Remove all items logged for this meal today?");
            if (!confirmed) return;
            performClearMeal(mealId);
        } else {
            Alert.alert(
                "Clear Logs? 🗑️",
                "This will remove all items logged for this meal today.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear All", style: "destructive", onPress: () => performClearMeal(mealId) },
                ]
            );
        }
    };

    const performClearMeal = async (mealId) => {
        const updated = await clearMeal(mealId);
        if (updated) {
            setMeals(updated.meals);
            setCalories(updated.calories);
        } else {
            const meal = meals.find((m) => m.id === mealId);
            if (!meal) return;
            setMeals((prev) =>
                prev.map((m) => m.id === mealId ? { ...m, consumed: 0, items: [] } : m)
            );
            setCalories((prev) => Math.max(0, prev - (meal.consumed ?? 0)));
        }
    };

    const handleScroll = (e) => {
        setNavScrolled(e.nativeEvent.contentOffset.y > 12);
    };

    // ── Sub-components ────────────────────────────────────────────────────────

    /** Circular SVG progress ring used in the calorie dashboard */
    const ProgressRing = ({ size, strokeWidth, progress, color, label, sublabel }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const safeProgress = Math.min(Math.max(progress, 0), 1);
        const offset = circumference - safeProgress * circumference;

        return (
            <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none" />
                        <Circle
                            cx={size / 2} cy={size / 2} r={radius}
                            stroke={color} strokeWidth={strokeWidth} fill="none"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={offset} strokeLinecap="round"
                        />
                    </G>
                </Svg>
                <View style={{ position: "absolute", alignItems: "center" }}>
                    <Text style={{ fontSize: size * 0.18, fontFamily: "Outfit_700Bold", color: C.text }}>{label}</Text>
                    <Text style={{ fontSize: size * 0.07, fontFamily: "Poppins_600SemiBold", color: C.muted, letterSpacing: 1 }}>{sublabel}</Text>
                </View>
            </View>
        );
    };

    const styles = makeStyles(C, width);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe}>
            <StickyNavbar
                navScrolled={navScrolled}
                onMenuPress={() => setDrawerOpen(true)}
                title="NUTRITION"
                subtitle=" "
            />

            <DrawerMenu
                visible={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                activeTab={activeDrawerTab}
                onNavigate={(tabId) => {
                    setActiveDrawerTab(tabId);
                    navigation.navigate(tabId);
                }}
            />

            <DraggableCoach onPress={() => navigation.navigate("Coach")} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <View style={styles.responsiveContainer}>

                    {/* ── Calorie Dashboard ─────────────────────────────────────────── */}
                    <View style={styles.dashboard}>
                        <View style={styles.dashboardRow}>
                            <View style={styles.mainProgress}>
                                <ProgressRing
                                    size={160} strokeWidth={14} progress={calories / goal}
                                    color={C.primary} label={calories} sublabel={`OF ${goal} kcal`}
                                />
                            </View>

                            <View style={styles.macrosWrap}>
                                <View style={styles.macroItem}>
                                    <View style={[styles.macroDot, { backgroundColor: "#3BBFA0" }]} />
                                    <View>
                                        <Text style={styles.macroVal}>{Math.round(calories * 0.03)}g</Text>
                                        <Text style={styles.macroLabel}>Protein</Text>
                                    </View>
                                </View>
                                <View style={styles.macroItem}>
                                    <View style={[styles.macroDot, { backgroundColor: "#9B72CF" }]} />
                                    <View>
                                        <Text style={styles.macroVal}>{Math.round(calories * 0.12)}g</Text>
                                        <Text style={styles.macroLabel}>Carbs</Text>
                                    </View>
                                </View>
                                <View style={styles.macroItem}>
                                    <View style={[styles.macroDot, { backgroundColor: "#F4A261" }]} />
                                    <View>
                                        <Text style={styles.macroVal}>{Math.round(calories * 0.04)}g</Text>
                                        <Text style={styles.macroLabel}>Fat</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ── Meal Cards ────────────────────────────────────────────────── */}
                    <View style={styles.mealsGrid}>
                        {meals.map((meal) => {
                            const left = Math.max(0, meal.target - meal.consumed);
                            const progress = Math.min(100, (meal.consumed / meal.target) * 100);
                            return (
                                <View key={meal.id} style={[styles.mealCard, { backgroundColor: "#1A202C" }]}>
                                    <Image
                                        source={{ uri: meal.bg }}
                                        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
                                        resizeMode="cover"
                                        fadeDuration={300}
                                    />
                                    {/* Dark overlay for readability */}
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)" }]} />

                                    <View style={styles.mealRow}>
                                        <View style={[styles.mealIconCircle, { backgroundColor: "rgba(255,255,255,0.9)" }]}>
                                            <Ionicons name={meal.icon} size={20} color={meal.iconColor} />
                                        </View>

                                        <View style={styles.mealInfo}>
                                            <Text style={[styles.mealTitle, { color: "#fff" }]}>{meal.title}</Text>
                                            <Text style={[styles.mealSub, { color: "rgba(255,255,255,0.8)" }]}>
                                                {meal.consumed} / {meal.target} kcal
                                            </Text>
                                        </View>

                                        <View style={styles.mealProgressArea}>
                                            <View style={[styles.miniBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                                                <View style={[styles.miniProgress, { width: `${progress}%`, backgroundColor: "#fff" }]} />
                                            </View>
                                            <Text style={[styles.leftLabel, { color: "#fff" }]}>{left} kcal left</Text>
                                        </View>

                                        <View style={styles.mealActions}>
                                            {meal.consumed > 0 && (
                                                <Pressable style={styles.clearBtn} onPress={() => handleClearMeal(meal.id)}>
                                                    <Ionicons name="trash" size={12} color="#FF6B6B" />
                                                </Pressable>
                                            )}
                                            <Pressable
                                                style={styles.addBtn}
                                                onPress={() => {
                                                    setSelectedMealId(meal.id);
                                                    setIsEditing(false);
                                                    setModalVisible(true);
                                                }}
                                            >
                                                <Ionicons name="add" size={18} color="#fff" />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {/* Food items logged under this meal */}
                                    {meal.items.length > 0 && (
                                        <View style={styles.mealItemsList}>
                                            <View style={styles.pillContainer}>
                                                {meal.items.map((item) => (
                                                    <View key={item.id} style={styles.itemPillWrapper}>
                                                        <Pressable
                                                            style={styles.itemPill}
                                                            onPress={() => openEditModal(meal.id, item)}
                                                        >
                                                            <Text style={styles.pillText} numberOfLines={1}>{item.name}</Text>
                                                            <Text style={[styles.pillCal, { color: meal.iconColor }]}>
                                                                {item.cal} kcal
                                                            </Text>
                                                            <Ionicons name="pencil" size={12} color={meal.iconColor} style={{ marginLeft: 8 }} />
                                                        </Pressable>
                                                        {/* Delete button — calls handleDeleteItem which persists */}
                                                        <Pressable
                                                            style={styles.pillDeleteBtn}
                                                            onPress={() => handleDeleteItem(meal.id, item.id)}
                                                        >
                                                            <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                                                        </Pressable>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* ── Healthy Tips ─────────────────────────────────────────────── */}
                    <Text style={styles.sectionTitle}>Healthy Tips</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
                        {HEALTHY_TIPS.map((tip) => (
                            <Pressable
                                key={tip.id}
                                style={styles.tipCard}
                                onPress={() => { setSelectedTip(tip); setTipModalVisible(true); }}
                            >
                                <Image source={{ uri: tip.image }} style={styles.tipImg} />
                                <Text style={styles.tipTitle}>{tip.title}</Text>
                                <Text style={styles.tipDesc} numberOfLines={2}>{tip.desc}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={{ height: 80 }} />
                </View>
            </ScrollView>

            {/* ── Add / Edit Food Modal ────────────────────────────────────────── */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    style={styles.modalBackdrop}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.modalBox}>
                        {selectedMealId && (
                            <Image
                                source={{ uri: meals.find((m) => m.id === selectedMealId)?.bg }}
                                style={[StyleSheet.absoluteFill, { borderRadius: 40 }]}
                                resizeMode="cover"
                            />
                        )}
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 40 }]} />

                        <View style={styles.modalHeader}>
                            <View style={styles.modalFruitWrap}>
                                <Image
                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/3194/3194591.png" }}
                                    style={styles.modalFruit}
                                />
                            </View>
                            <Text style={[styles.modalTitle, { color: "#fff" }]}>
                                {isEditing ? "Edit" : "Log"}{" "}
                                {selectedMealId ? meals.find((m) => m.id === selectedMealId)?.title : "Food"}
                            </Text>
                        </View>

                        {/* Food Name Input */}
                        <View style={styles.cuteInputContainer}>
                            <View style={[styles.cuteInputInner, {
                                backgroundColor: "rgba(255,255,255,0.15)",
                                borderColor: nameError ? "#FF6B6B" : "rgba(255,255,255,0.3)",
                            }]}>
                                <View style={styles.inputIconBox}>
                                    <Ionicons name="nutrition" size={20} color={C.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cuteInputLabel, { color: "rgba(255,255,255,0.7)" }]}>Food Name</Text>
                                    <TextInput
                                        style={[styles.cuteInput, { color: "#fff" }]}
                                        placeholder="e.g. Avocado Toast"
                                        value={foodName}
                                        onChangeText={(t) => { setFoodName(t); if (t) setNameError(""); }}
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                    />
                                </View>
                            </View>
                            {nameError ? (
                                <View style={styles.cuteErrorBox}>
                                    <View style={styles.errorIconCircle}>
                                        <Ionicons name="alert" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.cuteErrorText}>{nameError}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Calories Input */}
                        <View style={styles.cuteInputContainer}>
                            <View style={[styles.cuteInputInner, {
                                backgroundColor: "rgba(255,255,255,0.15)",
                                borderColor: calError ? "#FF6B6B" : "rgba(255,255,255,0.3)",
                            }]}>
                                <View style={styles.inputIconBox}>
                                    <Ionicons name="flame" size={20} color="#F59E0B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cuteInputLabel, { color: "rgba(255,255,255,0.7)" }]}>Calories (kcal)</Text>
                                    <TextInput
                                        style={[styles.cuteInput, { color: "#fff" }]}
                                        placeholder="e.g. 250"
                                        keyboardType="numeric"
                                        value={foodCals}
                                        onChangeText={(t) => {
                                            setFoodCals(t);
                                            if (!t) setCalError("");
                                            else if (!/^\d+$/.test(t)) setCalError("Numbers only, please! 🔢");
                                            else setCalError("");
                                        }}
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                    />
                                </View>
                            </View>
                            {calError ? (
                                <View style={styles.cuteErrorBox}>
                                    <View style={styles.errorIconCircle}>
                                        <Ionicons name="alert" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.cuteErrorText}>{calError}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.modalBtns}>
                            <Pressable style={styles.modalBtnCancel} onPress={closeModal}>
                                <Text style={styles.modalBtnCancelTxt}>Cancel</Text>
                            </Pressable>

                            {isEditing && (
                                <Pressable
                                    style={[styles.modalBtnCancel, {
                                        backgroundColor: "rgba(255,107,107,0.2)",
                                        flex: 0.6,
                                        borderColor: "rgba(255,107,107,0.3)",
                                        borderWidth: 1,
                                    }]}
                                    onPress={() => handleDeleteItem(selectedMealId, editingItemId)}
                                >
                                    <Ionicons name="trash" size={22} color="#FF6B6B" />
                                </Pressable>
                            )}

                            <Pressable style={styles.modalBtnSave} onPress={handleSaveFood}>
                                <LinearGradient colors={[C.primary, "#FF758C"]} style={styles.modalBtnSaveGradient}>
                                    <Text style={styles.modalBtnSaveTxt}>{isEditing ? "Update" : "Add to Log"}</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Tip Detail Modal ─────────────────────────────────────────────── */}
            <Modal visible={tipModalVisible} transparent animationType="slide">
                <View style={styles.tipModalBackdrop}>
                    <View style={styles.tipDetailBox}>
                        {selectedTip && (
                            <>
                                <Image source={{ uri: selectedTip.image }} style={styles.tipDetailImg} />
                                <View style={styles.tipDetailContent}>
                                    <Text style={styles.tipDetailTitle}>{selectedTip.title}</Text>
                                    <Text style={styles.tipDetailFull}>{selectedTip.full}</Text>
                                    <Pressable style={styles.tipCloseBtn} onPress={() => setTipModalVisible(false)}>
                                        <Text style={styles.tipCloseBtnTxt}>Got it!</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (C, width) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FAF9FA" },
    scroll: { flex: 1 },
    responsiveContainer: { width: "100%", maxWidth: 650, alignSelf: "center", paddingHorizontal: 20, paddingTop: 20 },

    dashboard: {
        backgroundColor: "#fff", borderRadius: 35, padding: 24, marginBottom: 28,
        shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 20, elevation: 5,
        borderWidth: 1, borderColor: "#F1F5F9",
    },
    dashboardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    mainProgress: { flex: 1.2, alignItems: "center" },
    macrosWrap: { flex: 1, gap: 14, paddingLeft: 10 },
    macroItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8FAFC", padding: 10, borderRadius: 16 },
    macroDot: { width: 6, height: 6, borderRadius: 3 },
    macroVal: { fontSize: 15, fontFamily: "Outfit_700Bold", color: C.text },
    macroLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },

    sectionTitle: { fontSize: 22, fontFamily: "Outfit_700Bold", color: C.text, marginBottom: 18, marginTop: 10 },

    mealsGrid: { flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20 },
    mealCard: {
        width: "100%", borderRadius: 22, padding: 12, marginBottom: 5,
        shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: "hidden",
    },
    mealRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    mealIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", elevation: 1 },
    mealInfo: { flex: 1.5 },
    mealTitle: { fontSize: 16, fontFamily: "Outfit_700Bold", color: C.text },
    mealSub: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.muted, marginTop: 1 },

    mealProgressArea: { flex: 2, paddingHorizontal: 10 },
    miniBar: { height: 4, borderRadius: 2, marginBottom: 4, overflow: "hidden", width: "100%" },
    miniProgress: { height: "100%", borderRadius: 2 },
    leftLabel: { fontSize: 9, fontFamily: "Poppins_700Bold", color: C.muted, opacity: 0.7, textAlign: "center" },

    mealActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    addBtn: {
        width: 32, height: 32, borderRadius: 10, backgroundColor: C.primary,
        alignItems: "center", justifyContent: "center",
        shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
    },
    clearBtn: {
        width: 26, height: 26, borderRadius: 8, backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 1,
    },

    mealItemsList: { marginTop: 8, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.03)", paddingTop: 8 },
    pillContainer: { gap: 5 },
    itemPillWrapper: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    itemPill: {
        flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
    },
    pillDeleteBtn: { padding: 8, marginLeft: 2, marginRight: -4 },
    pillText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#fff", flex: 1, marginRight: 8 },
    pillCal: { fontSize: 10, fontFamily: "Poppins_700Bold" },

    cuteErrorBox: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        marginTop: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
        borderWidth: 1.5, borderColor: "#FF6B6B",
        shadowColor: "#FF6B6B", shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
        alignSelf: "flex-start",
    },
    errorIconCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fdfafaff", alignItems: "center", justifyContent: "center", marginRight: 8 },
    cuteErrorText: { color: "#2D3748", fontSize: 12, fontFamily: "Poppins_600SemiBold" },

    tipsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
    tipCard: {
        width: 240, backgroundColor: "#fff", borderRadius: 30, padding: 14,
        marginRight: 18, marginBottom: 15,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
        borderWidth: 1, borderColor: "#F1F5F9",
    },
    tipImg: { width: "100%", height: 140, borderRadius: 22, marginBottom: 14 },
    tipTitle: { fontSize: 17, fontFamily: "Outfit_700Bold", color: C.text },
    tipDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", color: C.muted, marginTop: 6, lineHeight: 18 },

    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
    modalBox: { width: width * 0.9, maxWidth: 400, borderRadius: 40, padding: 28, alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    modalHeader: { alignItems: "center", marginBottom: 25 },
    modalFruitWrap: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFF0F3",
        alignItems: "center", justifyContent: "center", marginBottom: 15,
        borderWidth: 4, borderColor: "#fff", elevation: 5, shadowColor: C.primary, shadowOpacity: 0.2,
    },
    modalFruit: { width: 50, height: 50 },
    modalTitle: { fontSize: 24, fontFamily: "Outfit_700Bold", color: C.text, textAlign: "center" },

    cuteInputContainer: { width: "100%", marginBottom: 18 },
    cuteInputInner: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC",
        borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12,
        borderWidth: 1, borderColor: "#EDF2F7",
    },
    inputIconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginRight: 15, elevation: 1 },
    cuteInputLabel: { fontSize: 11, fontFamily: "Poppins_700Bold", color: C.muted, marginBottom: 2, marginLeft: 2, letterSpacing: 0.5 },
    cuteInput: { width: "100%", height: 45, fontSize: 16, fontFamily: "Poppins_600SemiBold", color: C.text, paddingVertical: 0 },

    modalBtns: { flexDirection: "row", gap: 15, marginTop: 15, width: "100%" },
    modalBtnCancel: { flex: 1, height: 60, borderRadius: 22, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
    modalBtnCancelTxt: { fontSize: 15, fontFamily: "Poppins_700Bold", color: C.muted },
    modalBtnSave: { flex: 1.2, height: 60, borderRadius: 22, overflow: "hidden", elevation: 8, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10 },
    modalBtnSaveGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
    modalBtnSaveTxt: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },

    tipModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    tipDetailBox: { width: width * 0.9, maxWidth: 360, backgroundColor: "#fff", borderRadius: 32, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    tipDetailImg: { width: "100%", height: 200, resizeMode: "cover" },
    tipDetailContent: { padding: 24, alignItems: "center" },
    tipDetailTitle: { fontSize: 24, fontFamily: "Outfit_700Bold", color: C.text, marginBottom: 12, textAlign: "center" },
    tipDetailFull: { fontSize: 15, fontFamily: "Poppins_400Regular", color: C.muted, textAlign: "center", lineHeight: 24, marginBottom: 24 },
    tipCloseBtn: { paddingHorizontal: 30, paddingVertical: 14, backgroundColor: C.primary, borderRadius: 16, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    tipCloseBtnTxt: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
});
