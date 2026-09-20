import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ================= Custom Dropdown Component =================
const CustomDropdown = ({ label, options, selectedValue, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.inputGroup, { zIndex: isOpen ? 100 : 1, elevation: isOpen ? 100 : 1 }]}>
      <Text style={styles.inputLabel}>
        {label} <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <View style={{ position: 'relative' }}>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.8}>
          <Text style={[styles.inputText, !selectedValue && { color: '#94A3B8' }]}>
            {selectedValue ? (selectedValue.item_name || selectedValue.name || 'อุปกรณ์') : placeholder}
          </Text>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {options.length > 0 ? options.map((item, index) => {
                const availableStock = item.available_qty ?? item.qty ?? item.amount ?? 0;
                const itemName = item.item_name ?? item.name ?? 'ไม่ระบุชื่อ';
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.dropdownItem} 
                    onPress={() => { onSelect(item); setIsOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {itemName} <Text style={{color: '#059669', fontSize: 13}}>(ว่าง {availableStock})</Text>
                    </Text>
                  </TouchableOpacity>
                );
              }) : (
                <Text style={{ padding: 16, color: '#94A3B8', textAlign: 'center' }}>ไม่มีอุปกรณ์ว่างให้ยืม</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default function BorrowScreen({ navigation, route }) {
  const qrData = route.params?.qrData || '';
  const API_URL = 'http://https://app-rmutk-sports.onrender.com'; 
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  // ข้อมูลฟอร์ม
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [borrowQty, setBorrowQty] = useState('1');
  
  // Pop-up แจ้งเตือน
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');

  // ฟอร์แมตวันที่ปัจจุบัน
  const today = new Date();
  const currentDateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth()+1).padStart(2, '0')}/${today.getFullYear()+543}`;

  useEffect(() => {
    if (qrData) {
      fetchUserDataAndEquipment(qrData);
    } else {
      showPopup('error', 'ไม่พบข้อมูล QR Code');
    }
  }, [qrData]);

  const showPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const closePopupAndGoBack = () => {
    setPopupVisible(false);
    if (popupType === 'success' || popupMessage === 'ไม่พบข้อมูล QR Code') {
      navigation.goBack();
    }
  };

  const fetchUserDataAndEquipment = async (code) => {
    try {
      const userRes = await fetch(`${API_URL}/api/users/scan/${code}`);
      const userResult = await userRes.json();
      
      if (!userRes.ok) return showPopup('error', userResult.message || 'รหัสสมาชิกนี้ไม่มีในระบบ');
      
      if (userResult.role === 'external' || userResult.account_type === 'external') {
        return showPopup('error', 'ไม่อนุญาตให้ทำรายการ สิทธิ์การยืมสงวนไว้สำหรับนักศึกษาและเจ้าหน้าที่เท่านั้น');
      }
      
      setUserData(userResult);

      const equipRes = await fetch(`${API_URL}/api/inventory/manage`);
      if (equipRes.ok) {
        const equipData = await equipRes.json();
        const availableItems = equipData.filter(item => {
          const qty = parseInt(item.available_qty ?? item.qty ?? item.amount ?? 0);
          return qty > 0;
        });
        setEquipmentList(availableItems);
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ฟังก์ชันกดบันทึกการยืมที่ปรับปรุงใหม่ ป้องกันปุ่มค้างและแสดง Error ชัดเจน
  const handleBorrowSubmit = async () => {
    if (!selectedEquip) return showPopup('error', 'กรุณาเลือกอุปกรณ์ที่ต้องการยืม');
    if (!borrowQty || parseInt(borrowQty) <= 0) return showPopup('error', 'กรุณาระบุจำนวนที่ต้องการยืม');
    
    const qtyToBorrow = parseInt(borrowQty);
    const availableStock = parseInt(selectedEquip.available_qty ?? selectedEquip.qty ?? selectedEquip.amount ?? 0);

    if (qtyToBorrow > availableStock) {
      return showPopup('error', `อุปกรณ์ไม่เพียงพอ (ว่าง ${availableStock} ชิ้น)`);
    }

    if (!userData) {
      return showPopup('error', 'ไม่พบข้อมูลผู้ใช้งาน กรุณาสแกน QR Code ใหม่');
    }

    try {
      // ดึง ID ผู้ใช้และอุปกรณ์ รองรับทุกรูปแบบตัวแปร
      const borrowerId = userData.account_id || userData.id || userData.user_id || qrData;
      const invId = selectedEquip.id || selectedEquip.inventory_id || selectedEquip.item_id;

      const payload = {
        borrower_account_id: borrowerId,
        inventory_id: invId,
        qty: qtyToBorrow
      };

      const response = await fetch(`${API_URL}/api/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok) {
        showPopup('success', 'บันทึกการยืมอุปกรณ์สำเร็จ!');
      } else {
        showPopup('error', resData.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>กำลังดึงข้อมูล...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, position: 'absolute', left: 16 }}>
          <Ionicons name="arrow-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ทำรายการยืมอุปกรณ์กีฬา</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mainCard}>
          
          <View style={styles.profileSection}>
            {userData?.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="basketball" size={60} color="#F59E0B" />
              </View>
            )}

            <View style={[styles.roleBadge, userData?.role_th === 'นักศึกษา' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.roleBadgeText, userData?.role_th === 'นักศึกษา' ? { color: '#059669' } : { color: '#2563EB' }]}>
                {userData?.role_th || 'นักศึกษา'}
              </Text>
            </View>

            <Text style={styles.nameText}>{userData?.name || userData?.full_name || 'XXXXXX XXXXXX'}</Text>
            <Text style={styles.studentIdText}>รหัส: {userData?.code_id || 'xxxxxxxxxxxxx'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>วันที่ทำรายการ</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{currentDateString}</Text>
            </View>
          </View>

          <CustomDropdown 
            label="อุปกรณ์ที่ต้องการยืม" 
            options={equipmentList} 
            selectedValue={selectedEquip} 
            onSelect={setSelectedEquip} 
            placeholder="-- เลือกอุปกรณ์ --"
          />

          <View style={[styles.inputGroup, { zIndex: 0 }]}>
            <Text style={styles.inputLabel}>
              จำนวน <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={styles.inputWithUnitWrapper}>
              <TextInput 
                style={styles.numberInput} 
                value={borrowQty} 
                onChangeText={setBorrowQty} 
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>/ ชิ้น</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleBorrowSubmit}>
            <Text style={styles.submitBtnText}>บันทึกการยืมอุปกรณ์</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>

      {/* ================= 🌟 Pop-up แจ้งเตือน ================= */}
      <Modal transparent={true} visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalBox}>
            {popupType === 'success' ? (
              <View style={styles.alertSuccessIconBg}>
                <Ionicons name="checkmark" size={48} color="#FFF" />
              </View>
            ) : (
              <View style={styles.alertErrorIconBg}>
                <Ionicons name="close" size={48} color="#FFF" />
              </View>
            )}

            <Text style={styles.alertModalTitle}>
              {popupType === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
            </Text>
            
            <Text style={styles.alertModalMessage}>
              {popupMessage}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.alertModalBtn, 
                popupType === 'success' ? styles.alertBtnSuccess : styles.alertBtnError
              ]} 
              onPress={closePopupAndGoBack}
            >
              <Text style={styles.alertModalBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  content: { padding: 16 },
  mainCard: { 
    width: '100%', 
    maxWidth: 800, 
    alignSelf: 'center',
    backgroundColor: '#FFF', 
    borderRadius: 8, 
    padding: 30, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3 
  },
  
  profileSection: { alignItems: 'center', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  roleBadgeText: { fontSize: 13, fontWeight: 'bold' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  studentIdText: { fontSize: 14, color: '#64748B' },

  divider: { height: 1, backgroundColor: '#F1F5F9', width: '100%', marginVertical: 25 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, color: '#111827', marginBottom: 10, fontWeight: 'bold' },
  
  readOnlyInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 16, height: 48, justifyContent: 'center' },
  readOnlyText: { fontSize: 15, color: '#64748B' },
  
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, backgroundColor: '#FFF', paddingHorizontal: 16, height: 48 },
  inputText: { fontSize: 15, color: '#111827' },
  dropdownList: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, maxHeight: 180, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropdownItemText: { fontSize: 15, color: '#1E293B' },
  
  inputWithUnitWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, backgroundColor: '#FFF', height: 48, paddingHorizontal: 16 },
  numberInput: { flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  unitText: { fontSize: 15, color: '#111827' },

  submitBtn: { backgroundColor: '#F59E0B', height: 50, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertModalBox: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 5,
  },
  alertSuccessIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertErrorIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  alertModalMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertModalBtn: {
    width: '100%',
    height: 46,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnSuccess: { backgroundColor: '#F59E0B' },
  alertBtnError: { backgroundColor: '#DC2626' },
  alertModalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});