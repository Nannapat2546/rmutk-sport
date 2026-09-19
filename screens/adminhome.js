import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Platform, SafeAreaView, ActivityIndicator, RefreshControl, Switch, TextInput, Modal, Alert, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- Mapping แปลงภาษาอังกฤษเป็นไทยสำหรับคณะและสาขา ---
const facultyNameThai = {
  'arts': 'คณะศิลปศาสตร์',
  'science': 'คณะวิทยาศาสตร์และเทคโนโลยี',
  'industrial_education': 'คณะครุศาสตร์อุตสาหกรรม',
  'engineering': 'คณะวิศวกรรมศาสตร์',
  'business': 'คณะบริหารธุรกิจ',
  'home_economics': 'คณะเทคโนโลยีคหกรรมศาสตร์',
  'textile': 'คณะอุตสาหกรรมสิ่งทอ',
  'international_college': 'วิทยาลัยนานาชาติ',
  'isic': 'สถาบันวิทยาศาสตร์ นวัตกรรมและวัฒนธรรม',
};

const majorNameThai = {
  'english': 'ภาษาอังกฤษเพื่อการสื่อสารสากล', 'chinese': 'ภาษาจีนเพื่อการสื่อสาร', 'japanese': 'ภาษาญี่ปุ่น', 'tourism': 'การท่องเที่ยว', 'hotel': 'การโรงแรม',
  'cs': 'วิทยาการคอมพิวเตอร์', 'it': 'เทคโนโลยีสารสนเทศ', 'chemistry': 'เคมี', 'physics': 'ฟิสิกส์', 'math': 'คณิตศาสตร์', 'food_science': 'วิทยาศาสตร์และเทคโนโลยีการอาหาร',
  'te_me': 'ครุศาสตร์อุตสาหกรรม (เครื่องกล)', 'te_ie': 'ครุศาสตร์อุตสาหกรรม (อุตสาหการ)',
  'me': 'วิศวกรรมเครื่องกล', 'ee': 'วิศวกรรมไฟฟ้า', 'ce': 'วิศวกรรมคอมพิวเตอร์', 'civil': 'วิศวกรรมโยธา', 'ie': 'วิศวกรรมอุตสาหการ', 'che': 'วิศวกรรมเคมี', 'se': 'วิศวกรรมสำรวจ', 'electronic': 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม',
  'acc': 'การบัญชี', 'is': 'ระบบสารสนเทศ', 'marketing': 'การตลาด', 'management': 'การจัดการ', 'finance': 'การเงิน', 'international_business': 'ธุรกิจระหว่างประเทศ',
  'food_nutrition': 'อาหารและโภชนาการ', 'fashion': 'การออกแบบแฟชั่น', 'early_childhood': 'การศึกษาปฐมวัย',
  'textile_eng': 'วิศวกรรมสิ่งทอ', 'textile_design': 'การออกแบบสิ่งทอ', 'garment': 'เทคโนโลยีเสื้อผ้า',
  'ic_biz': 'บริหารธุรกิจ (นานาชาติ)', 'ic_tourism': 'การท่องเที่ยว (นานาชาติ)',
  'innovation': 'นวัตกรรมและวัฒนธรรม',
};

const monthOptions = [
  { id: 'all', name: 'ดูรวมทั้งปี' }, { id: '1', name: 'มกราคม' }, { id: '2', name: 'กุมภาพันธ์' },
  { id: '3', name: 'มีนาคม' }, { id: '4', name: 'เมษายน' }, { id: '5', name: 'พฤษภาคม' },
  { id: '6', name: 'มิถุนายน' }, { id: '7', name: 'กรกฎาคม' }, { id: '8', name: 'สิงหาคม' },
  { id: '9', name: 'กันยายน' }, { id: '10', name: 'ตุลาคม' }, { id: '11', name: 'พฤศจิกายน' }, { id: '12', name: 'ธันวาคม' },
];

export default function AdminDashboard({ navigation, route }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [viewMode, setViewMode] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState('all'); 
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // 🌟 State สำหรับเก็บ Index ของกราฟที่ถูกกด (Tooltip)
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const adminAccountId = route.params?.userData?.accountId || 
                         route.params?.userData?.account_id || 
                         route.params?.userData?.id || 
                         route.params?.accountId || 
                         route.params?.id;

  const [stats, setStats] = useState({
    fitnessUsers: 0, revenue: 0, cash: 0, qr: 0, borrowed: 0, notReturned: 0, overdue: 0,
    chartBar: [],
    peakUsage: { label: '-', value: 0 },
    popularEquipment: []
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPasswordAdmin, setNewPasswordAdmin] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [systemSettings, setSystemSettings] = useState({
    fitness_fee_student: '5',
    fitness_fee_external: '20',
    max_borrow_days: '7',
    max_borrow_items: '5',
    open_time: '06:00 AM',
    close_time: '09:00 PM',
    accept_qr: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/dashboard-stats?mode=${viewMode}&month=${selectedMonth}`);
      if (response.ok) {
        const result = await response.json();
        setStats(result);
      }
    } catch (error) {
      console.log('Error Dashboard');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('http://localhost:3000/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        setUsers(result);
      }
    } catch (error) {
      console.log('Error Users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/settings');
      if (response.ok) {
        const result = await response.json();
        setSystemSettings({
          fitness_fee_student: result.fitness_fee_student.toString(),
          fitness_fee_external: result.fitness_fee_external.toString(),
          max_borrow_days: result.max_borrow_days.toString(),
          max_borrow_items: result.max_borrow_items.toString(),
          open_time: result.open_time,
          close_time: result.close_time,
          accept_qr: result.accept_qr
        });
      }
    } catch (error) {
      console.log('Error Settings');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });
      if (response.ok) {
        showMessage('สำเร็จ', 'บันทึกการตั้งค่าสำเร็จ!');
      } else {
        showMessage('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
      }
    } catch (error) {
      showMessage('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPasswordAdmin || !confirmPassword) {
      showMessage('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (newPasswordAdmin !== confirmPassword) {
      showMessage('แจ้งเตือน', 'รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    
    if (!adminAccountId) {
      showMessage('ข้อผิดพลาด', 'ไม่พบข้อมูลรหัสบัญชีผู้ดูแลระบบ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: adminAccountId,
          oldPassword: oldPassword,
          newPassword: newPasswordAdmin
        })
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setIsPasswordModalOpen(false);
        setOldPassword(''); setNewPasswordAdmin(''); setConfirmPassword('');
      } else {
        showMessage('ข้อผิดพลาด', data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const togglePermission = async (userId, field, currentValue) => {
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: !currentValue } : u));
      await fetch(`http://localhost:3000/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: field, value: !currentValue })
      });
    } catch (error) {
      console.error(error);
      fetchUsers();
    }
  };

  const handleAddStaff = async () => {
    if (!newName || !newEmail || !newPassword) {
      showMessage('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!newEmail.endsWith('@system.com')) {
      showMessage('แจ้งเตือน', 'อีเมลต้องลงท้ายด้วย @system.com เท่านั้น');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/admin/create-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: 'staff' })
      });
      if (res.ok) {
        showMessage('สำเร็จ', 'เพิ่มบัญชีเจ้าหน้าที่ เรียบร้อยแล้ว');
        setIsAddModalOpen(false);
        setNewName(''); setNewEmail(''); setNewPassword('');
        fetchUsers();
      } else {
        const err = await res.json();
        showMessage('ข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      showMessage('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  const handleDeleteStaff = (userId, userName) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
          showMessage('สำเร็จ', `ลบบัญชี ${userName} เรียบร้อยแล้ว`);
        } else {
          showMessage('ข้อผิดพลาด', 'ไม่สามารถลบบัญชีได้');
        }
      } catch (error) {
        showMessage('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`คุณต้องการลบสิทธิ์ของ ${userName} ใช่หรือไม่?\n(การกระทำนี้ไม่สามารถกู้คืนได้)`)) {
        executeDelete();
      }
    } else {
      Alert.alert('ยืนยันการลบ', `คุณต้องการลบสิทธิ์ของ ${userName} ใช่หรือไม่?\n(การกระทำนี้ไม่สามารถกู้คืนได้)`, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      setSelectedBarIndex(null); // รีเซ็ต Tooltip เมื่อมีการโหลดกราฟใหม่
      setLoading(true);
      fetchDashboardData().then(() => { setLoading(false); setRefreshing(false); });
    } else if (activeMenu === 'users' || activeMenu === 'roles') {
      fetchUsers();
    } else if (activeMenu === 'settings') {
      fetchSettings();
    }
  }, [activeMenu, viewMode, selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeMenu === 'dashboard') {
      setSelectedBarIndex(null);
      fetchDashboardData().then(() => setRefreshing(false));
    }
    else if (activeMenu === 'settings') fetchSettings().then(() => setRefreshing(false));
    else fetchUsers().then(() => setRefreshing(false));
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) navigation.replace('SelectType');
    } else {
      navigation.replace('SelectType');
    }
  };

  const openUserDetails = async (user) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${user.id}/detail`);
      if (res.ok) {
        const detailedData = await res.json();
        setSelectedUser({ ...user, ...detailedData });
      } else {
        setSelectedUser(user);
      }
    } catch (e) {
      setSelectedUser(user);
    }
    setModalVisible(true);
  };

  const MenuItem = ({ id, icon, title }) => (
    <TouchableOpacity style={[styles.menuItem, activeMenu === id && styles.menuItemActive]} onPress={() => setActiveMenu(id)}>
      <Ionicons name={icon} size={20} color={activeMenu === id ? '#1E293B' : '#64748B'} style={styles.menuIcon} />
      <Text style={[styles.menuText, activeMenu === id && styles.menuTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return { text: 'ผู้ดูแลระบบ', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'staff': return { text: 'เจ้าหน้าที่', color: '#2563EB', bg: '#DBEAFE' };
      case 'student': return { text: 'นักศึกษา', color: '#10B981', bg: '#D1FAE5' };
      case 'external': return { text: 'บุคคลภายนอก', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { text: role, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const maxChartValue = stats?.chartBar ? Math.max(...stats.chartBar.map(d => d.value), 4) : 4;
  
  let displayDateStr = new Date().toLocaleDateString('th-TH');
  if (viewMode === 'monthly') {
    if (selectedMonth === 'all') {
      displayDateStr = `ข้อมูลตลอดทั้งปี ${new Date().getFullYear() + 543}`;
    } else {
      const mName = monthOptions.find(m => m.id === selectedMonth)?.name;
      displayDateStr = `ข้อมูลเดือน ${mName} ${new Date().getFullYear() + 543}`;
    }
  }

  const generalUsers = users.filter(u => u.account_type === 'student' || u.account_type === 'external');
  const staffUsers = users.filter(u => u.account_type === 'staff');

  return (
    <SafeAreaView style={styles.container}>
      
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUser && (() => {
              const rawFaculty = selectedUser.faculty ? selectedUser.faculty.toLowerCase() : '';
              const rawMajor = selectedUser.major ? selectedUser.major.toLowerCase() : '';
              const displayFaculty = facultyNameThai[rawFaculty] || (selectedUser.faculty || '-');
              const displayMajor = majorNameThai[rawMajor] || (selectedUser.major || '-');

              return (
                <View style={{ flex: 1 }}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>รายละเอียดผู้ใช้งาน</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                    <View style={styles.profileSection}>
                      {selectedUser.profile_image ? (
                        <Image source={{ uri: selectedUser.profile_image }} style={styles.profileAvatarImg} />
                      ) : (
                        <View style={styles.profileAvatar}><Ionicons name="person" size={40} color="#8B5CF6" /></View>
                      )}
                      <Text style={styles.profileName}>{selectedUser.full_name}</Text>
                      <View style={[styles.badge, { backgroundColor: getRoleLabel(selectedUser.account_type).bg, marginTop: 8 }]}>
                        <Text style={[styles.badgeText, { color: getRoleLabel(selectedUser.account_type).color }]}>{getRoleLabel(selectedUser.account_type).text}</Text>
                      </View>
                    </View>

                    <Text style={styles.detailSectionTitle}>ข้อมูลส่วนตัว</Text>
                    <View style={styles.detailBox}>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>อีเมล:</Text><Text style={styles.detailValue}>{selectedUser.email}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>เบอร์โทรศัพท์:</Text><Text style={styles.detailValue}>{selectedUser.phone || '-'}</Text></View>
                      {selectedUser.account_type === 'student' && (
                        <>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>รหัสนักศึกษา:</Text><Text style={styles.detailValue}>{selectedUser.student_id || '-'}</Text></View>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>คณะ:</Text><Text style={styles.detailValue}>{displayFaculty}</Text></View>
                          <View style={styles.detailRow}><Text style={styles.detailLabel}>สาขา:</Text><Text style={styles.detailValue}>{displayMajor}</Text></View>
                        </>
                      )}
                      {selectedUser.account_type === 'external' && (
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>รหัสบัตรประชาชน:</Text><Text style={styles.detailValue}>{selectedUser.citizen_id || '-'}</Text></View>
                      )}
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>วันที่สมัคร:</Text><Text style={styles.detailValue}>{selectedUser.register_date || '-'}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>สถานะบัญชี:</Text><Text style={[styles.detailValue, { color: selectedUser.is_active ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>{selectedUser.is_active ? '✅ ใช้งานปกติ' : '❌ ถูกระงับ'}</Text></View>
                    </View>

                    {selectedUser.id_card_image && (
                      <>
                        <Text style={styles.detailSectionTitle}>รูปบัตรประจำตัวประชาชน / เอกสารยืนยันตัวตน</Text>
                        <View style={styles.idCardBox}>
                          <Image source={{ uri: selectedUser.id_card_image }} style={styles.idCardImg} resizeMode="cover" />
                        </View>
                      </>
                    )}
                  </ScrollView>

                  <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeModalBtnText}>ปิดหน้าต่าง</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={isAddModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มบัญชีเจ้าหน้าที่ระบบ</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ชื่อ-นามสกุล</Text>
                <TextInput style={styles.inputBox} value={newName} onChangeText={setNewName} placeholder="กรอกชื่อ-นามสกุล" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>อีเมล (เฉพาะองค์กร)</Text>
                <TextInput 
                  style={styles.inputBox} 
                  value={newEmail} 
                  onChangeText={setNewEmail} 
                  placeholder="name@system.com" 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
                <Text style={{fontSize: 12, color: '#EF4444', marginTop: 6}}>* อีเมลต้องลงท้ายด้วย @system.com เท่านั้น</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>รหัสผ่าน (สำหรับการล็อกอินครั้งแรก)</Text>
                <TextInput style={styles.inputBox} value={newPassword} onChangeText={setNewPassword} placeholder="ตั้งรหัสผ่านให้เจ้าหน้าที่" secureTextEntry />
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={handleAddStaff}>
                <Text style={styles.btnSubmitText}>สร้างบัญชีเจ้าหน้าที่</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={isPasswordModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>
              <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>รหัสผ่านเดิม</Text>
                <TextInput style={styles.inputBox} value={oldPassword} onChangeText={setOldPassword} placeholder="กรอกรหัสผ่านเดิม" secureTextEntry />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>รหัสผ่านใหม่</Text>
                <TextInput style={styles.inputBox} value={newPasswordAdmin} onChangeText={setNewPasswordAdmin} placeholder="กรอกรหัสผ่านใหม่" secureTextEntry />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ยืนยันรหัสผ่านใหม่</Text>
                <TextInput style={styles.inputBox} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" secureTextEntry />
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={handleChangePassword}>
                <Text style={styles.btnSubmitText}>บันทึกรหัสผ่านใหม่</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}><Ionicons name="shield-checkmark" size={28} color="#FFFFFF" /></View>
          <Text style={styles.logoText}>RMUTK Admin</Text>
        </View>
        
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.menuSectionTitle}>ภาพรวม</Text>
          <MenuItem id="dashboard" icon="grid-outline" title="แดชบอร์ดภาพรวม" />
          <Text style={styles.menuSectionTitle}>ผู้ดูแลระบบ</Text>
          <MenuItem id="users" icon="people-outline" title="จัดการผู้ใช้งาน" />
          <MenuItem id="roles" icon="shield-checkmark-outline" title="กำหนดสิทธิ์" />
          <MenuItem id="settings" icon="settings-outline" title="ตั้งค่าระบบ" />
        </ScrollView>

        <View style={styles.bottomMenu}>
          <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setIsPasswordModalOpen(true)}>
            <Ionicons name="key-outline" size={20} color="#6366F1" style={styles.menuIcon} />
            <Text style={styles.changePasswordText}>เปลี่ยนรหัสผ่าน</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.menuIcon} />
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.headerTitle}>
              {activeMenu === 'dashboard' ? 'แดชบอร์ดภาพรวม' : activeMenu === 'users' ? 'จัดการผู้ใช้งานทั่วไป' : activeMenu === 'roles' ? 'กำหนดสิทธิ์เจ้าหน้าที่' : 'ตั้งค่าระบบ'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeMenu === 'dashboard' ? 'สรุปข้อมูลสำคัญของศูนย์กีฬา' : activeMenu === 'settings' ? 'กำหนดเงื่อนไขค่าบริการและการยืมอุปกรณ์' : activeMenu === 'users' ? 'จัดการข้อมูลบัญชีนักศึกษาและบุคคลภายนอก' : 'กำหนดสิทธิ์การเข้าถึงระบบของเจ้าหน้าที่'}
            </Text>
          </View>
          
          {activeMenu === 'dashboard' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              
              <View style={styles.toggleGroup}>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'daily' && styles.toggleBtnActive]} onPress={() => setViewMode('daily')}>
                  <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>รายวัน</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]} onPress={() => { setViewMode('monthly'); setSelectedMonth('all'); }}>
                  <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>รายเดือน</Text>
                </TouchableOpacity>
              </View>

              {viewMode === 'monthly' && (
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <TouchableOpacity 
                    style={styles.monthDropdownBtn}
                    onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  >
                    <Text style={styles.monthDropdownText}>
                      {monthOptions.find(m => m.id === selectedMonth)?.name || 'เลือกเดือน'}
                    </Text>
                    <Ionicons name={isMonthDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
                  </TouchableOpacity>

                  {isMonthDropdownOpen && (
                    <View style={styles.monthDropdownList}>
                      <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                        {monthOptions.map((item) => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={[styles.monthDropdownItem, selectedMonth === item.id && { backgroundColor: '#EFF6FF' }]} 
                            onPress={() => { setSelectedMonth(item.id); setIsMonthDropdownOpen(false); }}
                          >
                            <Text style={[styles.monthDropdownItemText, selectedMonth === item.id && { color: '#1E3A8A', fontWeight: 'bold' }]}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

            </View>
          )}

          {activeMenu === 'settings' && (
            <TouchableOpacity 
              style={[styles.saveSettingsBtn, savingSettings && {opacity: 0.7}]} 
              onPress={saveSettings} 
              disabled={savingSettings}
            >
              <Text style={styles.saveSettingsBtnText}>
                {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.contentArea} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />}>
          
          {activeMenu === 'dashboard' && (
            <View style={{ zIndex: 10 }}>
              {loading && !refreshing ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A8A" /></View>
              ) : (
                <View style={{ zIndex: 1 }}>
                  <View style={styles.summaryRow}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle}>ผู้เข้าใช้ฟิตเนส</Text><Ionicons name="people-outline" size={20} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={styles.metricValue}>{stats.fitnessUsers}</Text><Text style={styles.metricUnit}>คน</Text></View>
                      <Text style={styles.metricSubtext}>ข้อมูล: {displayDateStr}</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle}>ยอดเงินค่าบริการ</Text><Ionicons name="cash-outline" size={20} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={styles.metricValue}>{stats.revenue}</Text><Text style={styles.metricUnit}>บาท</Text></View>
                      <Text style={styles.metricSubtext}>เงินสด {stats.cash} บ. · QR {stats.qr} บ.</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle}>อุปกรณ์ที่ถูกยืม</Text><Ionicons name="cube-outline" size={20} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={styles.metricValue}>{stats.borrowed}</Text><Text style={styles.metricUnit}>ชิ้น</Text></View>
                      <Text style={styles.metricSubtext}>{stats.notReturned} รายการที่ยังไม่คืน</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle}>เกินกำหนดคืน</Text><Ionicons name="calendar-outline" size={20} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={styles.metricValue}>{stats.overdue}</Text><Text style={styles.metricUnit}>รายการ</Text></View>
                      <Text style={[styles.metricSubtext, {color: stats.overdue > 0 ? '#EF4444' : '#64748B'}]}>ต้องติดตามทวงคืน</Text>
                    </View>
                  </View>

                  <View style={styles.chartsRow}>
                    <View style={styles.barChartCard}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                         <View>
                           <Text style={styles.chartTitle}>จำนวนผู้เข้าใช้ฟิตเนส</Text>
                           <Text style={styles.chartSubtitle}>
                             {viewMode === 'monthly' ? (selectedMonth === 'all' ? 'นับรวมตลอดทั้งปี (แบ่งตามเดือน)' : `นับตามวันที่ในเดือน ${monthOptions.find(m=>m.id===selectedMonth)?.name}`) : 'นับตามรอบ 2 ชั่วโมง'}
                           </Text>
                         </View>
                         <View style={{alignItems: 'flex-end'}}>
                           <Text style={{fontSize: 12, color: '#64748B'}}>ช่วงที่มีผู้ใช้เยอะที่สุด</Text>
                           <Text style={{fontSize: 16, fontWeight: 'bold', color: '#00A87E'}}>
                              {stats?.peakUsage?.label || '-'} ({stats?.peakUsage?.value || 0} คน)
                           </Text>
                         </View>
                      </View>
                      
                      {/* 🌟 พื้นที่กราฟแท่งที่มีระบบ Tooltip */}
                      <View style={[styles.chartArea, viewMode === 'monthly' && selectedMonth !== 'all' && { overflowX: 'auto' }]}>
                        <View style={[styles.barsContainer, viewMode === 'monthly' && selectedMonth !== 'all' && { width: Platform.OS === 'web' ? '150%' : '200%' }]}>
                          {stats?.chartBar && stats.chartBar.map((item, index) => {
                            const barHeightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                            return (
                              <TouchableOpacity 
                                key={index} 
                                activeOpacity={0.8}
                                onPress={() => setSelectedBarIndex(selectedBarIndex === index ? null : index)}
                                style={[styles.barItem, viewMode === 'monthly' && selectedMonth !== 'all' && { minWidth: 20, marginRight: 5 }]}
                              >
                                <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                                  
                                  {selectedBarIndex === index && (
                                    <View style={[styles.tooltipBubble, { bottom: `${barHeightPercent}%` }]}>
                                      <Text style={styles.tooltipText}>{item.value} คน</Text>
                                      <View style={styles.tooltipArrow} />
                                    </View>
                                  )}

                                  <View style={styles.barBackground}>
                                    {item.value > 0 && <View style={[styles.barFill, { height: `${barHeightPercent}%` }]} />}
                                  </View>
                                </View>
                                <Text style={styles.barLabel}>{item.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <View style={styles.xAxisLine} />
                      </View>
                    </View>

                    <View style={styles.donutChartCard}>
                      <Text style={styles.chartTitle}>สัดส่วนวิธีชำระเงิน</Text>
                      <Text style={styles.chartSubtitle}>เงินสด {stats?.cash || 0} บ. · QR {stats?.qr || 0} บ.</Text>
                      <View style={styles.donutContainer}>
                        <View style={styles.donutCircle}>
                          <View style={styles.donutInnerCircle}>
                            <Text style={styles.donutTotalLabel}>ยอดรวม</Text>
                            <Text style={styles.donutTotalValue}>฿{stats.revenue}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.donutLegend}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#1E3A8A'}]} /><Text style={styles.legendText}>เงินสด ({stats.cash})</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#166534'}]} /><Text style={styles.legendText}>QR Code ({stats.qr})</Text></View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chartsRow}>
                    <View style={[styles.barChartCard, { flex: 1, minHeight: 250, marginTop: 15 }]}>
                      <Text style={styles.chartTitle}>5 อันดับอุปกรณ์ที่ถูกยืมมากที่สุด</Text>
                      <Text style={styles.chartSubtitle}>
                        {viewMode === 'monthly' ? 'สถิติตามเดือนที่เลือก' : 'สถิติรายวัน'}
                      </Text>

                      <View style={{ marginTop: 15, flex: 1, justifyContent: 'center' }}>
                        {stats.popularEquipment && stats.popularEquipment.length > 0 ? (
                          stats.popularEquipment.map((item, index) => {
                            const maxEqVal = Math.max(...stats.popularEquipment.map(d => d.value), 1);
                            const pct = (item.value / maxEqVal) * 100;
                            return (
                              <View key={index} style={{ marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '600' }}>{index + 1}. {item.label}</Text>
                                  <Text style={{ fontSize: 14, color: '#00A87E', fontWeight: 'bold' }}>{item.value} ชิ้น</Text>
                                </View>
                                <View style={{ width: '100%', height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#00A87E', borderRadius: 5 }} />
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>ไม่มีข้อมูลการยืมในช่วงเวลานี้</Text>
                        )}
                      </View>
                    </View>
                  </View>

                </View>
              )}
            </View>
          )}

          {activeMenu === 'users' && (
            <View style={styles.tableCard}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A8A" /></View>
              ) : (
                <View style={{ overflow: 'hidden' }}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCol, {flex: 2}]}>ชื่อ-นามสกุล</Text>
                    <Text style={[styles.tableCol, {flex: 2}]}>อีเมล</Text>
                    <Text style={[styles.tableCol, {flex: 1.5}]}>ประเภท</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>ระงับบัญชี</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>รายละเอียด</Text>
                  </View>
                  {generalUsers.map((user, index) => {
                    const roleUI = getRoleLabel(user.account_type);
                    return (
                      <View key={user.id} style={[styles.tableRow, index % 2 !== 0 && {backgroundColor: '#F8FAFC'}]}>
                        <Text style={[styles.tableCell, {flex: 2, fontWeight: 'bold'}]} numberOfLines={1}>{user.full_name}</Text>
                        <Text style={[styles.tableCell, {flex: 2, color: '#64748B'}]} numberOfLines={1}>{user.email}</Text>
                        
                        <View style={[styles.tableCell, {flex: 1.5}]}>
                          <View style={[styles.badge, { backgroundColor: roleUI.bg }]}>
                            <Text style={[styles.badgeText, { color: roleUI.color }]}>{roleUI.text}</Text>
                          </View>
                        </View>

                        <View style={[styles.tableCell, {flex: 1, alignItems: 'center'}]}>
                          <Switch value={user.is_active} onValueChange={() => togglePermission(user.id, 'is_active', user.is_active)} trackColor={{ false: '#EF4444', true: '#10B981' }} />
                        </View>
                        <View style={[styles.tableCell, {flex: 1, alignItems: 'center'}]}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => openUserDetails(user)}>
                            <Ionicons name="eye-outline" size={20} color="#2563EB" />
                            <Text style={styles.actionBtnText}>ดูข้อมูล</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {activeMenu === 'roles' && (
            <View style={styles.tableCard}>
              <View style={styles.tableActionRow}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>รายชื่อเจ้าหน้าที่ระบบ</Text>
                <TouchableOpacity style={styles.btnAdd} onPress={() => setIsAddModalOpen(true)}>
                  <Ionicons name="person-add" size={16} color="#FFF" />
                  <Text style={styles.btnAddText}> เพิ่มบัญชีเจ้าหน้าที่</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, {flex: 2}]}>ชื่อผู้ใช้งาน</Text>
                <Text style={[styles.tableCol, {flex: 1.5}]}>ประเภท</Text>
                <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>สถานะการระงับ</Text>
                <Text style={[styles.tableCol, {flex: 0.8, textAlign: 'center'}]}>จัดการ</Text>
              </View>
              {staffUsers.map((user, index) => {
                const roleUI = getRoleLabel(user.account_type);
                return (
                  <View key={user.id} style={[styles.tableRow, index % 2 !== 0 && {backgroundColor: '#F8FAFC'}]}>
                    <Text style={[styles.tableCell, {flex: 2, fontWeight: 'bold'}]} numberOfLines={1}>{user.full_name}</Text>
                    
                    <View style={[styles.tableCell, {flex: 1.5}]}>
                      <View style={[styles.badge, { backgroundColor: roleUI.bg }]}>
                        <Text style={[styles.badgeText, { color: roleUI.color }]}>{roleUI.text}</Text>
                      </View>
                    </View>

                    <View style={[styles.tableCell, {flex: 1, alignItems: 'center'}]}>
                      <Switch 
                        value={user.is_active} 
                        onValueChange={() => togglePermission(user.id, 'is_active', user.is_active)} 
                        trackColor={{ false: '#EF4444', true: '#10B981' }} 
                      />
                    </View>
                    
                    <View style={[styles.tableCell, {flex: 0.8, alignItems: 'center'}]}>
                      <TouchableOpacity style={{ padding: 5 }} onPress={() => handleDeleteStaff(user.id, user.full_name)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {activeMenu === 'settings' && (
            <View style={styles.settingsGrid}>
              <View style={styles.settingsGridCard}>
                <Text style={styles.settingsCardTitle}>ค่าบริการฟิตเนส</Text>
                <Text style={styles.settingsCardSub}>อัตราค่าบริการต่อครั้ง</Text>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsInputWrapper}>
                    <Text style={styles.settingsInputLabel}>นักศึกษา</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.settingsInput} 
                        value={systemSettings.fitness_fee_student} 
                        onChangeText={(t) => setSystemSettings({...systemSettings, fitness_fee_student: t})} 
                        keyboardType="numeric" 
                      />
                      <Text style={styles.unitText}>บาท</Text>
                    </View>
                  </View>
                  <View style={styles.settingsInputWrapper}>
                    <Text style={styles.settingsInputLabel}>บุคคลภายนอก</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.settingsInput} 
                        value={systemSettings.fitness_fee_external} 
                        onChangeText={(t) => setSystemSettings({...systemSettings, fitness_fee_external: t})} 
                        keyboardType="numeric" 
                      />
                      <Text style={styles.unitText}>บาท</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.settingsGridCard}>
                <Text style={styles.settingsCardTitle}>เงื่อนไขการยืมอุปกรณ์</Text>
                <Text style={styles.settingsCardSub}>ข้อจำกัดของการทำรายการยืมแต่ละครั้ง</Text>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsInputWrapper}>
                    <Text style={styles.settingsInputLabel}>จำนวนวันสูงสุดที่ยืมได้</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.settingsInput} 
                        value={systemSettings.max_borrow_days} 
                        onChangeText={(t) => setSystemSettings({...systemSettings, max_borrow_days: t})} 
                        keyboardType="numeric" 
                      />
                      <Text style={styles.unitText}>วัน</Text>
                    </View>
                  </View>
                  <View style={styles.settingsInputWrapper}>
                    <Text style={styles.settingsInputLabel}>จำนวนชิ้นสูงสุดต่อครั้ง</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.settingsInput} 
                        value={systemSettings.max_borrow_items} 
                        onChangeText={(t) => setSystemSettings({...systemSettings, max_borrow_items: t})} 
                        keyboardType="numeric" 
                      />
                      <Text style={styles.unitText}>ชิ้น</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.settingsGridCard}>
                <Text style={styles.settingsCardTitle}>ช่องทางชำระเงิน</Text>
                <Text style={styles.settingsCardSub}>เปิด-ปิดการรับชำระผ่าน QR</Text>
                <View style={styles.switchRowContainer}>
                  <View>
                    <Text style={styles.switchLabel}>รับชำระด้วย QR</Text>
                    <Text style={styles.switchSub}>หากปิด เจ้าหน้าที่จะรับชำระได้เฉพาะเงินสด</Text>
                  </View>
                  <Switch 
                    value={systemSettings.accept_qr} 
                    onValueChange={(val) => setSystemSettings({...systemSettings, accept_qr: val})} 
                    trackColor={{ false: '#CBD5E1', true: '#1E3A8A' }} 
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  loadingContainer: { height: 400, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContainer: { width: '90%', maxWidth: 500, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' }, default: { elevation: 10 } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  modalBody: { padding: 24, maxHeight: 500 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#E2E8F0' },
  profileAvatarImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: '#E2E8F0', resizeMode: 'cover' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  detailSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 12, marginTop: 10 },
  detailBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  detailLabel: { fontSize: 14, color: '#64748B' },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  idCardBox: { width: '100%', height: 180, backgroundColor: '#F8FAFC', borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  idCardImg: { width: '100%', height: '100%' },
  closeModalBtn: { backgroundColor: '#1E3A8A', paddingVertical: 16, alignItems: 'center' },
  closeModalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  sidebar: { width: 260, backgroundColor: '#FFFFFF', paddingVertical: 20, paddingHorizontal: 15, justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  logoContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  logoCircle: { width: 48, height: 48, backgroundColor: '#1E3A8A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  menuContainer: { flex: 1 },
  menuSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8', marginTop: 24, marginBottom: 12, paddingHorizontal: 14, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4 },
  menuItemActive: { backgroundColor: '#F1F5F9' },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 15, color: '#475569', fontWeight: '500' },
  menuTextActive: { color: '#1E293B', fontWeight: 'bold' },
  bottomMenu: { padding: 5, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 10 },
  changePasswordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE' },
  changePasswordText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 },
  mainContent: { flex: 1, display: 'flex' },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 16, zIndex: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#64748B' },
  
  toggleGroup: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', ...Platform.select({ web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 1 } }) },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#1E3A8A' },
  
  monthDropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', height: 38 },
  monthDropdownText: { fontSize: 14, fontWeight: '600', color: '#334155', marginRight: 8 },
  monthDropdownList: { position: 'absolute', top: 45, right: 0, width: 160, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  monthDropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  monthDropdownItemText: { fontSize: 13, color: '#475569' },

  saveSettingsBtn: { backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  saveSettingsBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  contentArea: { paddingHorizontal: 24, paddingBottom: 24, flex: 1, zIndex: 1 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, zIndex: 1 },
  metricCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flex: 1, minWidth: 200, margin: 6, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.05)' }, default: { elevation: 2 } }) },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  metricTitle: { fontSize: 14, color: '#475569', fontWeight: '600' },
  metricValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginRight: 8 },
  metricUnit: { fontSize: 16, color: '#475569', fontWeight: '600' },
  metricSubtext: { fontSize: 13, color: '#94A3B8' },
  chartsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', zIndex: 1 },
  barChartCard: { flex: 2, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, margin: 6, minWidth: 400, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.05)' }, default: { elevation: 2 } }) },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  chartSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 30 },

  // 🌟 ปรับ Padding ของพื้นที่กราฟแท่ง
  chartArea: { height: 230, paddingBottom: 20, paddingTop: 30 },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 10 },
  barItem: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barBackground: { width: '100%', maxWidth: 40, height: '100%', backgroundColor: '#F8FAFC', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' }, 
  barFill: { width: '100%', backgroundColor: '#1E3A8A', borderRadius: 4 }, 
  barLabel: { fontSize: 11, color: '#64748B', position: 'absolute', bottom: -25 },
  xAxisLine: { height: 1, backgroundColor: '#E2E8F0', width: '100%', position: 'absolute', bottom: 0 },

  // 🌟 สไตล์กล่อง Tooltip เวลาจิ้มที่กราฟ
  tooltipBubble: { 
    position: 'absolute', 
    marginBottom: 8, 
    backgroundColor: '#0F172A', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6, 
    zIndex: 100,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.3)' }, default: { elevation: 5 } })
  },
  tooltipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A'
  },

  donutChartCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, margin: 6, minWidth: 280, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.05)' }, default: { elevation: 2 } }) },
  donutContainer: { alignItems: 'center', justifyContent: 'center', height: 200, marginTop: 10 },
  donutCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 24, borderColor: '#1E3A8A', borderBottomColor: '#166534', borderLeftColor: '#166534', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  donutInnerCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-45deg' }] },
  donutTotalLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  donutTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  donutLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.05)' }, default: { elevation: 2 } }) },
  tableActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  btnAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnAddText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tableCol: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#1E293B' },
  badge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnText: { fontSize: 12, color: '#2563EB', fontWeight: 'bold', marginLeft: 4 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputBox: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 15, height: 45, fontSize: 14, backgroundColor: '#F8FAFC' },
  btnSubmit: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  btnSubmitText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  settingsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  settingsGridCard: { width: '49%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.02)' }, default: { elevation: 1 } }) },
  settingsCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  settingsCardSub: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  settingsInputWrapper: { flex: 1 },
  settingsInputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center' },
  settingsInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 10, fontSize: 14, color: '#1E293B', outlineStyle: 'none' },
  unitText: { marginLeft: 10, fontSize: 14, color: '#64748B' },
  switchRowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 16 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  switchSub: { fontSize: 12, color: '#64748B' }
});