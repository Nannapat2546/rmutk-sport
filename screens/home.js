import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Platform, Image, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const facultyNameThai = {
  'arts': 'คณะศิลปศาสตร์', 'science': 'คณะวิทยาศาสตร์และเทคโนโลยี', 'industrial_education': 'คณะครุศาสตร์อุตสาหกรรม',
  'engineering': 'คณะวิศวกรรมศาสตร์', 'business': 'คณะบริหารธุรกิจ', 'home_economics': 'คณะเทคโนโลยีคหกรรมศาสตร์',
  'textile': 'คณะอุตสาหกรรมสิ่งทอ', 'international_college': 'วิทยาลัยนานาชาติ', 'isic': 'สถาบันวิทยาศาสตร์ นวัตกรรมและวัฒนธรรม',
};

const majorNameThai = {
  'english': 'ภาษาอังกฤษเพื่อการสื่อสารสากล', 'chinese': 'ภาษาจีนเพื่อการสื่อสาร', 'japanese': 'ภาษาญี่ปุ่น', 'tourism': 'การท่องเที่ยว', 'hotel': 'การโรงแรม',
  'cs': 'วิทยาการคอมพิวเตอร์', 'it': 'เทคโนโลยีสารสนเทศ', 'chemistry': 'เคมี', 'physics': 'ฟิสิกส์', 'math': 'คณิตศาสตร์', 'food_science': 'วิทยาศาสตร์และเทคโนโลยีการอาหาร',
  'te_me': 'ครุศาสตร์อุตสาหกรรม (เครื่องกล)', 'te_ie': 'ครุศาสตร์อุตสาหกรรม (อุตสาหการ)',
  'me': 'วิศวกรรมเครื่องกล', 'ee': 'วิศวกรรมไฟฟ้า', 'ce': 'วิศวกรรมคอมพิวเตอร์', 'civil': 'วิศวกรรมโยธา', 'ie': 'วิศวกรรมอุตสาหการ', 'che': 'วิศวกรรมเคมี', 'se': 'วิศวกรรมสำรวจ', 'electronic': 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม',
  'acc': 'การบัญชี', 'is': 'ระบบสารสนเทศ', 'marketing': 'การตลาด', 'management': 'การจัดการ', 'finance': 'การเงิน', 'international_business': 'ธุรกิจระหว่างประเทศ',
  'food_nutrition': 'อาหารและโภชนาการ', 'fashion': 'การออกแบบแฟชั่น', 'early_childhood': 'การศึกษาปฐมวัย',
  'textile_eng': 'วิศวกรรมสิ่งทอ', 'textile_design': 'การออกแบบสิ่งทอ', 'garment': 'เทคโนโลยีเสื้อผ้า',
  'ic_biz': 'บริหารธุรกิจ (นานาชาติ)', 'ic_tourism': 'การท่องเที่ยว (นานาชาติ)', 'innovation': 'นวัตกรรมและวัฒนธรรม',
};

export default function Dashboard({ route, navigation }) {
  const API_URL = 'https://app-rmutk-sports.onrender.com';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popularEquipment, setPopularEquipment] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [categories, setCategories] = useState(['ทั้งหมด']);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  // State สำหรับระบบแจ้งเตือน
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
      // 🌟 เปลี่ยนมาเรียกใช้ API สำหรับนักศึกษา
      const response = await fetch(`${API_URL}/api/inventory`); 
      const data = await response.json();
      
      if(Array.isArray(data)) {
        // 🌟 กรองเอาเฉพาะอุปกรณ์ที่มีจำนวนให้ยืมมากกว่า 0
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

      // 1. ดึงประวัติฟิตเนส
      const fitRes = await fetch(`${API_URL}/api/fitness-history/${targetAccountId}`);
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

      // 2. ดึงประวัติยืม-คืน (เฉพาะนักศึกษา)
      if (role !== 'external') {
        const eqRes = await fetch(`${API_URL}/api/history/${targetAccountId}`);
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          eqData.forEach(item => {
            const isReturned = !!item.return_date;
            const borrowDate = new Date(item.borrow_date);
            const today = new Date();
            
            // 🌟 แก้ไข: ตัดเวลาออก คำนวณแค่วันที่ข้ามวัน
            borrowDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            
            const diffTime = today - borrowDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = !isReturned && diffDays > 0; // 🌟 ข้ามวัน 1 วัน = ล่าช้าทันที

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
              date: new Date(item.borrow_date), // ใช้วันที่จริงเรียง
              icon: notifIcon,
              color: notifColor,
              bg: notifBg
            });
          });
        }
      }

      // 3. ดึงแจ้งเตือนตรงจาก Admin
      try {
        const adminNotifRes = await fetch(`${API_URL}/api/notifications/${targetAccountId}`);
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

      // เรียงลำดับจากใหม่สุดไปเก่าสุด
      notifs.sort((a, b) => b.date - a.date);
      setNotifications(notifs);

    } catch (error) {
      console.error("Fetch Notif Error:", error);
    }
    setIsLoadingNotif(false);
  };

  const filteredEquipment = allEquipment.filter(item => {
    if (activeCategory === 'ทั้งหมด') return true;
    const catName = item.category_name || 'ทั่วไป';
    return catName === activeCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      
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
          <Text style={styles.menuTitleText}>
            {role === 'external' ? 'ระบบการเข้าใช้ฟิตเนส' : 'ระบบยืม-คืน อุปกรณ์กีฬาและการเข้าใช้ฟิตเนส'}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {/* 🌟 เมื่อกดกระดิ่งให้มันโหลดข้อมูลใหม่สดๆ ทันที */}
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
              <Text style={[styles.menuLinkText, {color: 'red'}]}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.greetingSection}>
          <View style={styles.nameRow}>
            <Text style={styles.greetingText}>สวัสดี, {userName}</Text>
            <View style={[styles.badge, role === 'external' && { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name={role === 'student' ? 'school' : 'person'} size={12} color={role === 'student' ? '#00A87E' : '#D97706'} />
              <Text style={[styles.badgeText, role === 'external' && { color: '#D97706' }]}>
                {roleText}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>อีเมล</Text>
            <Text style={styles.infoValue}>{userEmail}</Text>
          </View>
          
          {role === 'student' ? (
            <View style={[styles.infoCard, { marginTop: 10 }]}>
              <Text style={styles.infoLabel}>คณะ/สาขา</Text>
              <Text style={styles.infoValue}>{userFaculty}</Text>
            </View>
          ) : (
            <View style={[styles.infoCard, { marginTop: 10 }]}>
              <Text style={styles.infoLabel}>เบอร์โทรศัพท์</Text>
              <Text style={styles.infoValue}>{userData?.phone || '-'}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>QR Code ของฉัน</Text>
          <Text style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
            {role === 'external' ? 'ใช้สำหรับสแกนเข้าใช้บริการฟิตเนส' : 'ใช้สำหรับสแกนยืม-คืนอุปกรณ์ และเข้าใช้ฟิตเนส'}
          </Text>
          <View style={styles.qrCard}>
            {userId !== '-' ? (
              <QRCode value={userId} size={160} color="black" backgroundColor="white" />
            ) : (
              <Ionicons name="qr-code" size={150} color="#CCC" />
            )}
            <Text style={styles.qrId}>{userId}</Text>
          </View>
        </View>

        {role !== 'external' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>อุปกรณ์ทั้งหมด</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoading ? (
              <ActivityIndicator size="small" color="#00A87E" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.gridContainer}>
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => (
                    <View key={item.id} style={styles.gridCard}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.gridImage, styles.noImagePlaceholder]}>
                          <Ionicons name="image-outline" size={30} color="#CCC" />
                        </View>
                      )}
                      <Text style={styles.gridItemName} numberOfLines={1}>{item.item_name}</Text>
                      <Text style={styles.gridItemCategory} numberOfLines={1}>{item.category_name || 'ทั่วไป'}</Text>
                      <View style={styles.gridMetaRow}>
                        <View style={styles.stockBadgeGrid}>
                          <Text style={styles.stockBadgeGridText}>ว่าง {item.stock}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#888', textAlign: 'center', width: '100%', marginTop: 20 }}>ไม่มีอุปกรณ์ในหมวดหมู่นี้</Text>
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
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  
  menuGroup: { backgroundColor: '#FFF', padding: 20, margin: 15, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuTitleText: { fontSize: 14, fontWeight: 'bold', color: '#00A87E', width: '70%' },
  
  bellIcon: { position: 'relative', marginRight: 5 },
  redDot: { position: 'absolute', top: -2, right: 0, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 1, borderColor: '#FFF' },

  menuList: { marginTop: 20, alignItems: 'center' },
  menuLink: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  menuLinkText: { fontSize: 16, color: '#333' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  greetingSection: { marginBottom: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  greetingText: { fontSize: 22, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#eee' },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: 'bold' },
  
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  qrCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  qrId: { fontSize: 16, fontWeight: 'bold', marginTop: 20, letterSpacing: 1 },
  
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F5EF', paddingHorizontal: 8, borderRadius: 12, marginLeft: 10 },
  badgeText: { fontSize: 12, color: '#00A87E', fontWeight: 'bold' },

  categoryScroll: { marginBottom: 15 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 10, backgroundColor: '#FFF' },
  categoryPillActive: { backgroundColor: '#00A87E', borderColor: '#00A87E' },
  categoryPillText: { color: '#666', fontSize: 14 },
  categoryPillTextActive: { color: '#FFF', fontWeight: 'bold' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', elevation: 1 },
  gridImage: { width: 80, height: 80, marginBottom: 12, borderRadius: 10 },
  noImagePlaceholder: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  gridItemName: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 2 },
  gridItemCategory: { fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 10 },
  gridMetaRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  stockBadgeGrid: { backgroundColor: '#E0F2E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  stockBadgeGridText: { color: '#00A87E', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  modalContainer: { width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 16, maxHeight: '80%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  notifScroll: { padding: 15 },
  notifCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  notifIconBox: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  notifDetail: { fontSize: 13, color: '#666', marginBottom: 6 },
  notifDate: { fontSize: 11, color: '#999' },
  emptyNotif: { padding: 40, alignItems: 'center' },
  emptyNotifText: { marginTop: 10, color: '#999', fontSize: 16 }
});
