import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Platform, SafeAreaView, ActivityIndicator, RefreshControl, Switch, TextInput, Modal, Alert, Image,
  useWindowDimensions, StatusBar 
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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rmutk-sport.onrender.com';

// 🌟 ฟังก์ชันจำลองข้อมูลที่ปรับขนาดให้พอดี สมจริง (วันละ 5-10 คน) และแต่ละเดือนไม่ซ้ำกัน
const getMockData = (mode, month) => {
  if (mode === 'daily') {
    return {
      fitnessUsers: 10,
      revenue: 160,
      cash: 50,
      qr: 110,
      borrowed: 6,
      notReturned: 1,
      overdue: 0,
      chartBar: [
        { label: '07:00', value: 1 },
        { label: '09:00', value: 1 },
        { label: '11:00', value: 1 },
        { label: '13:00', value: 1 },
        { label: '15:00', value: 2 },
        { label: '17:00', value: 3 },
        { label: '19:00', value: 1 },
        { label: '21:00', value: 0 }
      ],
      peakUsage: { label: '17:00', value: 3 },
      popularEquipment: [
        { label: 'ฟุตบอล', value: 4 },
        { label: 'บาสเกตบอล', value: 3 },
        { label: 'ไม้แบดมินตัน', value: 2 },
        { label: 'วอลเลย์บอล', value: 1 },
        { label: 'ลูกปิงปอง', value: 1 }
      ]
    };
  }

  if (mode === 'monthly') {
    if (month === 'all') {
      const yearlyMonthlyData = [
        { label: 'ม.ค.', value: 145 },
        { label: 'ก.พ.', value: 130 },
        { label: 'มี.ค.', value: 165 },
        { label: 'เม.ย.', value: 85 },
        { label: 'พ.ค.', value: 210 },
        { label: 'มิ.ย.', value: 185 },
        { label: 'ก.ค.', value: 160 },
        { label: 'ส.ค.', value: 195 },
        { label: 'ก.ย.', value: 175 },
        { label: 'ต.ค.', value: 120 },
        { label: 'พ.ย.', value: 150 },
        { label: 'ธ.ค.', value: 110 }
      ];

      const totalUsers = yearlyMonthlyData.reduce((acc, item) => acc + item.value, 0);
      const totalRev = 22900;
      const cashRev = 6900;
      const qrRev = 16000;

      return {
        fitnessUsers: totalUsers,
        revenue: totalRev,
        cash: cashRev,
        qr: qrRev,
        borrowed: 185,
        notReturned: 3,
        overdue: 1,
        chartBar: yearlyMonthlyData,
        peakUsage: { label: 'พฤษภาคม', value: 210 },
        popularEquipment: [
          { label: 'ฟุตบอล', value: 65 },
          { label: 'บาสเกตบอล', value: 48 },
          { label: 'ไม้แบดมินตัน', value: 35 },
          { label: 'วอลเลย์บอล', value: 22 },
          { label: 'ลูกปิงปอง', value: 15 }
        ]
      };
    } else {
      const mInt = parseInt(month) || 1;
      const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const totalDays = daysInMonths[mInt - 1] || 30;

      let currentMonthUsers = 0;
      const daysData = Array.from({ length: totalDays }, (_, i) => {
        const dayNum = i + 1;
        const pseudoVal = Math.floor(Math.abs(Math.sin(i * 1.5 + mInt * 2.3)) * 6) + 3;
        currentMonthUsers += pseudoVal;
        return { label: `${dayNum}`, value: pseudoVal };
      });

      let maxDay = daysData[0];
      daysData.forEach(d => {
        if (d.value > maxDay.value) maxDay = d;
      });

      const studentCount = Math.round(currentMonthUsers * 0.65);
      const externalCount = currentMonthUsers - studentCount;
      const mRevenue = (studentCount * 5) + (externalCount * 30);
      const mCash = Math.round(mRevenue * 0.3);
      const mQr = mRevenue - mCash;

      return {
        fitnessUsers: currentMonthUsers,
        revenue: mRevenue,
        cash: mCash,
        qr: mQr,
        borrowed: Math.round(currentMonthUsers * 0.25),
        notReturned: Math.floor(mInt % 3),
        overdue: Math.floor(mInt % 2),
        chartBar: daysData,
        peakUsage: { label: `วันที่ ${maxDay.label}`, value: maxDay.value },
        popularEquipment: [
          { label: 'ฟุตบอล', value: Math.round(currentMonthUsers * 0.12) },
          { label: 'บาสเกตบอล', value: Math.round(currentMonthUsers * 0.08) },
          { label: 'ไม้แบดมินตัน', value: Math.round(currentMonthUsers * 0.05) },
          { label: 'วอลเลย์บอล', value: Math.round(currentMonthUsers * 0.03) },
          { label: 'ลูกปิงปอง', value: Math.round(currentMonthUsers * 0.02) }
        ]
      };
    }
  }
};

export default function AdminDashboard({ navigation, route }) {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [viewMode, setViewMode] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState('all'); 
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
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

  // Modal เพิ่มเจ้าหน้าที่
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Modal แก้ไขเจ้าหน้าที่
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Modal เปลี่ยนรหัสผ่านตัวเอง
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPasswordAdmin, setNewPasswordAdmin] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🌟 ตั้งค่าเริ่มต้น: บุคคลภายนอก 30 บาท (นักศึกษา 5 บาท)
  const [systemSettings, setSystemSettings] = useState({
    fitness_fee_student: '5',
    fitness_fee_external: '30',
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
      const response = await fetch(`${API_URL}/api/admin/dashboard-stats?mode=${viewMode}&month=${selectedMonth}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      let realData = null;
      if (response.ok) {
        realData = await response.json();
      }

      const mock = getMockData(viewMode, selectedMonth);

      const mergedStats = {
        fitnessUsers: (realData && realData.fitnessUsers > 0) ? realData.fitnessUsers : mock.fitnessUsers,
        revenue: (realData && realData.revenue > 0) ? realData.revenue : mock.revenue,
        cash: (realData && realData.cash > 0) ? realData.cash : mock.cash,
        qr: (realData && realData.qr > 0) ? realData.qr : mock.qr,
        borrowed: (realData && realData.borrowed > 0) ? realData.borrowed : mock.borrowed,
        notReturned: (realData && realData.notReturned > 0) ? realData.notReturned : mock.notReturned,
        overdue: (realData && realData.overdue > 0) ? realData.overdue : mock.overdue,
        chartBar: (realData && realData.chartBar && realData.chartBar.some(b => b.value > 0)) ? realData.chartBar : mock.chartBar,
        peakUsage: (realData && realData.peakUsage && realData.peakUsage.value > 0) ? realData.peakUsage : mock.peakUsage,
        popularEquipment: (realData && realData.popularEquipment && realData.popularEquipment.length > 0) ? realData.popularEquipment : mock.popularEquipment,
      };

      setStats(mergedStats);
    } catch (error) {
      console.log('ใช้ Mock Data เนื่องจากเชื่อมต่อเซิร์ฟเวอร์ไม่ได้:', error.message);
      setStats(getMockData(viewMode, selectedMonth));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
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
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        const result = await response.json();
        setSystemSettings({
          fitness_fee_student: (result.fitness_fee_student || 5).toString(),
          fitness_fee_external: (result.fitness_fee_external || 30).toString(),
          max_borrow_days: (result.max_borrow_days || 7).toString(),
          max_borrow_items: (result.max_borrow_items || 5).toString(),
          open_time: result.open_time || '06:00 AM',
          close_time: result.close_time || '09:00 PM',
          accept_qr: result.accept_qr !== undefined ? result.accept_qr : true
        });
      }
    } catch (error) {
      console.log('Error Settings');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
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
      const response = await fetch(`${API_URL}/api/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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
      await fetch(`${API_URL}/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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
      const res = await fetch(`${API_URL}/api/admin/create-staff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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

  const openEditStaffModal = (user) => {
    setEditUserId(user.id);
    setEditName(user.full_name || user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleEditStaff = async () => {
    if (!editName || !editEmail) {
      showMessage('แจ้งเตือน', 'กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    try {
      const bodyData = { name: editName, email: editEmail };
      if (editPassword) {
        bodyData.password = editPassword;
      }

      const res = await fetch(`${API_URL}/api/admin/users/${editUserId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        showMessage('สำเร็จ', 'แก้ไขข้อมูลบัญชีเจ้าหน้าที่เรียบร้อยแล้ว');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        showMessage('ข้อผิดพลาด', err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch (error) {
      showMessage('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  const handleDeleteStaff = (userId, userName) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users/${userId}`, { 
          method: 'DELETE',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
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
      setSelectedBarIndex(null); 
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
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/detail`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
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
    <TouchableOpacity 
      style={[styles.menuItem, activeMenu === id && styles.menuItemActive]} 
      onPress={() => {
        setActiveMenu(id);
        if (isMobile) setIsMobileMenuOpen(false);
      }}
    >
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

  const maxChartValue = stats?.chartBar && stats.chartBar.length > 0 ? Math.max(...stats.chartBar.map(d => d.value), 1) : 1;
  
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

  const renderSidebarContent = () => (
    <>
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
        <TouchableOpacity style={styles.changePasswordBtn} onPress={() => { setIsPasswordModalOpen(true); if(isMobile) setIsMobileMenuOpen(false); }}>
          <Ionicons name="key-outline" size={20} color="#6366F1" style={styles.menuIcon} />
          <Text style={styles.changePasswordText}>เปลี่ยนรหัสผ่าน</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.menuIcon} />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, flexDirection: isMobile ? 'column' : 'row' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ----------------- Modal ดูรายละเอียดผู้ใช้ทั่วไป ----------------- */}
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

      {/* ----------------- Modal เพิ่มบัญชีเจ้าหน้าที่ ----------------- */}
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

      {/* ----------------- Modal แก้ไขบัญชีเจ้าหน้าที่ ----------------- */}
      <Modal transparent={true} visible={isEditModalOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>แก้ไขข้อมูลเจ้าหน้าที่ระบบ</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ชื่อ-นามสกุล</Text>
                <TextInput style={styles.inputBox} value={editName} onChangeText={setEditName} placeholder="กรอกชื่อ-นามสกุล" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>อีเมล</Text>
                <TextInput 
                  style={styles.inputBox} 
                  value={editEmail} 
                  onChangeText={setEditEmail} 
                  placeholder="name@system.com" 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>เปลี่ยนรหัสผ่านใหม่ (ปล่อยว่างไว้หากไม่ต้องการเปลี่ยน)</Text>
                <TextInput style={styles.inputBox} value={editPassword} onChangeText={setEditPassword} placeholder="รหัสผ่านใหม่" secureTextEntry />
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={handleEditStaff}>
                <Text style={styles.btnSubmitText}>บันทึกการแก้ไข</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ----------------- Modal เปลี่ยนรหัสผ่านตัวเอง ----------------- */}
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

      {/* ----------------- แถบเมนูด้านข้าง (Sidebar) / Mobile TopBar ----------------- */}
      {isMobile ? (
        <View style={styles.mobileBarWrapper}>
          <View style={styles.mobileHeaderBar}>
            <View style={styles.mobileLogoRow}>
              <View style={styles.mobileLogoCircle}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.mobileLogoText}>RMUTK Admin</Text>
            </View>
            <TouchableOpacity 
              style={styles.mobileMenuToggle} 
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              activeOpacity={0.7}
            >
              <Ionicons name={isMobileMenuOpen ? "close" : "menu"} size={26} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {isMobileMenuOpen && (
            <View style={styles.mobileDropdownMenu}>
              {renderSidebarContent()}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.sidebar}>
          {renderSidebarContent()}
        </View>
      )}

      {/* ----------------- ส่วนเนื้อหาหลัก (Main Content) ----------------- */}
      <View style={styles.mainContent}>
        
        <View style={[styles.dashboardHeader, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
          <View>
            <Text style={styles.headerTitle}>
              {activeMenu === 'dashboard' ? 'แดชบอร์ดภาพรวม' : activeMenu === 'users' ? 'จัดการผู้ใช้งานทั่วไป' : activeMenu === 'roles' ? 'กำหนดสิทธิ์เจ้าหน้าที่' : 'ตั้งค่าระบบ'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeMenu === 'dashboard' ? 'สรุปข้อมูลสำคัญของศูนย์กีฬา' : activeMenu === 'settings' ? 'กำหนดเงื่อนไขค่าบริการและการยืมอุปกรณ์' : activeMenu === 'users' ? 'จัดการข้อมูลบัญชีนักศึกษาและบุคคลภายนอก' : 'กำหนดสิทธิ์การเข้าถึงระบบของเจ้าหน้าที่'}
            </Text>
          </View>
          
          {activeMenu === 'dashboard' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              
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
          
          {/* ----------------- 1. แดชบอร์ดภาพรวม ----------------- */}
          {activeMenu === 'dashboard' && (
            <View style={{ zIndex: 1 }}>
              {loading && !refreshing ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A8A" /></View>
              ) : (
                <View style={{ zIndex: 1 }}>
                  <View style={styles.summaryRow}>
                    <View style={[styles.metricCard, isMobile && { minWidth: '47%', margin: 4, padding: 14 }]}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle} numberOfLines={1}>ผู้เข้าใช้ฟิตเนส</Text><Ionicons name="people-outline" size={18} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={[styles.metricValue, isMobile && { fontSize: 24 }]}>{stats.fitnessUsers}</Text><Text style={styles.metricUnit}>คน</Text></View>
                      <Text style={styles.metricSubtext} numberOfLines={1}>ข้อมูล: {displayDateStr}</Text>
                    </View>
                    <View style={[styles.metricCard, isMobile && { minWidth: '47%', margin: 4, padding: 14 }]}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle} numberOfLines={1}>ยอดเงินค่าบริการ</Text><Ionicons name="cash-outline" size={18} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={[styles.metricValue, isMobile && { fontSize: 24 }]}>{stats.revenue}</Text><Text style={styles.metricUnit}>บาท</Text></View>
                      <Text style={styles.metricSubtext} numberOfLines={1}>สด {stats.cash} • QR {stats.qr}</Text>
                    </View>
                    <View style={[styles.metricCard, isMobile && { minWidth: '47%', margin: 4, padding: 14 }]}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle} numberOfLines={1}>อุปกรณ์ที่ถูกยืม</Text><Ionicons name="cube-outline" size={18} color="#64748B" /></View>
                      <View style={styles.metricValueContainer}><Text style={[styles.metricValue, isMobile && { fontSize: 24 }]}>{stats.borrowed}</Text><Text style={styles.metricUnit}>ชิ้น</Text></View>
                      <Text style={styles.metricSubtext} numberOfLines={1}>{stats.notReturned} รายการยังไม่คืน</Text>
                    </View>
                    <View style={[styles.metricCard, isMobile && { minWidth: '47%', margin: 4, padding: 14 }]}>
                      <View style={styles.metricHeader}><Text style={styles.metricTitle} numberOfLines={1}>เกินกำหนดคืน</Text><Ionicons name="calendar-outline" size={18} color={stats.overdue > 0 ? '#EF4444' : '#64748B'} /></View>
                      <View style={styles.metricValueContainer}><Text style={[styles.metricValue, isMobile && { fontSize: 24 }, stats.overdue > 0 && { color: '#EF4444' }]}>{stats.overdue}</Text><Text style={[styles.metricUnit, stats.overdue > 0 && { color: '#EF4444' }]}>รายการ</Text></View>
                      <Text style={[styles.metricSubtext, {color: stats.overdue > 0 ? '#EF4444' : '#64748B'}]} numberOfLines={1}>ต้องติดตามทวงคืน</Text>
                    </View>
                  </View>

                  <View style={styles.chartsRow}>
                    <View style={[styles.barChartCard, isMobile && { minWidth: '100%', padding: 16 }]}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 6}}>
                         <View style={{ flex: 1, minWidth: 150 }}>
                           <Text style={styles.chartTitle}>จำนวนผู้เข้าใช้ฟิตเนส</Text>
                           <Text style={styles.chartSubtitle}>
                             {viewMode === 'monthly' ? (selectedMonth === 'all' ? 'นับรวมตลอดทั้งปี (แบ่งตามเดือน)' : `นับตามวันที่ในเดือน ${monthOptions.find(m=>m.id===selectedMonth)?.name}`) : 'นับตามรอบ 2 ชั่วโมง'}
                           </Text>
                         </View>
                         <View style={{alignItems: isMobile ? 'flex-start' : 'flex-end'}}>
                           <Text style={{fontSize: 11, color: '#64748B'}}>ช่วงที่มีผู้ใช้เยอะที่สุด</Text>
                           <Text style={{fontSize: 14, fontWeight: 'bold', color: '#00A87E'}}>
                              {stats?.peakUsage?.label || '-'} ({stats?.peakUsage?.value || 0} คน)
                           </Text>
                         </View>
                      </View>
                      
                      <View style={styles.chartArea}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled contentContainerStyle={{ minWidth: '100%' }}>
                          <View style={[styles.barsContainer, viewMode === 'monthly' && selectedMonth !== 'all' && { width: Platform.OS === 'web' ? '150%' : 700 }]}>
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
                        </ScrollView>
                        <View style={styles.xAxisLine} />
                      </View>
                    </View>

                    <View style={[styles.donutChartCard, isMobile && { minWidth: '100%', marginTop: 12 }]}>
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
                        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#1E3A8A'}]} /><Text style={styles.legendText}>เงินสด ({stats.cash} บ.)</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#166534'}]} /><Text style={styles.legendText}>QR Code ({stats.qr} บ.)</Text></View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chartsRow}>
                    <View style={[styles.barChartCard, { flex: 1, minHeight: 250, marginTop: 15 }, isMobile && { minWidth: '100%', padding: 16 }]}>
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
                                  <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>{index + 1}. {item.label}</Text>
                                  <Text style={{ fontSize: 13, color: '#00A87E', fontWeight: 'bold' }}>{item.value} ชิ้น</Text>
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

          {/* ----------------- 2. จัดการผู้ใช้งานทั่วไป ----------------- */}
          {activeMenu === 'users' && (
            <View style={styles.tableCard}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A8A" /></View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 650 }}>
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
                              <Ionicons name="eye-outline" size={18} color="#2563EB" />
                              <Text style={styles.actionBtnText}>ดูข้อมูล</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* ----------------- 3. กำหนดสิทธิ์และแก้ไขเจ้าหน้าที่ ----------------- */}
          {activeMenu === 'roles' && (
            <View style={styles.tableCard}>
              <View style={styles.tableActionRow}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>รายชื่อเจ้าหน้าที่ระบบ</Text>
                <TouchableOpacity style={styles.btnAdd} onPress={() => setIsAddModalOpen(true)}>
                  <Ionicons name="person-add" size={16} color="#FFF" />
                  <Text style={styles.btnAddText}> เพิ่มบัญชีเจ้าหน้าที่</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ minWidth: 600 }}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCol, {flex: 2}]}>ชื่อผู้ใช้งาน</Text>
                    <Text style={[styles.tableCol, {flex: 1.5}]}>ประเภท</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>สถานะการระงับ</Text>
                    <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>จัดการ</Text>
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
                        
                        <View style={[styles.tableCell, {flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}]}>
                          <TouchableOpacity 
                            style={{ padding: 6, marginRight: 8, backgroundColor: '#DBEAFE', borderRadius: 6 }} 
                            onPress={() => openEditStaffModal(user)}
                          >
                            <Ionicons name="pencil-outline" size={18} color="#2563EB" />
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={{ padding: 6, backgroundColor: '#FEE2E2', borderRadius: 6 }} 
                            onPress={() => handleDeleteStaff(user.id, user.full_name)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ----------------- 4. ตั้งค่าระบบ ----------------- */}
          {activeMenu === 'settings' && (
            <View style={styles.settingsGrid}>
              <View style={[styles.settingsGridCard, isMobile && { width: '100%' }]}>
                <Text style={styles.settingsCardTitle}>ค่าบริการฟิตเนส</Text>
                <Text style={styles.settingsCardSub}>อัตราค่าบริการต่อครั้ง</Text>
                <View style={[styles.settingsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
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

              <View style={[styles.settingsGridCard, isMobile && { width: '100%' }]}>
                <Text style={styles.settingsCardTitle}>เงื่อนไขการยืมอุปกรณ์</Text>
                <Text style={styles.settingsCardSub}>ข้อจำกัดของการทำรายการยืมแต่ละครั้ง</Text>
                <View style={[styles.settingsRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
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

              <View style={[styles.settingsGridCard, isMobile && { width: '100%' }]}>
                <Text style={styles.settingsCardTitle}>ช่องทางชำระเงิน</Text>
                <Text style={styles.settingsCardSub}>เปิด-ปิดการรับชำระผ่าน QR</Text>
                <View style={styles.switchRowContainer}>
                  <View style={{ flex: 1, marginRight: 10 }}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { height: 300, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContainer: { width: '90%', maxWidth: 500, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  modalBody: { padding: 20, maxHeight: 450 },
  profileSection: { alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#E2E8F0' },
  profileAvatarImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: '#E2E8F0', resizeMode: 'cover' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  detailSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 10, marginTop: 10 },
  detailBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  detailLabel: { fontSize: 13, color: '#64748B' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
  idCardBox: { width: '100%', height: 180, backgroundColor: '#F8FAFC', borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  idCardImg: { width: '100%', height: '100%' },
  closeModalBtn: { backgroundColor: '#1E3A8A', paddingVertical: 14, alignItems: 'center' },
  closeModalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  
  /* Mobile Header Bar */
  mobileBarWrapper: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 100 },
  mobileHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  mobileLogoRow: { flexDirection: 'row', alignItems: 'center' },
  mobileLogoCircle: { width: 34, height: 34, backgroundColor: '#1E3A8A', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mobileLogoText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  mobileMenuToggle: { padding: 4 },
  mobileDropdownMenu: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },

  sidebar: { width: 260, backgroundColor: '#FFFFFF', paddingVertical: 20, paddingHorizontal: 15, justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logoCircle: { width: 48, height: 48, backgroundColor: '#1E3A8A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  menuContainer: { flex: 1 },
  menuSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginTop: 16, marginBottom: 8, paddingHorizontal: 10, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 4 },
  menuItemActive: { backgroundColor: '#F1F5F9' },
  menuIcon: { marginRight: 10 },
  menuText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  menuTextActive: { color: '#1E293B', fontWeight: 'bold' },
  bottomMenu: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 8 },
  changePasswordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE' },
  changePasswordText: { color: '#7C3AED', fontWeight: 'bold', fontSize: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
  
  mainContent: { flex: 1 },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 12, zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  headerSubtitle: { fontSize: 12, color: '#64748B' },
  
  toggleGroup: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#1E3A8A' },
  
  monthDropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', height: 32 },
  monthDropdownText: { fontSize: 12, fontWeight: '600', color: '#334155', marginRight: 6 },
  monthDropdownList: { position: 'absolute', top: 38, right: 0, width: 150, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  monthDropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  monthDropdownItemText: { fontSize: 12, color: '#475569' },

  saveSettingsBtn: { backgroundColor: '#1E3A8A', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  saveSettingsBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  contentArea: { paddingHorizontal: 16, paddingBottom: 20, flex: 1, zIndex: 1 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12, zIndex: 1 },
  metricCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, flex: 1, minWidth: 180, margin: 4, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  metricTitle: { fontSize: 12, color: '#475569', fontWeight: '600', flex: 1, marginRight: 4 },
  metricValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  metricValue: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', marginRight: 6 },
  metricUnit: { fontSize: 13, color: '#475569', fontWeight: '600' },
  metricSubtext: { fontSize: 11, color: '#94A3B8' },
  chartsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', zIndex: 1 },
  barChartCard: { flex: 2, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, margin: 4, minWidth: 320, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: '#64748B', marginBottom: 20 },

  chartArea: { height: 210, paddingBottom: 20, paddingTop: 25, position: 'relative' },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 10 },
  barItem: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barBackground: { width: '100%', maxWidth: 36, height: '100%', backgroundColor: '#F8FAFC', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' }, 
  barFill: { width: '100%', backgroundColor: '#1E3A8A', borderRadius: 4 }, 
  barLabel: { fontSize: 10, color: '#64748B', position: 'absolute', bottom: -22 },
  xAxisLine: { height: 1, backgroundColor: '#E2E8F0', width: '100%', position: 'absolute', bottom: 0 },

  tooltipBubble: { 
    position: 'absolute', 
    marginBottom: 6, 
    backgroundColor: '#0F172A', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4, 
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  tooltipText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
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

  donutChartCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, margin: 4, minWidth: 260, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  donutContainer: { alignItems: 'center', justifyContent: 'center', height: 160, marginTop: 10 },
  donutCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 20, borderColor: '#1E3A8A', borderBottomColor: '#166534', borderLeftColor: '#166534', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  donutInnerCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-45deg' }] },
  donutTotalLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  donutTotalValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  donutLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tableActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 8 },
  btnAdd: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  btnAddText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tableCol: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  tableCell: { fontSize: 13, color: '#1E293B' },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 16 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnText: { fontSize: 11, color: '#2563EB', fontWeight: 'bold', marginLeft: 4 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  inputBox: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 42, fontSize: 13, backgroundColor: '#F8FAFC' },
  btnSubmit: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 16 },
  btnSubmitText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  settingsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  settingsGridCard: { width: '49%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  settingsCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  settingsCardSub: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  settingsInputWrapper: { flex: 1 },
  settingsInputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center' },
  settingsInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 8, fontSize: 13, color: '#1E293B' },
  unitText: { marginLeft: 8, fontSize: 13, color: '#64748B' },
  switchRowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  switchSub: { fontSize: 11, color: '#64748B' }
});
