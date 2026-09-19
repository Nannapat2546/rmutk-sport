import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Modal, TextInput, Button, Alert, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function StaffDashboard({ route, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [isChangePwdVisible, setChangePwdVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const [hasNewNotification, setHasNewNotification] = useState(true);
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const API_URL = 'http://localhost:3000'; 
  const currentUser = route.params?.user || {};

  const menuItems = [
    { id: '1', title: 'การยืม', icon: 'clipboard-outline' },
    { id: '2', title: 'การคืน', icon: 'return-down-back-outline' },
    { id: '3', title: 'ฟิตเนส', icon: 'walk-outline' },
    { id: '4', title: 'จัดการอุปกรณ์', icon: 'football-outline' },
    { id: '5', title: 'รายชื่อสมาชิก', icon: 'people-outline' },
    { id: '6', title: 'รายงาน', icon: 'document-text-outline' },
  ];

  const handleMenuPress = (item) => {
    if (item.title === 'การยืม' || item.title === 'การคืน') {
      setActiveAction(item.title);
      setModalVisible(true);
      setIsCameraActive(true);
      setManualCode('');
    } 
    else if (item.title === 'ฟิตเนส') {
      navigation.navigate('FitnessScanner'); 
    } 
    else if (item.title === 'จัดการอุปกรณ์') {
      navigation.navigate('Equipment'); 
    } else if (item.title === 'รายชื่อสมาชิก') {
      navigation.navigate('MemberList'); 
    } else if (item.title === 'รายงาน') {
      navigation.navigate('Report'); 
    }
  };

  const handleScanSuccess = (code) => {
    setModalVisible(false);
    if (activeAction === 'การยืม') {
      navigation.navigate('Borrow', { qrData: code });
    } else if (activeAction === 'การคืน') {
      navigation.navigate('Return', { qrData: code });
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser || !currentUser.accountId) return alert('เซสชันหมดอายุ กรุณาออกจากระบบและเข้าสู่ระบบใหม่');
    if (!oldPassword || !newPassword || !confirmPassword) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    if (newPassword !== confirmPassword) return alert('รหัสผ่านใหม่ไม่ตรงกัน');
    if (newPassword.length < 6) return alert('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');

    setIsSavingPwd(true);
    try {
      const res = await fetch(`${API_URL}/api/change-password`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: currentUser.accountId, oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบใหม่');
        setChangePwdVisible(false);
        navigation.replace('LoginStaff'); 
      } else {
        alert('❌ ข้อผิดพลาด: ' + (data.message || 'รหัสผ่านเดิมไม่ถูกต้อง'));
      }
    } catch (error) {
      alert('❌ ข้อผิดพลาด: ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSavingPwd(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotif(true);
    try {
      const response = await fetch(`${API_URL}/api/recent-activities`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        const formattedNotifs = data.map(item => {
          let notifIcon, notifColor, notifBg;
          
          if (item.type === 'fitness') {
            notifIcon = 'barbell'; notifColor = '#0284C7'; notifBg = '#E0F2FE';
          } else if (item.type === 'borrow' || item.type === 'borrowing') {
            notifIcon = 'time'; notifColor = '#3B82F6'; notifBg = '#EFF6FF';
          } else if (item.type === 'partial_return') {
            notifIcon = 'warning'; notifColor = '#D97706'; notifBg = '#FEF3C7'; // สีส้มสำหรับคืนบางส่วน
          } else if (item.type === 'return') {
            notifIcon = 'checkmark-circle'; notifColor = '#10B981'; notifBg = '#D1FAE5';
          } else {
            notifIcon = 'notifications'; notifColor = '#64748B'; notifBg = '#F1F5F9';
          }

          return {
            id: `${item.type}_${item.id}`,
            type: item.type,
            title: item.title,
            detail: item.detail,
            staffName: item.staffName || item.staff_name || currentUser.name || 'ไม่ระบุ',
            date: new Date(item.date),
            icon: notifIcon,
            color: notifColor,
            bg: notifBg
          };
        });
        setNotifications(formattedNotifs);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  };

  // 🌟 ฟังก์ชันแบ่งกลุ่มวันที่
  const groupedNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { today: [], yesterday: [], older: [] };

    notifications.forEach(notif => {
      const nDate = new Date(notif.date);
      nDate.setHours(0, 0, 0, 0);
      if (nDate.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (nDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else {
        groups.older.push(notif);
      }
    });
    return groups;
  };

  const renderNotifItem = (notif) => (
    <View key={notif.id} style={styles.notifCard}>
      <View style={[styles.notifIconBox, { backgroundColor: notif.bg }]}>
        <Ionicons name={notif.icon} size={24} color={notif.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, notif.type === 'partial_return' && { color: '#D97706' }]}>
          {notif.title}
        </Text>
        <Text style={styles.notifDetail}>{notif.detail}</Text>
        
        <View style={styles.staffRow}>
          <Ionicons name="person-circle-outline" size={14} color="#64748B" />
          <Text style={styles.notifStaff}>ทำรายการโดย: {notif.staffName}</Text>
        </View>

        <Text style={styles.notifDate}>
          {notif.date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} น.
        </Text>
      </View>
    </View>
  );

  const groups = groupedNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          ระบบยืม-คืน <Text style={styles.headerHighlight}>อุปกรณ์กีฬาและการเข้าใช้ฟิตเนส</Text>
        </Text>
        
        <View style={styles.headerIconsContainer}>
          <TouchableOpacity 
            style={styles.bellIconButton} 
            onPress={() => {
              setHasNewNotification(false);
              setIsNotifVisible(true);
              fetchNotifications();
            }}
          >
            <Ionicons name="notifications-outline" size={26} color="#333" />
            {hasNewNotification && <View style={styles.redDot} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.divider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.7} onPress={() => handleMenuPress(item)}>
              <View style={styles.iconWrapper}>
                <Ionicons name={item.icon} size={40} color="#00A87E" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ================= Modal แจ้งเตือน ================= */}
      <Modal animationType="fade" transparent={true} visible={isNotifVisible} onRequestClose={() => setIsNotifVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalContainer}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>ประวัติการทำรายการล่าสุด</Text>
              <TouchableOpacity onPress={() => setIsNotifVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {loadingNotif ? (
              <ActivityIndicator size="large" color="#00A87E" style={{ padding: 40 }} />
            ) : (
              <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={false}>
                {notifications.length > 0 ? (
                  <>
                    {/* ส่วนของวันนี้ */}
                    {groups.today.length > 0 && (
                      <View>
                        <Text style={styles.dateGroupHeader}>วันนี้</Text>
                        {groups.today.map(renderNotifItem)}
                      </View>
                    )}
                    {/* ส่วนของเมื่อวาน */}
                    {groups.yesterday.length > 0 && (
                      <View>
                        <Text style={styles.dateGroupHeader}>เมื่อวาน</Text>
                        {groups.yesterday.map(renderNotifItem)}
                      </View>
                    )}
                    {/* ส่วนของก่อนหน้า */}
                    {groups.older.length > 0 && (
                      <View>
                        <Text style={styles.dateGroupHeader}>ก่อนหน้า</Text>
                        {groups.older.map(renderNotifItem)}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyNotif}>
                    <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
                    <Text style={styles.emptyNotifText}>ยังไม่มีประวัติการทำรายการ</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal เปลี่ยนรหัสผ่าน */}
      <Modal animationType="fade" transparent={true} visible={isChangePwdVisible} onRequestClose={() => setChangePwdVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>
              <TouchableOpacity onPress={() => { setChangePwdVisible(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 20 }}>
              <TextInput style={styles.pwdInput} placeholder="รหัสผ่านเดิม" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
              <TextInput style={styles.pwdInput} placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <TextInput style={styles.pwdInput} placeholder="ยืนยันรหัสผ่านใหม่" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnGray} onPress={() => setChangePwdVisible(false)} disabled={isSavingPwd}>
                <Text style={styles.btnGrayText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#00A87E', opacity: isSavingPwd ? 0.7 : 1 }]} onPress={handleChangePassword} disabled={isSavingPwd}>
                {isSavingPwd ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.btnTextWhite}>บันทึกรหัสผ่าน</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal สแกน QR */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 0, overflow: 'hidden' }]}>
            <View style={[styles.modalHeader, { padding: 20, paddingBottom: 15, marginBottom: 0 }]}>
              <Text style={styles.modalTitle}>สแกน QR สมาชิก ({activeAction})</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={styles.scannerBox}>
              {isCameraActive ? (
                permission && permission.granted ? (
                  <View style={{ flex: 1, width: '100%', position: 'relative' }}>
                    <CameraView style={StyleSheet.absoluteFillObject} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => handleScanSuccess(data)} />
                    <View style={styles.cameraOverlay}>
                      <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                    <Text style={{ textAlign: 'center', fontSize: 14, marginBottom: 10, color: '#666' }}>ต้องการสิทธิ์การใช้งานกล้อง</Text>
                    <Button title="ขอสิทธิ์เข้าถึงกล้อง" onPress={requestPermission} color="#00A87E" />
                  </View>
                )
              ) : (
                <View style={styles.manualInputWrapper}>
                  <TextInput style={styles.manualInput} placeholder="รหัสนักศึกษา 12 หลัก" placeholderTextColor="#999" value={manualCode} onChangeText={setManualCode} />
                </View>
              )}
            </View>
            <View style={[styles.modalFooter, { padding: 20, paddingTop: 10 }]}>
              <TouchableOpacity style={styles.btnGray} onPress={() => setIsCameraActive(!isCameraActive)}>
                <Text style={styles.btnGrayText}>{isCameraActive ? 'ป้อนรหัสด้วยตนเอง' : 'เปิดกล้องสแกน'}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                {isCameraActive ? (
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#D93025' }]} onPress={() => setIsCameraActive(false)}>
                    <Text style={styles.btnTextWhite}>หยุดกล้อง</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#1E8E3E' }]} onPress={() => { if (manualCode) handleScanSuccess(manualCode); else Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสสมาชิกก่อนทำรายการ'); }}>
                    <Text style={styles.btnTextWhite}>ตกลง</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* เมนูจัดการระบบ */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <SafeAreaView style={styles.menuModalContainer}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuDropdown} onStartShouldSetResponder={() => true}>
              <View style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 }}>
                <TouchableOpacity onPress={() => setMenuVisible(false)}>
                  <Ionicons name="close-outline" size={32} color="#333" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.menuListItem} onPress={() => { setMenuVisible(false); setChangePwdVisible(true); }}>
                <Ionicons name="key-outline" size={24} color="#00A87E" style={{ marginRight: 15 }} />
                <Text style={styles.menuListItemText}>เปลี่ยนรหัสผ่าน</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuListItem} onPress={() => { setMenuVisible(false); navigation.replace('LoginStaff'); }}>
                <Ionicons name="log-out-outline" size={24} color="#D93025" style={{ marginRight: 15 }} />
                <Text style={[styles.menuListItemText, { color: '#D93025' }]} >ออกจากระบบ</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, backgroundColor: '#FFFFFF', zIndex: 10 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  headerHighlight: { color: '#00A87E' },
  headerIconsContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  bellIconButton: { position: 'relative', padding: 2 },
  redDot: { position: 'absolute', top: 2, right: 3, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 1.5, borderColor: '#FFF' },
  iconButton: { padding: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', width: '100%' },

  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 600, gap: 20, paddingHorizontal: 20 },
  card: { flexDirection: 'column', width: '46%', maxWidth: 260, height: 160, backgroundColor: '#FFFFFF', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 5 },
  iconWrapper: { marginBottom: 12, height: 65, width: 65, borderRadius: 32.5, backgroundColor: '#E6F5EF', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },

  notifModalContainer: { width: '90%', maxWidth: 450, backgroundColor: '#FFF', borderRadius: 12, maxHeight: '80%', elevation: 10, ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } }) },
  notifModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  notifScroll: { padding: 15 },
  
  // 🌟 สไตล์สำหรับหัวข้อแบ่งกลุ่มวันที่
  dateGroupHeader: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginTop: 10, marginBottom: 12, marginLeft: 5 },
  
  notifCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  notifIconBox: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  notifDetail: { fontSize: 13, color: '#475569', marginBottom: 4, lineHeight: 18 },
  staffRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  notifStaff: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '500' },
  notifDate: { fontSize: 11, color: '#94A3B8' },
  
  emptyNotif: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyNotifText: { marginTop: 12, color: '#9CA3AF', fontSize: 15, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  scannerBox: { width: '100%', height: 260, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 170, height: 170, backgroundColor: 'transparent', position: 'relative' }, 
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#FFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },

  manualInputWrapper: { width: '85%', justifyContent: 'center' },
  manualInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, height: 50, backgroundColor: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  pwdInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, height: 50, backgroundColor: '#F8FAFC', fontSize: 15, marginBottom: 12 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btnGray: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnGrayText: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnTextWhite: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },

  menuModalContainer: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-start' },
  menuDropdown: { backgroundColor: '#FFFFFF', width: '100%', paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5 },
  menuListItem: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 25, width: '100%', alignItems: 'center' },
  menuListItemText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});