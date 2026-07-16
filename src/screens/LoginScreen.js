import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Animated,
  StatusBar,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { validateLogin, registerUser } from "../storage/fitnessStorage";

export default function LoginScreen() {
  const { colors: C } = useTheme();
  const { signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [heightVal, setHeightVal] = useState("");
  const [weightVal, setWeightVal] = useState("");
  
  // Validation & Error state
  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [heightUnit, setHeightUnit] = useState("ft");
  const [tempFt, setTempFt] = useState("5");
  const [tempIn, setTempIn] = useState("2");
  const [tempCm, setTempCm] = useState("160");

  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [weightUnit, setWeightUnit] = useState("kg"); // 'kg' or 'lb'
  const [tempWeight, setTempWeight] = useState("60");

  const feetOptions = ["2", "3", "4", "5", "6", "7", "8"];
  const inchOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
  const cmOptions = Array.from({ length: 201 }, (_, i) => (50 + i).toString());
  const kgOptions = Array.from({ length: 281 }, (_, i) => (20 + i).toString());
  const lbOptions = Array.from({ length: 621 }, (_, i) => (40 + i).toString());

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAuth = async () => {
    setError(null);
    
    // 1. Email Validation
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("This doesn't look like a valid email");
      return;
    }

    // 2. Password Validation
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    // 3. Registration-only Validation
    if (!isLogin) {
      // Name validation
      if (!name.trim()) {
        setError("What's your name, beautiful?");
        return;
      }
      if (name.trim().length < 3) {
        setError("Please enter a valid full name");
        return;
      }
      if (/[0-9]/.test(name)) {
        setError("Names usually don't have numbers, right?");
        return;
      }

      // Height validation
      if (!heightVal.trim()) {
        setError("Please enter your height (e.g. 5ft 2in)");
        return;
      }
      // Simple check to ensure it has some numbers
      if (!/[0-9]/.test(heightVal)) {
        setError("Height should contain numbers!");
        return;
      }

      // Weight validation
      const w = parseFloat(weightVal);
      if (!weightVal || isNaN(w)) {
        setError("Please enter your weight as a number");
        return;
      }
      if (w < 20 || w > 300) {
        setError("Weight should be between 20kg and 300kg");
        return;
      }
    }

    if (isLogin) {
      // Login attempt
      const result = await validateLogin(email.trim(), password);
      if (result.success) {
        const userData = {
          ...result.user,
          avatar: result.user.avatar || null,
        };
        await signIn(userData);
      } else {
        if (result.errorType === "NOT_REGISTERED") {
          setShowWarning(true);
        } else {
          setError(result.message);
        }
      }
    } else {
      // Registration attempt
      const result = await registerUser({ 
        email: email.trim(), 
        password, 
        name: name.trim(), 
        height: heightVal, 
        weight: weightVal,
        avatar: null,
      });
      if (result.success) {
        const userData = {
          name: name.trim(),
          email: email.trim(),
          height: heightVal,
          weight: weightVal,
          avatar: null,
        };
        await signIn(userData);
      } else {
        setError(result.message);
      }
    }
  };

  const styles = makeStyles(C);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
        }}
        style={styles.background}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.content}
          >
            <View style={styles.header}>
              <Text style={styles.logo}>PulseFit</Text>
              <Text style={styles.tagline}>Elevate Your Fitness Journey</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>{isLogin ? "Sign In" : "Create Account"}</Text>
              
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#fff" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity 
                      style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
                      onPress={() => setShowHeightPicker(true)}
                    >
                      <Ionicons name="resize-outline" size={20} color="#fff" style={styles.inputIcon} />
                      <Text style={[styles.input, { color: heightVal ? "#fff" : "rgba(255,255,255,0.6)" }]}>
                        {heightVal || "Height"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}
                      onPress={() => setShowWeightPicker(true)}
                    >
                      <Ionicons name="fitness-outline" size={20} color="#fff" style={styles.inputIcon} />
                      <Text style={[styles.input, { color: weightVal ? "#fff" : "rgba(255,255,255,0.6)" }]}>
                        {weightVal || "Weight"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {isLogin && (
                <TouchableOpacity style={styles.forgotPass}>
                  <Text style={styles.forgotPassText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <LinearGradient
                  colors={[C.primary, "#ff8a9a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.footerLink}>
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Height Picker Modal */}
      <Modal visible={showHeightPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Your Height</Text>
            
            {/* Unit Switcher */}
            <View style={styles.unitSwitcher}>
              <TouchableOpacity 
                style={[styles.unitBtn, heightUnit === "ft" && styles.unitBtnActive]}
                onPress={() => setHeightUnit("ft")}
              >
                <Text style={[styles.unitBtnTxt, heightUnit === "ft" && styles.unitBtnTxtActive]}>FT / IN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitBtn, heightUnit === "cm" && styles.unitBtnActive]}
                onPress={() => setHeightUnit("cm")}
              >
                <Text style={[styles.unitBtnTxt, heightUnit === "cm" && styles.unitBtnTxtActive]}>CM</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerColumns}>
              {heightUnit === "ft" ? (
                <>
                  {/* Feet Column */}
                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Feet</Text>
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
                      {feetOptions.map(ft => (
                        <TouchableOpacity 
                          key={ft} 
                          style={[styles.pickerItem, tempFt === ft && styles.pickerItemActive]}
                          onPress={() => setTempFt(ft)}
                        >
                          <Text style={[styles.pickerItemTxt, tempFt === ft && styles.pickerItemTxtActive]}>{ft} ft</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Inches Column */}
                  <View style={styles.pickerCol}>
                    <Text style={styles.pickerColLabel}>Inches</Text>
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
                      {inchOptions.map(inc => (
                        <TouchableOpacity 
                          key={inc} 
                          style={[styles.pickerItem, tempIn === inc && styles.pickerItemActive]}
                          onPress={() => setTempIn(inc)}
                        >
                          <Text style={[styles.pickerItemTxt, tempIn === inc && styles.pickerItemTxtActive]}>{inc} in</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View style={[styles.pickerCol, { flex: 1 }]}>
                  <Text style={styles.pickerColLabel}>Centimeters</Text>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
                    {cmOptions.map(cm => (
                      <TouchableOpacity 
                        key={cm} 
                        style={[styles.pickerItem, tempCm === cm && styles.pickerItemActive]}
                        onPress={() => setTempCm(cm)}
                      >
                        <Text style={[styles.pickerItemTxt, tempCm === cm && styles.pickerItemTxtActive]}>{cm} cm</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.cutePrimaryBtn}
              onPress={() => {
                if (heightUnit === "ft") {
                  setHeightVal(`${tempFt}ft ${tempIn}in`);
                } else {
                  setHeightVal(`${tempCm} cm`);
                }
                setShowHeightPicker(false);
              }}
            >
              <Text style={styles.cutePrimaryBtnTxt}>Set Height</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowHeightPicker(false)}>
              <Text style={styles.cuteSecondaryBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weight Picker Modal */}
      <Modal visible={showWeightPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Your Weight</Text>
            
            {/* Unit Switcher */}
            <View style={styles.unitSwitcher}>
              <TouchableOpacity 
                style={[styles.unitBtn, weightUnit === "kg" && styles.unitBtnActive]}
                onPress={() => setWeightUnit("kg")}
              >
                <Text style={[styles.unitBtnTxt, weightUnit === "kg" && styles.unitBtnTxtActive]}>KG</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitBtn, weightUnit === "lb" && styles.unitBtnActive]}
                onPress={() => setWeightUnit("lb")}
              >
                <Text style={[styles.unitBtnTxt, weightUnit === "lb" && styles.unitBtnTxtActive]}>LB</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerColumns}>
              <View style={[styles.pickerCol, { flex: 1 }]}>
                <Text style={styles.pickerColLabel}>{weightUnit === "kg" ? "Kilograms" : "Pounds"}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.pickerScroll}>
                  {(weightUnit === "kg" ? kgOptions : lbOptions).map(val => (
                    <TouchableOpacity 
                      key={val} 
                      style={[styles.pickerItem, tempWeight === val && styles.pickerItemActive]}
                      onPress={() => setTempWeight(val)}
                    >
                      <Text style={[styles.pickerItemTxt, tempWeight === val && styles.pickerItemTxtActive]}>{val} {weightUnit}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.cutePrimaryBtn}
              onPress={() => {
                setWeightVal(`${tempWeight} ${weightUnit}`);
                setShowWeightPicker(false);
              }}
            >
              <Text style={styles.cutePrimaryBtnTxt}>Set Weight</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowWeightPicker(false)}>
              <Text style={styles.cuteSecondaryBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cute Warning Card Modal */}
      {showWarning && (
        <View style={styles.modalOverlay}>
          <View style={styles.cuteCard}>
            <View style={styles.cuteIconWrap}>
              <Text style={styles.cuteEmoji}>🌸</Text>
            </View>
            <Text style={styles.cuteTitle}>Oopsie!</Text>
            <Text style={styles.cuteSubtitle}>
              We couldn't find your account. Ready to start your fitness journey?
            </Text>
            <TouchableOpacity 
              style={styles.cutePrimaryBtn} 
              onPress={() => {
                setShowWarning(false);
                setIsLogin(false);
              }}
            >
              <Text style={styles.cutePrimaryBtnTxt}>Register Now ✨</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cuteSecondaryBtn} 
              onPress={() => setShowWarning(false)}
            >
              <Text style={styles.cuteSecondaryBtnTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    width: "100%",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fff",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: -4,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(20px)", // Works on web, handled by opacity on native
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPass: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPassText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    height: 56,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  footerLink: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    paddingHorizontal: 30,
  },
  cuteCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 320,
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  cuteIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  cuteEmoji: {
    fontSize: 32,
  },
  cuteTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    marginBottom: 12,
  },
  cuteSubtitle: {
    fontSize: 15,
    color: C.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  cutePrimaryBtn: {
    width: "100%",
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cutePrimaryBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cuteSecondaryBtn: {
    paddingVertical: 10,
  },
  cuteSecondaryBtnTxt: {
    color: C.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  pickerCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 320,
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginBottom: 20,
  },
  unitSwitcher: {
    flexDirection: "row",
    backgroundColor: C.primary + "10",
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
    width: "100%",
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
  },
  unitBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitBtnTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: C.muted,
  },
  unitBtnTxtActive: {
    color: C.primary,
  },
  pickerColumns: {
    flexDirection: "row",
    height: 200,
    marginBottom: 24,
  },
  pickerCol: {
    flex: 1,
    alignItems: "center",
  },
  pickerColLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  pickerScroll: {
    width: "100%",
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    marginHorizontal: 10,
  },
  pickerItemActive: {
    backgroundColor: C.primary + "15",
  },
  pickerItemTxt: {
    fontSize: 16,
    fontWeight: "600",
    color: C.muted,
  },
  pickerItemTxtActive: {
    color: C.primary,
    fontWeight: "800",
  },
});
