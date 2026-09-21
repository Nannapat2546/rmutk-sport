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
  'english': 'ภาษาอังกฤษ', 'chinese': 'ภาษาจีน', 'japanese': 'ภาษาญี่ปุ่น', 'tourism': 'การท่องเที่ยว', 'hotel': 'การโรงแรม',
  'cs': 'วิทยาการคอมพิวเตอร์', 'it': 'เทคโนโลยีสารสนเทศ', 'marketing': 'การตลาด', 'management': 'การจัดการ',
};

export default function Dashboard({ route, navigation }) {
  const API_URL = 'https://rmutk-sport.onrender.com';
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popularEquipment, setPopularEquipment] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [categories, setCategories] = useState(['ทั้งหมด']);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

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
    if (role !== 'external') fetchEquipmentData();
    else setIsLoading(false);
    if (targetAccountId) fetchNotifications();
  }, [role, targetAccountId]);

  const fetchEquipmentData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/inventory`); 
      const data = await response.json();
      
      if(Array.isArray(data)) {
        const availableItems = data.filter(item => parseInt(item.stock) > 0);
        setPopularEquipment(availableItems.slice(0, 4));
        setAllEquipment(availableItems);

        const uniqueCategories = ['ทั้งหมด'];
        availableItems.forEach(item => {
          const catName = item.category_name || 'ทั่วไป';
          if (!uniqueCategories.includes(catName)) uniqueCategories.push(catName);
        });
        setCategories(uniqueCategories);
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const fetchNotifications = async () => {
    setIsLoadingNotif(true);
    try {
      let notifs = [];

      const fitRes = await fetch(`${API_URL}/api/fitness-history/${targetAccountId}`);
      if (fitRes.ok) {
        const fitData = await fitRes.json();
        fitData.forEach(item => {
          notifs.push({
            id: `fit_${item.id}`, type: 'fitness', title: 'เข้าใช้บริการฟิตเนส', detail: `ชำระค่าบริการ ${item.service_fee} บาท`,
            date: new Date(item.check_in_time), icon: 'barbell', color: '#0EA5E9', bg: '#E0F2FE'
          });
        });
      }

      if (role !== 'external') {
        const eqRes = await fetch(`${API_URL}/api/history/${targetAccountId}`);
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          eqData.forEach(item => {
            const isReturned = !!item.return_date;
            const borrowDate = new Date(item.borrow_date);
            const today = new Date();
            borrowDate.setHours(0,0,0,0); today.setHours(0,0,0,0);
            const diffTime = today - borrowDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = !isReturned && diffDays > 0;

            let notifType, notifTitle, notifIcon, notifColor, notifBg, notifDetail;

            if (isReturned) {
              notifType = 'return'; notifTitle = 'คืนอุปกรณ์เรียบร้อย'; notifDetail = `${item.equipment} จำนวน ${item.amount} ชิ้น`;
              notifIcon = 'checkmark-circle'; notifColor = '#10B981'; notifBg = '#D1FAE5';
            } else if (isOverdue) {
              notifType = 'overdue'; notifTitle = 'ค้างคืนอุปกรณ์กีฬา!'; notifDetail = `${item.equipment} ${item.amount} ชิ้น (ล่าช้า ${diffDays} วัน)`;
              notifIcon = 'alert-circle'; notifColor = '#EF4444'; notifBg = '#FEE2E2';
            } else {
              notifType = 'borrowing'; notifTitle = 'กำลังยืมอุปกรณ์'; notifDetail = `${item.equipment} จำนวน ${item.amount} ชิ้น`;
              notifIcon = 'time'; notifColor = '#3B82F6'; notifBg = '#EFF6FF';
            }

            notifs.push({
              id: `eq_${item.id}`, type: notifType, title: notifTitle, detail: notifDetail,
              date: new Date(item.borrow_date), icon: notifIcon, color: notifColor, bg: notifBg
            });
          });
        }
      }

      notifs.sort((a, b) => b.date - a.date);
      setNotifications(notifs);

    } catch (error) { console.error(error); }
    setIsLoadingNotif(false);
  };

  const filteredEquipment = allEquipment.filter(item => {
    if (activeCategory === 'ทั้งหมด') return true;
    return (item.category_name || 'ทั่วไป') === activeCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 🌟 Modal แจ้งเตือน */}
      <Modal animationType="fade" transparent={true} visible={isNotifOpen} onRequestClose={() => setIsNotifOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>การแจ้งเตือนล่าสุด</Text>
              <TouchableOpacity onPress={() => setIsNotifOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
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
                        <Ionicons name={notif.icon} size={22} color={notif.color} />
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
                    <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyNotifText}>ไม่มีรายการใหม่</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.topNav}>
        <Text style={styles.topNavTitle}>RMUTK Sports</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <TouchableOpacity style={styles.bellIcon} onPress={() => { setIsNotifOpen(true); fetchNotifications(); }}>
            <Ionicons name="notifications" size={24} color="#1E293B" />
            {notifications.some(n => n.type === 'overdue' || n.type === 'borrowing') && (
              <View style={styles.redDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)}>
            <Ionicons name={isMenuOpen ? "close" : "grid"} size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {isMenuOpen && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity style={styles.menuLink} onPress={() => setIsMenuOpen(false)}>
            <Ionicons name="home-outline" size={20} color="#1E293B" style={{marginRight: 10}}/>
            <Text style={styles.menuLinkText}>หน้าแรก</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuLink} onPress={() => { setIsMenuOpen(false); if(targetAccountId) navigation.navigate('History', { accountId: targetAccountId, role: role || (userData?.citizen_id ? 'external' : 'student') }); }}>
            <Ionicons name="time-outline" size={20} color="#1E293B" style={{marginRight: 10}}/>
            <Text style={styles.menuLinkText}>ประวัติของฉัน</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuLink, {borderBottomWidth: 0}]} onPress={() => navigation.replace('Login')}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{marginRight: 10}}/>
            <Text style={[styles.menuLinkText, {color: '#EF4444'}]}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ================= Banner Greeting ================= */}
        <View style={styles.bannerSection}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View style={{flex: 1}}>
              <Text style={styles.bannerGreeting}>สวัสดี,</Text>
              <Text style={styles.bannerName} numberOfLines={1}>{userName}</Text>
              <View style={[styles.roleBadge, role === 'external' ? {backgroundColor: '#FEF3C7'} : {backgroundColor: '#D1FAE5'}]}>
                <Ionicons name={role === 'student' ? 'school' : 'person'} size={12} color={role === 'student' ? '#059669' : '#D97706'} />
                <Text style={[styles.roleBadgeText, role === 'external' ? {color: '#D97706'} : {color: '#059669'}]}> {roleText}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.bannerInfoBox}>
            <Text style={styles.bannerInfoText}><Ionicons name="mail" size={14}/> {userEmail}</Text>
            <Text style={styles.bannerInfoText}><Ionicons name="call" size={14}/> {role === 'student' ? userFaculty : (userData?.phone || '-')}</Text>
          </View>
        </View>

        {/* ================= QR Code Card ================= */}
        <View style={styles.sectionContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <Ionicons name="qr-code-outline" size={20} color="#1E293B" style={{marginRight: 8}}/>
            <Text style={styles.sectionTitle}>QR Code ของฉัน</Text>
          </View>
          
          <View style={styles.qrCard}>
            <View style={styles.qrTicketTop}>
              <Text style={styles.qrDescText}>
                {role === 'external' ? 'สแกนเพื่อเข้าใช้บริการฟิตเนส' : 'สแกนเพื่อยืม-คืนอุปกรณ์ และฟิตเนส'}
              </Text>
            </View>
            <View style={styles.qrCodeBox}>
              {userId !== '-' ? (
                <QRCode value={userId} size={150} color="#1E293B" backgroundColor="transparent" />
              ) : (
                <Ionicons name="qr-code" size={150} color="#CBD5E1" />
              )}
            </View>
            <Text style={styles.qrId}>{userId}</Text>
          </View>
        </View>

        {role !== 'external' && (
          <View style={styles.sectionContainer}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <Ionicons name="basketball-outline" size={20} color="#1E293B" style={{marginRight: 8}}/>
              <Text style={styles.sectionTitle}>รายการอุปกรณ์</Text>
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
              <ActivityIndicator size="large" color="#00A87E" style={{ marginTop: 30 }} />
            ) : (
              <View style={styles.gridContainer}>
                {filteredEquipment.length > 0 ? (
                  filteredEquipment.map((item) => (
                    <View key={item.id} style={styles.gridCard}>
                      <View style={styles.gridImageBox}>
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="cover" />
                        ) : (
                          <Ionicons name="image-outline" size={35} color="#CBD5E1" />
                        )}
                      </View>
                      <Text style={styles.gridItemName} numberOfLines={1}>{item.item_name}</Text>
                      <Text style={styles.gridItemCategory} numberOfLines={1}>{item.category_name || 'ทั่วไป'}</Text>
                      
                      <View style={styles.stockBadgeGrid}>
                        <View style={styles.stockDot}/>
                        <Text style={styles.stockBadgeGridText}>ว่าง {item.stock} ชิ้น</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{width: '100%', padding: 30, alignItems: 'center'}}>
                    <Ionicons name="folder-open-outline" size={40} color="#CBD5E1"/>
                    <Text style={{ color: '#94A3B8', marginTop: 10 }}>ไม่มีอุปกรณ์ในหมวดหมู่นี้</Text>
                  </View>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 15, zIndex: 20, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 3 },
  topNavTitle: { fontSize: 18, fontWeight: 'bold', color: '#00A87E' },
  bellIcon: { position: 'relative' },
  redDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 1.5, borderColor: '#FFF' },

  menuDropdown: { position: 'absolute', top: 60, right: 20, backgroundColor: '#FFF', borderRadius: 12, padding: 10, width: 200, zIndex: 15, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 8 },
  menuLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuLinkText: { fontSize: 15, color: '#1E293B', fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 40, alignSelf: 'center', width: '100%', maxWidth: 600 },
  
  // 🌟 Banner ทักทาย
  bannerSection: { backgroundColor: '#00A87E', borderRadius: 20, padding: 24, marginBottom: 25, elevation: 4, shadowColor: '#00A87E', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  bannerGreeting: { fontSize: 14, color: '#D1FAE5', marginBottom: 2 },
  bannerName: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  roleBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleBadgeText: { fontSize: 12, fontWeight: 'bold' },
  bannerInfoBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, marginTop: 15 },
  bannerInfoText: { color: '#FFF', fontSize: 13, marginBottom: 4 },

  sectionContainer: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  
  // 🌟 บัตร QR Code คล้ายตั๋ว
  qrCard: { backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  qrTicketTop: { backgroundColor: '#F8FAFC', width: '100%', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  qrDescText: { textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: '500' },
  qrCodeBox: { padding: 30, backgroundColor: '#FFF', borderRadius: 16 },
  qrId: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', letterSpacing: 2, marginBottom: 25 },
  
  categoryScroll: { marginBottom: 15 },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#FFF', marginRight: 10, elevation: 1, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  categoryPillActive: { backgroundColor: '#00A87E', borderColor: '#00A87E' },
  categoryPillText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  categoryPillTextActive: { color: '#FFF' },

  // 🌟 การ์ดอุปกรณ์
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 12, alignItems: 'center', marginBottom: 15, elevation: 1.5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4 },
  gridImageBox: { width: '100%', height: 100, backgroundColor: '#F8FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridImage: { width: '100%', height: '100%', borderRadius: 12 },
  gridItemName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  gridItemCategory: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 10 },
  stockBadgeGrid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  stockBadgeGridText: { color: '#15803D', fontSize: 11, fontWeight: 'bold' },

  // 🌟 Modal แจ้งเตือน
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 20, maxHeight: '80%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  notifScroll: { padding: 15 },
  notifCard: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  notifIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  notifDetail: { fontSize: 13, color: '#475569', marginBottom: 6, lineHeight: 20 },
  notifDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  emptyNotif: { padding: 50, alignItems: 'center' },
  emptyNotifText: { marginTop: 15, color: '#94A3B8', fontSize: 15, fontWeight: '600' }
});
