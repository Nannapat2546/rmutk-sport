import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert, // เพิ่ม Alert สำหรับแจ้งเตือน
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    try {
      const response = await fetch('https://rmutk-sport.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- ส่วนที่แก้: แนบข้อมูล userData และ role ไปกับ navigation ---
        navigation.navigate('home', { 
          userData: data.user, 
          role: data.role 
        });
        
      } else {
        // ถ้ารหัสผิด หรือไม่มีอีเมลนี้ในระบบ
        alert('เข้าไม่ได้: ' + data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* ส่วนหัวข้อ */}
        <View style={styles.header}>
          <Text style={styles.title}>เข้าสู่ระบบ</Text>
          <Text style={styles.subtitle}>กรอกอีเมลและรหัสผ่านของคุณ</Text>
        </View>

        {/* ฟอร์มกรอกข้อมูล */}
        <View style={styles.formContainer}>
          
          {/* ช่องกรอกอีเมล */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* ช่องกรอกรหัสผ่าน */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่าน"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* ปุ่มเข้าสู่ระบบ */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>

        </View>

        {/* เส้นคั่น "หรือ" */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>หรือ</Text>
          <View style={styles.line} />
        </View>

        {/* ลิงก์ไปหน้าสมัครสมาชิก */}
        <TouchableOpacity onPress={() => navigation.navigate('SelectType')}>
          <Text style={styles.registerLinkText}>สมัครสมาชิก</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center', 
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center', 
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#333333',
    outlineStyle: 'none', 
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0d6efd', 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#888888',
  },
  registerLinkText: {
    fontSize: 15,
    color: '#0d6efd', 
    textDecorationLine: 'underline', 
  },
});
