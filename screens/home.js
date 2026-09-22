import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Platform, Image, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const facultyNameThai = {
  'arts': 'คณะศิลปศาสตร์', 'science': 'คณะวิทยาศาสตร์และเทคโนโลยี', 'industrial_education': 'คณะครุศาสตร์อุตสาหกรรม',
  'engineering': 'คณะวิศวกรรมศาสตร์', 'business': 'คณะบริหารธุรกิจ', 'home_economics': 'คณะเทคโนโลยีคหกรรมศาสตร์',
  'textile': 'คณะอุตสาหกรรมสิ่งทอ', 'international_college': 'วิทยาลัยนานาชาติ', 'isic': 'สถาบันวิทยาศาสตร์ นวัตกรรมและวัฒนธรรม',
};

const majorNameThai = {
  'english': 'ภาษาอังกฤษ', 'chinese': 'ภาษาจีน', 'japanese': 'ภาษาญี่ปุ่น', 'tourism': 'การท่องเที่ยว', 'hotel': 'การโรงแรม',
  'cs': 'วิทยาการคอมพิวเตอร์', 'it': 'เทคโนโลยีสารสนเทศ', 'marketing': 'การตลาด', 'management': 'การจัดการ',
};

export default function Dashboard({ route, navigation }) {
  const API_URL = 'https://envision-stumble-kept.ngrok-free.dev';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popularEquipment, setPopularEquipment] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [categories, setCategories] = useState(['ทั้งหมด']);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);

  const { userData, role } = route.params || {};
  
  const userName = userData?.full_name || 'ผู้ใช้งาน'; 
  const userEmail = userData?.email || '-';
  const userId = userData?.student_id || userData?.citizen_id || '-';
  const targetAccountId = userData?.accountId || userData?.account_id || userData?.id;
  
  const rawFaculty = userData?.faculty?.toLowerCase();
  const rawMajor = userData?.major?.toLowerCase();
  const mappedFaculty = facultyNameThai[rawFaculty] || userData?.faculty;
  const mappedMajor = majorNameThai[rawMajor] || userData?.major;
  const userFaculty = userData?.faculty ? `${mappedFaculty} / ${mappedMajor}` : '-';

  const roleText = role === 'student' ? 'นักศึกษา' : 'บุคคลภายนอก';

  useEffect(() => {
    if (role !== 'external') {
      fetchEquipmentData();
    } else {
      setIsLoading(false);
    }
    
    if (targetAccountId) {
      fetchNotifications();
    }
  }, [role, targetAccountId]);

  const fetchEquipmentData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/inventory`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }); 
      const data = await response.json();
      
      if(Array.isArray(data)) {
        const availableItems = data.filter(item => parseInt(item.stock) > 0);

        setPopularEquipment(availableItems.slice(0, 4));
        setAllEquipment(availableItems);

        const uniqueCategories = ['ทั้งหมด'];
        availableItems.forEach(item => {
          const catName = item.category_name || 'ทั่วไป';
          if (!uniqueCategories.includes(catName)) {
            uniqueCategories.push(catName);
          }
        });
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Fetch Data Error:", error);
    }
    setIsLoading(false);
  };

  const fetchNotifications = async () => {
    setIsLoadingNotif(true);
    try {
      let notifs = [];

      const fitRes = await fetch(`${API_URL}/api/fitness-history/${targetAccountId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (fitRes.ok) {
        const fitData = await fitRes.json();
        fitData.forEach(item => {
          notifs.push({
            id: `fit_${item.id}`,
            type: 'fitness',
            title: 'เข้าใช้บริการฟิตเนส',
            detail: `ชำระค่าบริการ ${item.service_fee} บาท`,
            date: new Date(item.check_in_time),
            icon: 'barbell',
            color: '#F59E0B', 
            bg: '#FEF3C7'
          });
        });
      }

      if (role !== 'external') {
        const eqRes = await fetch(`${API_URL}/api/history/${targetAccountId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          eqData.forEach(item => {
            const isReturned = !!item.return_date;
            const borrowDate = new Date(item.borrow_date);
            const today = new Date();
            
            borrowDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            
            const diffTime = today - borrowDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = !isReturned && diffDays > 0;

            let notifType, notifTitle, notifIcon, notifColor, notifBg, notifDetail;

            if (isReturned) {
              notifType = 'return';
              notifTitle = 'คืนอุปกรณ์เรียบร้อย';
              notifDetail = `${item.equipment} จำนวน ${item.amount} ชิ้น`;
              notifIcon = 'checkmark-circle';
              notifColor = '#10B981';
              notifBg = '#D1FAE5';
            } else if (isOverdue) {
              notifType = 'overdue';
              notifTitle = 'ค้างคืนอุปกรณ์กีฬา! (เลยกำหนด)';
              notifDetail = `${item.equipment} จำนวน ${item.amount} ชิ้น (ล่าช้า ${diffDays} วัน)`;
              notifIcon = 'alert-circle';
              notifColor = '#EF4444'; 
              notifBg = '#FEE2E2';
            } else {
              notifType = 'borrowing';
              notifTitle = 'กำลังยืมอุปกรณ์';
              notifDetail = `${item.equipment} จำนวน ${item.amount} ชิ้น (ยอดค้างส่ง)`;
              notifIcon = 'time';
              notifColor = '#3B82F6'; 
              notifBg = '#EFF6FF';
            }

            notifs.push({
              id: `eq_${item.id}`,
              type: notifType,
              title: notifTitle,
              detail: notifDetail,
              date: new Date(item.borrow_date),
              icon: notifIcon,
              color: notifColor,
              bg: notifBg
            });
          });
        }
      }

      try {
        const adminNotifRes = await fetch(`${API_URL}/api/notifications/${targetAccountId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (adminNotifRes.ok) {
          const adminNotifsData = await adminNotifRes.json();
          adminNotifsData.forEach(item => {
            notifs.push({
              id: `admin_notif_${item.id}`,
              type: 'admin_alert', 
              title: item.title || 'แจ้งเตือนจากระบบ',
              detail: item.message,
              date: new Date(item.created_at),
              icon: 'warning', 
              color: '#EF4444', 
              bg: '#FEE2E2' 
            });
          });
        }
      } catch (e) {
        console.log("Fetch Admin Notifs Error:", e);
      }

      notifs.sort((a, b) => b.date - a.date);
      setNotifications(notifs);

    } catch (error) {
      console.error("Fetch Notif Error:", error);
    }
    setIsLoadingNotif(false);
  };

  const filteredEquipment = allEquipment.filter(item => {
    const matchCategory = activeCategory === 'ทั้งหมด' || (item.category_name || 'ทั่วไป') === activeCategory;
    const matchSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 🌟 Modal แจ้งเตือน */}
      <Modal animationType="fade" transparent={true} visible={isNotifOpen} onRequestClose={() => setIsNotifOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>การแจ้งเตือน</Text>
              <TouchableOpacity onPress={() => setIsNotifOpen(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {isLoadingNotif ? (
              <ActivityIndicator size="large" color="#00A87E" style={{ padding: 40 }} />
            ) : (
              <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={false}>
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <View key={notif.id} style={styles.notifCard}>
                      <View style={[styles.notifIconBox, { backgroundColor: notif.bg }]}>
                        <Ionicons name={notif.icon} size={24} color={notif.color} />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={[styles.notifTitle, (notif.type === 'overdue' || notif.type === 'admin_alert') && { color: '#EF4444' }]}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notifDetail}>{notif.detail}</Text>
                        <Text style={styles.notifDate}>
                          {notif.date.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} น.
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyNotif}>
                    <Ionicons name="notifications-off-outline" size={50} color="#CCC" />
                    <Text style={styles.emptyNotifText}>ไม่มีการแจ้งเตือนใหม่</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.menuGroup}>
        <View style={styles.menuHeaderRow}>
          <Text style={styles.menuTitleText} numberOfLines={1}>
            {role === 'external' ? 'ระบบเข้าใช้ฟิตเนส' : 'ระบบยืม-คืน อุปกรณ์กีฬาและการเข้าใช้ฟิตเนส'}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity style={styles.bellIcon} onPress={() => { setIsNotifOpen(true); fetchNotifications(); }}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              {notifications.some(n => n.type === 'overdue' || n.type === 'borrowing' || n.type === 'admin_alert') && (
                <View style={styles.redDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)}>
              <Ionicons name={isMenuOpen ? "close" : "menu"} size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {isMenuOpen && (
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuLink} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.menuLinkText}>หน้าแรก</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuLink} 
              onPress={() => {
                setIsMenuOpen(false); 
                if (targetAccountId) {
                  navigation.navigate('History', { 
                    accountId: targetAccountId, 
                    role: role || (userData?.citizen_id ? 'external' : 'student') 
                  });
                } else {
                  Alert.alert("ไม่พบข้อมูล", "กรุณาออกจากระบบแล้วล็อกอินใหม่", [{ text: "ตกลง" }]);
                }
              }} 
            >
              <Text style={styles.menuLinkText}>ประวัติของฉัน</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuLink} onPress={() => navigation.replace('Login')}>
              <Text style={[styles.menuLinkText, {color: '#EF4444'}]}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ================= 1. ส่วนทักทาย ================= */}
        <View style={styles.greetingSection}>
          <View style={styles.nameRow}>
            <Text style={styles.greetingText}>สวัสดี, {userName}</Text>
            <View style={[styles.roleBadge, role === 'external' ? {backgroundColor: '#FEF3C7'} : {backgroundColor: '#E6F5EF'}]}>
              <Text style={[styles.roleBadgeText, role === 'external' ? {color: '#D97706'} : {color: '#00A87E'}]}>{roleText}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>อีเมล</Text>
            <Text style={styles.infoValue}>{userEmail}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{role === 'student' ? 'คณะ/สาขา' : 'เบอร์โทรศัพท์'}</Text>
            <Text style={styles.infoValue}>{role === 'student' ? userFaculty : (userData?.phone || '-')}</Text>
          </View>
        </View>

        {/* ================= 2. ส่วน QR Code ================= */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>QR Code ของฉัน</Text>
          <Text style={styles.sectionSubtitle}>
            {role === 'external' ? 'ใช้สำหรับสแกนเข้าใช้บริการฟิตเนส' : 'ใช้สำหรับสแกนยืม-คืนอุปกรณ์ และเข้าใช้ฟิตเนส'}
          </Text>
          <View style={styles.qrCard}>
            {userId !== '-' ? (
              <QRCode value={userId} size={150} color="black" backgroundColor="white" />
            ) : (
              <Ionicons name="qr-code" size={150} color="#CCC" />
            )}
            <Text style={styles.qrId}>{userId}</Text>
          </View>
        </View>

        {/* ================= 3. ส่วนรายการอุปกรณ์ ================= */}
        {role !== 'external' && (
          <View style={styles.sectionContainer}>
            
            <View style={styles.eqHeaderRow}>
              <Text style={styles.sectionTitle}>อุปกรณ์ทั้งหมด</Text>
              
              <View style={styles.searchContainer}>
                <TextInput 
                  placeholder="ค้นหา..." 
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.searchBtn}>
                  <Ionicons name="search-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoading ? (
              <ActivityIndicator size="large" color="#00A87E" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.gridContainer}>
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => (
                    <View key={item.id} style={styles.gridCard}>
                      <View style={styles.gridImageBox}>
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="contain" />
                        ) : (
                          <Ionicons name="image-outline" size={35} color="#CBD5E1" />
                        )}
                      </View>
                      <Text style={styles.gridItemName} numberOfLines={1}>{item.item_name}</Text>
                      <Text style={styles.gridItemCategory} numberOfLines={1}>{item.category_name || 'ลูกบอล'}</Text>
                      
                      <View style={styles.stockBadgeGrid}>
                        <Text style={styles.stockBadgeGridText}>ว่าง {item.stock}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#888', textAlign: 'center', width: '100%', marginTop: 20 }}>ไม่พบอุปกรณ์ที่ค้นหา</Text>
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  menuGroup: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 15, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 10 },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuTitleText: { fontSize: 16, fontWeight: 'bold', color: '#00A87E', flex: 1, marginRight: 10 },
  
  bellIcon: { position: 'relative', marginRight: 5 },
  redDot: { position: 'absolute', top: -2, right: 0, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1, borderColor: '#FFF' },

  menuList: { marginTop: 15, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10 },
  menuLink: { paddingVertical: 12, width: '100%', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  menuLinkText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },

  scrollContent: { padding: 16, paddingBottom: 40, alignSelf: 'center', width: '100%', maxWidth: 600 },
  
  greetingSection: { marginBottom: 25 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  greetingText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginRight: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  roleBadgeText: { fontSize: 12, fontWeight: 'bold' },
  
  infoCard: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  
  sectionContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 15 },
  
  qrCard: { backgroundColor: '#FFF', paddingVertical: 35, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  qrCodeBox: { padding: 10, backgroundColor: '#FFF' },
  qrId: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 15, letterSpacing: 1 },
  
  eqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { width: 140, height: 38, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 15, fontSize: 13, color: '#1E293B', outlineStyle: 'none', marginRight: 8 },
  searchBtn: { backgroundColor: '#00A87E', width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  categoryScroll: { marginBottom: 15 },
  categoryPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 10, backgroundColor: '#FFF' },
  categoryPillActive: { backgroundColor: '#00A87E', borderColor: '#00A87E' },
  categoryPillText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  categoryPillTextActive: { color: '#FFF' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
  gridImageBox: { width: '100%', height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridImage: { width: 80, height: 80 },
  noImagePlaceholder: { backgroundColor: '#F1F5F9', width: 80, height: 80, borderRadius: 40 },
  gridItemName: { fontSize: 14, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 4 },
  gridItemCategory: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 12 },
  stockBadgeGrid: { backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  stockBadgeGridText: { color: '#059669', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 12, maxHeight: '80%', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  notifScroll: { padding: 15 },
  notifCard: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  notifIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  notifDetail: { fontSize: 12, color: '#475569', marginBottom: 4, lineHeight: 18 },
  notifDate: { fontSize: 11, color: '#94A3B8' },
  emptyNotif: { padding: 40, alignItems: 'center' },
  emptyNotifText: { marginTop: 10, color: '#9CA3AF', fontSize: 14, fontWeight: '500' }
});
