import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Image, ActivityIndicator, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 

const CustomDropdown = ({ label, options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.inputGroup, { flex: 1, zIndex: isOpen ? 100 : 1 }]}>
      {label && (
        <Text style={styles.inputLabel}>
          {label}
        </Text>
      )}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.8}>
          <Text style={styles.inputText}>{selectedValue}</Text>
          <View style={styles.stepperIcons}>
            <Ionicons name="chevron-up" size={14} color="#64748B" />
            <Ionicons name="chevron-down" size={14} color="#64748B" />
          </View>
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {options.map((item, index) => (
                <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => { onSelect(item); setIsOpen(false); }}>
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default function ReturnScreen({ navigation, route }) {
  const qrData = route.params?.qrData || '';
  
  const API_URL = 'https://envision-stumble-kept.ngrok-free.dev'; 
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  
  const [normalQty, setNormalQty] = useState(0);
  const [brokenQty, setBrokenQty] = useState(0);
  
  const [expectedDate, setExpectedDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);   
  const [webDateText, setWebDateText] = useState(''); 

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');
  const [partialModalVisible, setPartialModalVisible] = useState(false);

  useEffect(() => {
    if (qrData) {
      fetchUserDataAndPendingItem(qrData);
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
    if (popupType === 'success' || popupMessage === 'ไม่พบข้อมูล QR Code' || popupMessage === 'ผู้ใช้นี้ไม่มีอุปกรณ์ค้างส่ง') {
      navigation.goBack();
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()+543}`;
  };

  const formatDisplayDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const fetchUserDataAndPendingItem = async (code) => {
    try {
      // 🌟 จุดที่ 1: เพิ่ม Header ทะลุ ngrok ดึงข้อมูลผู้ใช้งาน
      const userRes = await fetch(`${API_URL}/api/users/scan/${code}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const userResult = await userRes.json();
      
      if (!userRes.ok) return showPopup('error', userResult.message || 'รหัสสมาชิกนี้ไม่มีในระบบ');
      setUserData(userResult);

      // 🌟 จุดที่ 2: เพิ่ม Header ทะลุ ngrok ดึงข้อมูลรายการยืมที่ค้างส่ง
      const pendingRes = await fetch(`${API_URL}/api/returns/pending/${userResult.id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const pendingResult = await pendingRes.json();

      if (!pendingRes.ok) return showPopup('error', 'ผู้ใช้นี้ไม่มีอุปกรณ์ค้างส่ง');

      setTransactionData(pendingResult);
      setNormalQty(parseInt(pendingResult.borrowed_qty) || 0); 
      setBrokenQty(0);

    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreSubmit = () => {
    if (!transactionData) return showPopup('error', 'ไม่พบข้อมูลรายการที่ค้างส่ง');
    
    const totalReturn = parseInt(normalQty) + parseInt(brokenQty);
    const borrowed = parseInt(transactionData.borrowed_qty);
    
    if (totalReturn === 0) return showPopup('error', 'กรุณาระบุจำนวนที่ต้องการคืน');
    if (totalReturn > borrowed) return showPopup('error', `จำนวนที่คืนรวมกัน (${totalReturn} ชิ้น) เกินกว่าจำนวนที่ยืมไป (${borrowed} ชิ้น)`);

    if (totalReturn < borrowed) {
      setPartialModalVisible(true);
    } else {
      processReturnAPI(null);
    }
  };

  const processReturnAPI = async (expectedReturnDateStr) => {
    setPartialModalVisible(false);
    try {
      const requestBody = {
        transaction_id: transactionData.transaction_id,
        inventory_id: transactionData.inventory_id,
        normal_qty: normalQty,
        broken_qty: brokenQty,
        borrowed_qty: parseInt(transactionData.borrowed_qty),
        new_expected_date: expectedReturnDateStr, 
      };

      // 🌟 จุดที่ 3: เพิ่ม Header ทะลุ ngrok บันทึกการทำรายการคืน
      const response = await fetch(`${API_URL}/api/return`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      const resData = await response.json();

      if (response.ok) {
        showPopup('success', 'บันทึกการส่งคืนอุปกรณ์สำเร็จ!');
      } else {
        showPopup('error', resData.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      showPopup('error', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  const qtyOptions = transactionData ? Array.from({length: transactionData.borrowed_qty + 1}, (_, i) => i) : [0];
  const totalReturn = normalQty + brokenQty;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>กำลังดึงข้อมูลค้างคืน...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= Header ================= */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, position: 'absolute', left: 16 }}>
          <Ionicons name="arrow-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ทำรายการคืนอุปกรณ์กีฬา</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mainCard}>
          
          {/* ================= Profile Section ================= */}
          <View style={styles.profileSection}>
            {userData?.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={50} color="#CBD5E1" />
              </View>
            )}

            <View style={[styles.roleBadge, userData?.role_th === 'นักศึกษา' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.roleBadgeText, userData?.role_th === 'นักศึกษา' ? { color: '#059669' } : { color: '#D97706' }]}>
                {userData?.role_th || 'นักศึกษา'}
              </Text>
            </View>

            <Text style={styles.nameText}>{userData?.name || 'XXXXXX XXXXXX'}</Text>
            <Text style={styles.studentIdText}>รหัส: {userData?.code_id || 'xxxxxxxxxxxxx'}</Text>
          </View>

          {/* ================= Borrow Info Section ================= */}
          <View style={styles.borrowInfoCard}>
            <Text style={styles.borrowInfoTitle}>ข้อมูลรายการยืม</Text>
            
            <View style={styles.borrowInfoRow}>
              <View style={styles.borrowInfoCol}>
                <Text style={styles.borrowInfoLabel}>วันที่ยืม</Text>
                <Text style={styles.borrowInfoValue}>{formatDate(transactionData?.borrow_date)}</Text>
              </View>
              
              <View style={styles.borrowInfoCol}>
                <Text style={styles.borrowInfoLabel}>อุปกรณ์</Text>
                <Text style={styles.borrowInfoValue}>{transactionData?.item_name || 'xxxxxx'}</Text>
              </View>
              
              <View style={styles.borrowInfoCol}>
                <Text style={styles.borrowInfoLabel}>จำนวนที่ยืม</Text>
                <Text style={styles.borrowInfoValue}>{transactionData?.borrowed_qty || 0} ชิ้น</Text>
              </View>
              
              <View style={styles.borrowInfoCol}>
                <Text style={styles.borrowInfoLabel}>สภาพอุปกรณ์</Text>
                <Text style={styles.borrowInfoValue}>ปกติ</Text>
              </View>
            </View>
          </View>

          {/* ================= Return Action Section ================= */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>ทำรายการคืน</Text>
            
            <Text style={styles.inputLabel}>จำนวนที่คืน (ชิ้น)</Text>
            <View style={[styles.readOnlyInput, { marginBottom: 20 }]}>
              <Text style={styles.readOnlyText}>{totalReturn}</Text>
            </View>

            <Text style={styles.inputLabel}>สภาพอุปกรณ์ที่คืน</Text>
            <View style={styles.rowInputs}>
              <CustomDropdown label="ปกติ (ชิ้น)" options={qtyOptions} selectedValue={normalQty} onSelect={setNormalQty} />
              <View style={{ width: 16 }} />
              <CustomDropdown label="ชำรุด (ชิ้น)" options={qtyOptions} selectedValue={brokenQty} onSelect={setBrokenQty} />
            </View>

            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                คืน {totalReturn} ชิ้น | ปกติ {normalQty} ชิ้น | ชำรุด {brokenQty} ชิ้น
              </Text>
            </View>
          </View>

          {/* ================= Submit Button ================= */}
          <TouchableOpacity style={styles.submitBtn} onPress={handlePreSubmit}>
            <Text style={styles.submitBtnText}>บันทึกการคืนอุปกรณ์</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>

      {/* ================= 📍 Modal คืนไม่ครบ ================= */}
      <Modal transparent={true} visible={partialModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>คืนอุปกรณ์ไม่ครบตามจำนวน</Text>
            <Text style={styles.modalSubtitle}>กรุณาตรวจสอบยอดคืนและระบุวันนัดคืนรอบใหม่</Text>
            
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>ยอดที่ยืมทั้งหมด</Text>
                <Text style={styles.modalStatValue}>{transactionData?.borrowed_qty || 0} ชิ้น</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>ทำรายการคืน</Text>
                <Text style={styles.modalStatValue}>{totalReturn} ชิ้น</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>นักศึกษายังมียอดค้างส่งอีก {transactionData?.borrowed_qty - totalReturn} ชิ้น</Text>
              {brokenQty > 0 && (
                <Text style={styles.warningText}>มีอุปกรณ์ชำรุด {brokenQty} ชิ้น กรุณาตรวจสอบความเสียหาย</Text>
              )}
            </View>

            <View style={{ width: '100%', marginBottom: 25 }}>
              <Text style={styles.modalInputLabel}>วันนัดคืนรอบใหม่ <Text style={{ color: '#EF4444' }}>*</Text></Text>
              
              {Platform.OS === 'web' ? (
                <View style={styles.dateInputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.dateIcon} />
                  <TextInput 
                    style={styles.dateInputBox} 
                    placeholder="วัน/เดือน/ปี (เช่น 15/04/2569)" 
                    value={webDateText} 
                    onChangeText={setWebDateText} 
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.dateIcon} />
                    <Text style={styles.dateInputText}>{formatDisplayDate(expectedDate)}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker 
                      value={expectedDate} 
                      mode="date" 
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                      minimumDate={new Date()} 
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') setShowDatePicker(false);
                        if (selectedDate) setExpectedDate(selectedDate);
                      }}
                    />
                  )}
                  {Platform.OS === 'ios' && showDatePicker && (
                    <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 5, padding: 5 }} onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>เสร็จสิ้น</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPartialModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={() => {
                let dbDateString = null;
                if (Platform.OS === 'web') {
                  if(!webDateText) return alert("กรุณาระบุวันที่คาดว่าจะคืน");
                  const parts = webDateText.split('/');
                  if (parts.length === 3) {
                    const year = parseInt(parts[2]) - 543; 
                    const month = parts[1].padStart(2, '0');
                    const day = parts[0].padStart(2, '0');
                    dbDateString = `${year}-${month}-${day}`;
                  } else {
                    return alert("รูปแบบวันที่ไม่ถูกต้อง กรุณาระบุ วว/ดด/ปปปป");
                  }
                } else {
                  if(!expectedDate) return alert("กรุณาระบุวันที่คาดว่าจะคืน");
                  const year = expectedDate.getFullYear(); 
                  const month = String(expectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(expectedDate.getDate()).padStart(2, '0');
                  dbDateString = `${year}-${month}-${day}`;
                }
                processReturnAPI(dbDateString); 
              }}>
                <Text style={styles.modalBtnConfirmText}>ยืนยันและบันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= 🌟 Pop-up แจ้งเตือนแบบใหม่ ================= */}
      <Modal transparent={true} visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalBox}>
            
            {/* ไอคอนด้านบน */}
            {popupType === 'success' ? (
              <View style={styles.alertSuccessIconBg}>
                <Ionicons name="checkmark" size={48} color="#FFF" />
              </View>
            ) : (
              <View style={styles.alertErrorIconBg}>
                <Ionicons name="close" size={48} color="#FFF" />
              </View>
            )}

            {/* หัวข้อแจ้งเตือน */}
            <Text style={styles.alertModalTitle}>
              {popupType === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
            </Text>
            
            {/* รายละเอียด */}
            <Text style={styles.alertModalMessage}>
              {popupMessage}
            </Text>
            
            {/* ปุ่มกด */}
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
  
  content: { padding: 16, alignItems: 'center' },
  mainCard: { 
    width: '100%', 
    maxWidth: 800, 
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
  
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  roleBadgeText: { fontSize: 13, fontWeight: 'bold' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  studentIdText: { fontSize: 14, color: '#64748B' },

  borrowInfoCard: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 6,
    padding: 20,
    marginBottom: 20,
  },
  borrowInfoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  borrowInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  borrowInfoCol: {
    flex: 1,
    minWidth: '22%',
  },
  borrowInfoLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  borrowInfoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },

  sectionBox: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 6, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },

  inputGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 13, color: '#111827', marginBottom: 8, fontWeight: 'bold' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  
  readOnlyInput: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 4, backgroundColor: '#FFF', paddingHorizontal: 16, height: 46, justifyContent: 'center' },
  readOnlyText: { fontSize: 15, color: '#111827', fontWeight: 'bold' },
  
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, backgroundColor: '#FFF', paddingHorizontal: 16, height: 46 },
  inputText: { fontSize: 16, color: '#111827', fontWeight: 'bold' },
  stepperIcons: { alignItems: 'center', justifyContent: 'center', paddingLeft: 10 },
  dropdownList: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, maxHeight: 150, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  dropdownItemText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  
  summaryBar: { backgroundColor: '#F1F5F9', borderRadius: 4, padding: 14, marginTop: 20, alignItems: 'center' },
  summaryText: { fontSize: 13, color: '#111827', fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#F59E0B', height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

  // ================= Modal =================
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 8, padding: 24, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20 },
  
  modalStatsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16, gap: 12 },
  modalStatBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 6, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  modalStatLabel: { fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: '500' },
  modalStatValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  warningBox: { width: '100%', backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE047', borderRadius: 6, padding: 16, marginBottom: 20 },
  warningText: { fontSize: 14, color: '#D97706', fontWeight: 'bold', marginVertical: 2, textAlign: 'center' },
  
  modalInputLabel: { fontSize: 14, color: '#111827', fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start' },
  dateInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, backgroundColor: '#FFF', height: 48, paddingHorizontal: 12 },
  dateIcon: { marginRight: 10 },
  dateInputBox: { flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  dateInputText: { flex: 1, fontSize: 15, color: '#111827' },

  modalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancelText: { color: '#475569', fontWeight: 'bold', fontSize: 15 },
  modalBtnConfirm: { flex: 1, backgroundColor: '#F59E0B', height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  modalBtnConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // ================= 🌟 สไตล์ของ Alert Modal แจ้งเตือน =================
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
  alertBtnSuccess: {
    backgroundColor: '#F59E0B',
  },
  alertBtnError: {
    backgroundColor: '#DC2626',
  },
  alertModalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
