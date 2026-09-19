import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation, route }) {
  const accountId = route.params?.accountId; 
  const API_URL = 'http://localhost:3000'; 

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

  // 🌟 ปรับปรุงเงื่อนไขการคำนวณสถานะล่าช้าแบบข้ามวัน
  const calculateStatus = (borrowDateStr, returnDateStr) => {
    if (returnDateStr) {
      return { status: 'คืนแล้ว', isLate: false };
    }
    
    // ตั้งค่าเวลาของวันที่ยืมให้เป็น 00:00:00 (เอาแค่วันที่)
    const borrowDate = new Date(borrowDateStr);
    borrowDate.setHours(0, 0, 0, 0);
    
    // ตั้งค่าเวลาของวันนี้ให้เป็น 00:00:00
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // คำนวณหาจำนวนวันที่ผ่านไป
    const diffTime = currentDate.getTime() - borrowDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      // ถ้าข้ามวันแล้ว (diffDays มากกว่า 0) จะโชว์ป้ายเตือน
      return { status: `กำลังยืม\n(ล่าช้า ${diffDays} วัน โปรดส่งคืน)`, isLate: true };
    }
    
    // ถ้ายังเป็นวันเดียวกันอยู่
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
      
      {/* ---------------- Header Section ---------------- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* ---------------- Main Content ---------------- */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 📍 เงื่อนไข: ถ้า role ไม่ใช่ external (คือนักศึกษา) ถึงจะแสดงตารางนี้ */}
        {route.params?.role !== 'external' && (
          <>
            <Text style={styles.pageTitle}>ประวัติการยืม/คืนอุปกรณ์</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>อุปกรณ์</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>จำนวน</Text>
                <Text style={styles.headerCell}>ยืมเมื่อ</Text>
                <Text style={styles.headerCell}>คืนเมื่อ</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>สถานะ / ดำเนินการ</Text>
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
                  <View 
                    key={item.id} 
                    style={[styles.tableRow, index === historyData.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.dataCell, { flex: 1.2, fontWeight: 'bold' }]}>{item.equipment}</Text>
                    <Text style={[styles.dataCell, { flex: 0.8 }]}>{item.amount}</Text>
                    <Text style={styles.dataCell}>{item.borrowDate}</Text>
                    <Text style={styles.dataCell}>{item.returnDate}</Text>
                    
                    <View style={[styles.dataCell, styles.statusCellContainer, { flex: 1.5 }]}>
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
          </>
        )}

        {/* ================= 2. ตารางประวัติเข้าฟิตเนส (แสดงสำหรับทุกคน) ================= */}
        <Text style={[styles.pageTitle, route.params?.role !== 'external' ? { marginTop: 30 } : { marginTop: 0 }]}>
          ประวัติเข้าฟิตเนส
        </Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>วันที่เข้าใช้</Text>
            <Text style={styles.headerCell}>ค่าบริการ</Text>
            <Text style={styles.headerCell}>วิธีชำระ</Text>
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
              <View 
                key={item.id} 
                style={[styles.tableRow, index === fitnessData.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Text style={[styles.dataCell, { fontWeight: 'bold' }]}>{item.checkInDate}</Text>
                <Text style={styles.dataCell}>{item.serviceFee}</Text>
                <Text style={styles.dataCell}>{item.paymentType}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F6' },
  header: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  backButton: {
    padding: 2,
  },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 12 },
  tableContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E6EA',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EA',
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EA',
    paddingVertical: 15,
    alignItems: 'center',
  },
  dataCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
  },
  statusCellContainer: { alignItems: 'center', justifyContent: 'center' },
  // 🌟 ปรับขนาดป้ายแจ้งเตือนสีแดงให้รองรับข้อความ 2 บรรทัดได้สวยขึ้น
  lateBadge: {
    backgroundColor: '#FFF0F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  lateText: { 
    fontSize: 11, 
    color: '#FF4D4F', 
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16
  },
  pendingBadge: {
    backgroundColor: '#FFF7E6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pendingText: { fontSize: 11, color: '#FA8C16', fontWeight: 'bold' },
  returnedText: { fontSize: 12, color: '#00A87E', fontWeight: 'bold' },
});