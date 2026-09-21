import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation, route }) {
  const accountId = route.params?.accountId; 
  const API_URL = 'https://rmutk-sport.onrender.com'; 

  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [fitnessData, setFitnessData] = useState([]);

  useEffect(() => {
    if (accountId) {
      fetchAllHistory();
    } else {
      setIsLoading(false);
    }
  }, [accountId]);

  const fetchAllHistory = async () => {
    setIsLoading(true);
    try {
      const resBorrow = await fetch(`${API_URL}/api/history/${accountId}`);
      const dataBorrow = await resBorrow.json();
      
      if (resBorrow.ok) {
        const formattedBorrow = dataBorrow.map(item => ({
          id: item.id,
          equipment: item.equipment,
          amount: item.amount,
          borrowDate: formatDate(item.borrow_date),
          returnDate: item.return_date ? formatDate(item.return_date) : '-',
          // 🌟 เช็กให้แสดงผลคำว่า "ปกติ" แทน "ใช้งาน" (ตามหน้าอื่นๆ)
          equipmentStatus: (item.equipment_status === 'ใช้งาน' || item.equipment_status === 'ปกติ') ? 'ปกติ' : (item.equipment_status || 'ปกติ'),
          ...calculateStatus(item.borrow_date, item.return_date)
        }));
        setHistoryData(formattedBorrow);
      } else {
        setHistoryData([]);
      }

      const resFitness = await fetch(`${API_URL}/api/fitness-history/${accountId}`);
      const dataFitness = await resFitness.json();

      if (resFitness.ok) {
        const formattedFitness = dataFitness.map(item => ({
          id: item.id,
          checkInDate: formatDate(item.check_in_time),
          serviceFee: `${parseFloat(item.service_fee)} บาท`,
          paymentType: item.payment_type === 'cash' ? 'เงินสด' : 'สแกน QR'
        }));
        setFitnessData(formattedFitness);
      } else {
        setFitnessData([]);
      }

    } catch (error) {
      console.error(error);
      Alert.alert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = (d.getFullYear() + 543).toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const calculateStatus = (borrowDateStr, returnDateStr) => {
    if (returnDateStr) {
      return { status: 'คืนแล้ว', isLate: false };
    }
    
    const borrowDate = new Date(borrowDateStr);
    borrowDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const diffTime = currentDate.getTime() - borrowDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return { status: `กำลังยืม\n(ล่าช้า ${diffDays} วัน โปรดส่งคืน)`, isLate: true };
    }
    
    return { status: 'กำลังยืม', isLate: false };
  };

  if (!accountId) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={70} color="#D93025" />
        <Text style={{ marginTop: 15, fontSize: 18, color: '#333', fontWeight: 'bold' }}>ไม่พบข้อมูลผู้ใช้งาน</Text>
        <Text style={{ marginTop: 5, fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 40 }}>
          ระบบไม่ได้รับรหัสสมาชิก กรุณาเข้าสู่ระบบใหม่อีกครั้ง
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 25, paddingVertical: 12, paddingHorizontal: 30, backgroundColor: '#E2E8F0', borderRadius: 8 }}>
          <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>กลับไปหน้าก่อนหน้า</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ประวัติของฉัน</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {route.params?.role !== 'external' && (
          <>
            <Text style={styles.pageTitle}>ประวัติการยืม/คืนอุปกรณ์</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', marginBottom: 10 }}>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 140, paddingLeft: 10, textAlign: 'left' }]}>อุปกรณ์</Text>
                  <Text style={[styles.headerCell, { width: 60 }]}>สภาพ</Text>
                  <Text style={[styles.headerCell, { width: 60 }]}>จำนวน</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>ยืมเมื่อ</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>คืนเมื่อ</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>สถานะ / ดำเนินการ</Text>
                </View>

                {isLoading ? (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#00A87E" />
                    <Text style={{ marginTop: 10, color: '#888' }}>กำลังโหลดข้อมูล...</Text>
                  </View>
                ) : historyData.length === 0 ? (
                  <Text style={{ textAlign: 'center', padding: 30, color: '#888' }}>ไม่มีประวัติการยืมอุปกรณ์</Text>
                ) : (
                  historyData.map((item, index) => (
                    <View key={item.id} style={[styles.tableRow, index === historyData.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.dataCell, { width: 140, fontWeight: 'bold', paddingLeft: 10, textAlign: 'left' }]} numberOfLines={1}>{item.equipment}</Text>
                      
                      {/* 🌟 แสดงคำว่า ปกติ แทน ใช้งาน */}
                      <Text style={[styles.dataCell, { width: 60, fontWeight: 'bold', color: item.equipmentStatus === 'ปกติ' ? '#10B981' : '#EF4444' }]}>
                        {item.equipmentStatus}
                      </Text>
                      
                      <Text style={[styles.dataCell, { width: 60 }]}>{item.amount}</Text>
                      <Text style={[styles.dataCell, { width: 90 }]}>{item.borrowDate}</Text>
                      <Text style={[styles.dataCell, { width: 90 }]}>{item.returnDate}</Text>
                      
                      <View style={[styles.dataCell, styles.statusCellContainer, { width: 120 }]}>
                        {item.isLate ? (
                          <View style={styles.lateBadge}>
                            <Text style={styles.lateText}>{item.status}</Text>
                          </View>
                        ) : item.status === 'กำลังยืม' ? (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>{item.status}</Text>
                          </View>
                        ) : (
                          <Text style={styles.returnedText}>{item.status}</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
            <Text style={styles.swipeHintText}>ปัดซ้าย-ขวาเพื่อดูข้อมูลในตาราง</Text>
          </>
        )}

        <Text style={[styles.pageTitle, route.params?.role !== 'external' ? { marginTop: 30 } : { marginTop: 0 }]}>
          ประวัติเข้าฟิตเนส
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          <View style={[styles.tableContainer, { minWidth: 320 }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 100 }]}>วันที่เข้าใช้</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>ค่าบริการ</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>วิธีชำระ</Text>
            </View>

            {isLoading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#00A87E" />
                <Text style={{ marginTop: 10, color: '#888' }}>กำลังโหลดข้อมูล...</Text>
              </View>
            ) : fitnessData.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 30, color: '#888' }}>ไม่มีประวัติการเข้าใช้ฟิตเนส</Text>
            ) : (
              fitnessData.map((item, index) => (
                <View key={item.id} style={[styles.tableRow, index === fitnessData.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={[styles.dataCell, { width: 100, fontWeight: 'bold' }]}>{item.checkInDate}</Text>
                  <Text style={[styles.dataCell, { width: 100 }]}>{item.serviceFee}</Text>
                  <Text style={[styles.dataCell, { width: 100 }]}>{item.paymentType}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <Text style={styles.swipeHintText}>ปัดซ้าย-ขวาเพื่อดูข้อมูลในตาราง</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  backButton: { padding: 5 },
  content: { padding: 15, paddingBottom: 40 },
  pageTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  
  tableContainer: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E6EA', overflow: 'hidden', minWidth: 550 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E6EA', paddingVertical: 12 },
  headerCell: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#334155' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E6EA', paddingVertical: 15, alignItems: 'center' },
  dataCell: { textAlign: 'center', fontSize: 12, color: '#475569' },
  statusCellContainer: { alignItems: 'center', justifyContent: 'center' },
  
  lateBadge: { backgroundColor: '#FFF0F0', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
  lateText: { fontSize: 11, color: '#EF4444', fontWeight: 'bold', textAlign: 'center', lineHeight: 16 },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  pendingText: { fontSize: 11, color: '#D97706', fontWeight: 'bold' },
  returnedText: { fontSize: 12, color: '#10B981', fontWeight: 'bold' },
  swipeHintText: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 8 }
});
