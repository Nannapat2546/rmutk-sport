import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginStaffScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🌟 State สำหรับ Pop-up
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');
  const [userData, setUserData] = useState(null); // เก็บข้อมูลชั่วคราวเพื่อส่งไปหน้าถัดไป

  // 🌟 ฟังก์ชันจัดการ Pop-up
  const showPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    // ถ้าเข้าสู่ระบบสำเร็จ พอกดปิด Pop-up ให้เด้งไปหน้า Dashboard
    if (popupType === 'success' && userData) {
      navigation.replace('StaffDashboard', { user: userData });
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      showPopup('error', 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://rmutk-sport.onrender.com/api/login-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data.user); // เก็บข้อมูลผู้ใช้ไว้ก่อน
        showPopup('success', 'เข้าสู่ระบบสำเร็จ');
      } else {
        showPopup('error', data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาเช็กว่าเปิด Server ฝั่ง Backend แล้ว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
          <Text style={styles.backText}>ย้อนกลับ</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            
            <View style={styles.iconWrapper}>
              <Ionicons name="person-circle" size={48} color="#2563EB" />
            </View>

            <Text style={styles.title}>เจ้าหน้าที่ (Staff)</Text>
            <Text style={styles.subtitle}>
              เข้าสู่ระบบเพื่อจัดการศูนย์กีฬาและฟิตเนส RMUTK
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="อีเมลเจ้าหน้าที่"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin} 
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ</Text>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ================= 🌟 Custom Pop-up ================= */}
      <Modal transparent={true} visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons 
              name={popupType === 'success' ? 'checkmark-circle' : 'close-circle'} 
              size={65} 
              color={popupType === 'success' ? '#1E8E3E' : '#D93025'} 
            />
            <Text style={styles.modalTitle}>
              {popupType === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
            </Text>
            <Text style={styles.modalMessage}>{popupMessage}</Text>
            
            <TouchableOpacity 
              style={[styles.btnModalOK, { backgroundColor: popupType === 'success' ? '#1E8E3E' : '#D93025' }]} 
              onPress={closePopup}
            >
              <Text style={styles.btnModalOKText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
    alignSelf: 'flex-start',
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 30, 
    borderRadius: 16, 
    width: '100%', 
    maxWidth: 400, 
    ...Platform.select({ 
      web: { boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }, 
      default: { 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4 
      } 
    }) 
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#6B7280', 
    textAlign: 'center', 
    marginBottom: 30,
    lineHeight: 20
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: { 
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    outlineStyle: 'none',
  },
  button: { 
    backgroundColor: '#2563EB', 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10, 
    height: 52, 
    justifyContent: 'center' 
  },
  buttonDisabled: { 
    backgroundColor: '#93C5FD' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  footer: { 
    marginTop: 30, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    paddingTop: 20 
  },
  footerText: { 
    fontSize: 12, 
    color: '#9CA3AF' 
  },

  // 🌟 Styles สำหรับ Pop-up
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFF', borderRadius: 16, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btnModalOK: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnModalOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
