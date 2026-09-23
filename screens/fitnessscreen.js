import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, Modal, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessScreen({ navigation, route }) {
  const qrData = route.params?.qrData || '';
  const API_URL = 'https://envision-stumble-kept.ngrok-free.dev'; 
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const [promptPayNo, setPromptPayNo] = useState('');
  const [acceptQr, setAcceptQr] = useState(true); 

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (qrData) {
      loadAllData(qrData);
    } else {
      showPopup('error', 'ไม่พบรหัสอ้างอิง กรุณากลับไปสแกนใหม่');
      setIsLoading(false);
    }
  }, [qrData]);

  const loadAllData = async (code) => {
    setIsLoading(true);
    await Promise.all([fetchUserData(code), fetchSettings()]);
    setIsLoading(false);
  };

  const showPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const closePopupAndGoBack = () => {
    setPopupVisible(false);
    if (popupType === 'success' || popupMessage.includes('ไม่พบ')) {
      navigation.goBack();
    }
  };

  const fetchUserData = async (code) => {
    try {
      // 🌟 จุดที่แก้ไข 1: เพิ่ม Header ทะลุ ngrok ตอนดึงข้อมูลผู้ใช้งาน
      const response = await fetch(`${API_URL}/api/users/scan/${code}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setUserData(data); 
      } else {
        showPopup('error', data.message || 'รหัสสมาชิกนี้ไม่มีในระบบ');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const fetchSettings = async () => {
    try {
      // 🌟 จุดที่แก้ไข 2: เพิ่ม Header ทะลุ ngrok ตอนดึงข้อมูลการตั้งค่าแอดมิน
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      const ppNo = data.promptpay_no || data.promptpay || data.promptpay_number || '';
      if (ppNo) {
        setPromptPayNo(String(ppNo));
      }

      if (data.accept_qr !== undefined) {
        setAcceptQr(data.accept_qr);
      }

    } catch (error) {
      console.log('Error fetching settings:', error);
    }
  };

  const handleCompleteAction = async () => {
    try {
      const staffName = route.params?.staffName || route.params?.user?.full_name || route.params?.user?.name || 'เจ้าหน้าที่';

      const requestBody = {
        user_account_id: userData.id, 
        service_fee: userData.fee || 0,    
        payment_type: paymentMethod,  
        staff_name: staffName 
      };

      // 🌟 จุดที่แก้ไข 3: เพิ่ม Header ทะลุ ngrok ตอนส่งข้อมูลบันทึกการชำระเงิน
      const response = await fetch(`${API_URL}/api/fitness-usage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      const resData = await response.json();

      if (response.ok) {
        showPopup('success', 'บันทึกการเข้าใช้ฟิตเนสเรียบร้อยแล้ว');
      } else {
        showPopup('error', resData.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      showPopup('error', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={{ marginTop: 10, color: '#666' }}>กำลังดึงข้อมูลเพื่อชำระเงิน...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.formHeaderTitle}>ชำระค่าบริการฟิตเนส</Text>
          <View style={[styles.studentBadge, userData?.role_th === 'นักศึกษา' ? { backgroundColor: '#E6F5EF' } : { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.studentBadgeText, userData?.role_th === 'นักศึกษา' ? { color: '#00A87E' } : { color: '#D97706' }]}>
              {userData?.role_th || 'ไม่ทราบประเภท'}
            </Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <View style={styles.profileSection}>
          {userData?.avatar ? (
            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={50} color="#A0A0A0" />
            </View>
          )}

          <View style={[styles.roleBadge, userData?.role_th === 'นักศึกษา' ? { backgroundColor: '#E6F5EF' } : { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.roleBadgeText, userData?.role_th === 'นักศึกษา' ? { color: '#00A87E' } : { color: '#D97706' }]}>
              {userData?.role_th || userData?.role}
            </Text>
          </View>

          <Text style={styles.nameText}>{userData?.name}</Text>
          <Text style={styles.studentIdText}>รหัส: {userData?.code_id}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>วันที่เข้าใช้</Text>
          <View style={styles.inputBoxDisabled}>
            <Text style={styles.inputTextDisabled}>{new Date().toLocaleDateString('th-TH')}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ค่าบริการ (บาท)</Text>
          <View style={styles.inputBoxDisabled}>
            <Text style={[styles.inputTextDisabled, {color: '#D93025', fontWeight: 'bold'}]}>{userData?.fee || 0} บาท</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>วิธีการชำระเงิน</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity style={styles.radioBtn} onPress={() => setPaymentMethod('cash')}>
              <View style={[styles.radioCircle, paymentMethod === 'cash' && styles.radioSelected]} />
              <Text style={styles.radioText}>เงินสด</Text>
            </TouchableOpacity>
            
            {acceptQr && (
              <TouchableOpacity style={styles.radioBtn} onPress={() => setPaymentMethod('qr')}>
                <View style={[styles.radioCircle, paymentMethod === 'qr' && styles.radioSelected]} />
                <Text style={styles.radioText}>สแกน QR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {paymentMethod === 'qr' && acceptQr && (
          <View style={styles.qrCodeContainer}>
            <Text style={styles.qrCodeTitle}>ให้ผู้ใช้สแกน QR Code นี้</Text>
            
            {promptPayNo ? (
              <Image 
                source={{ uri: `https://promptpay.io/${promptPayNo}/${userData?.fee || 0}.png` }} 
                style={styles.qrCodeImage}
                resizeMode="contain" 
              />
            ) : (
              <View style={[styles.qrCodeImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 0 }]}>
                <Ionicons name="alert-circle-outline" size={40} color="#94A3B8" />
                <Text style={{color: '#64748B', marginTop: 10, fontSize: 12}}>ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์</Text>
              </View>
            )}
            
            <Text style={styles.qrCodeAmount}>ยอดชำระ: {userData?.fee || 0} บาท</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteAction}>
          <Text style={styles.submitBtnText}>ยืนยันการชำระเงิน</Text>
        </TouchableOpacity>
      </ScrollView>

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
            <TouchableOpacity style={[styles.btnModalOK, popupType === 'error' && { backgroundColor: '#D93025' }]} onPress={closePopupAndGoBack}>
              <Text style={styles.btnModalOKText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  formContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  formHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', justifyContent: 'space-between' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  formHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginRight: 8 },
  studentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  studentBadgeText: { fontSize: 12, fontWeight: 'bold' },
  
  formContent: { padding: 24, backgroundColor: '#FFF', margin: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  
  profileSection: { alignItems: 'center', marginBottom: 25, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, backgroundColor: '#EEE', borderWidth: 2, borderColor: '#E2E8F0', overflow: 'hidden' },
  
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  roleBadgeText: { fontSize: 13, fontWeight: 'bold' },
  
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  studentIdText: { fontSize: 14, color: '#64748B', marginTop: 4 },
  
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, color: '#334155', marginBottom: 8, fontWeight: '600' },
  inputBoxDisabled: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 16, height: 50, justifyContent: 'center' },
  inputTextDisabled: { fontSize: 15, color: '#94A3B8' },
  
  radioContainer: { flexDirection: 'row', alignItems: 'center', gap: 30, marginTop: 4, paddingVertical: 10 },
  radioBtn: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 8, backgroundColor: '#FFF' },
  radioSelected: { borderColor: '#F5A623', borderWidth: 6 },
  radioText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  
  qrCodeContainer: { alignItems: 'center', marginTop: 10, marginBottom: 15, padding: 20, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  qrCodeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  qrCodeImage: { width: 180, height: 180, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 },
  qrCodeAmount: { fontSize: 18, fontWeight: 'bold', color: '#D93025', marginTop: 15 },

  submitBtn: { backgroundColor: '#F5A623', height: 54, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', maxWidth: 350, backgroundColor: '#FFF', borderRadius: 16, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btnModalOK: { backgroundColor: '#1A73E8', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnModalOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
