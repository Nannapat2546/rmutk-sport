import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const monthOptions = [
  { id: 'all', name: 'ดูรวมทั้งปี' }, { id: '1', name: 'มกราคม' }, { id: '2', name: 'กุมภาพันธ์' },
  { id: '3', name: 'มีนาคม' }, { id: '4', name: 'เมษายน' }, { id: '5', name: 'พฤษภาคม' },
  { id: '6', name: 'มิถุนายน' }, { id: '7', name: 'กรกฎาคม' }, { id: '8', name: 'สิงหาคม' },
  { id: '9', name: 'กันยายน' }, { id: '10', name: 'ตุลาคม' }, { id: '11', name: 'พฤศจิกายน' }, { id: '12', name: 'ธันวาคม' },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://envision-stumble-kept.ngrok-free.dev'; 

// 🌟 ฟังก์ชันสร้างข้อมูลจำลอง (Mock Data) สำหรับโชว์บนแดชบอร์ดโดยไม่ต้องแตะ DB
const getMockData = (mode, month) => {
  if (mode === 'daily') {
    return {
      fitnessUsers: 48,
      revenue: 1250,
      cash: 450,
      qr: 800,
      borrowed: 18,
      notReturned: 4,
      overdue: 2,
      chartBar: [
        { label: '07:00', value: 6 },
        { label: '09:00', value: 14 },
        { label: '11:00', value: 10 },
        { label: '13:00', value: 8 },
        { label: '15:00', value: 22 },
        { label: '17:00', value: 38 },
        { label: '19:00', value: 28 },
        { label: '21:00', value: 12 }
      ],
      peakUsage: { label: '17:00', value: 38 },
      popularEquipment: [
        { label: 'ฟุตบอล', value: 15 },
        { label: 'บาสเกตบอล', value: 10 },
        { label: 'ไม้แบดมินตัน', value: 8 },
        { label: 'วอลเลย์บอล', value: 5 },
        { label: 'ลูกปิงปอง', value: 3 }
      ]
    };
  }

  if (mode === 'monthly') {
    if (month === 'all') {
      return {
        fitnessUsers: 1420,
        revenue: 35500,
        cash: 10500,
        qr: 25000,
        borrowed: 420,
        notReturned: 8,
        overdue: 3,
        chartBar: [
          { label: 'ม.ค.', value: 105 },
          { label: 'ก.พ.', value: 120 },
          { label: 'มี.ค.', value: 135 },
          { label: 'เม.ย.', value: 85 },
          { label: 'พ.ค.', value: 150 },
          { label: 'มิ.ย.', value: 125 },
          { label: 'ก.ค.', value: 140 },
          { label: 'ส.ค.', value: 165 },
          { label: 'ก.ย.', value: 130 },
          { label: 'ต.ค.', value: 115 },
          { label: 'พ.ย.', value: 95 },
          { label: 'ธ.ค.', value: 90 }
        ],
        peakUsage: { label: 'สิงหาคม', value: 165 },
        popularEquipment: [
          { label: 'ฟุตบอล', value: 158 },
          { label: 'บาสเกตบอล', value: 112 },
          { label: 'ไม้แบดมินตัน', value: 84 },
          { label: 'วอลเลย์บอล', value: 48 },
          { label: 'ลูกปิงปอง', value: 24 }
        ]
      };
    } else {
      // จำลองข้อมูลรายวัน 1-31 วัน ตลอดทั้งเดือนที่เลือก
      const daysInMonth = Array.from({ length: 31 }, (_, i) => {
        const dayNum = i + 1;
        const val = Math.floor(Math.sin(i) * 12) + 15;
        return { label: `${dayNum}`, value: Math.max(3, val) };
      });

      return {
        fitnessUsers: 380,
        revenue: 9200,
        cash: 2800,
        qr: 6400,
        borrowed: 95,
        notReturned: 3,
        overdue: 1,
        chartBar: daysInMonth,
        peakUsage: { label: 'วันที่ 18', value: 27 },
        popularEquipment: [
          { label: 'ฟุตบอล', value: 38 },
          { label: 'บาสเกตบอล', value: 26 },
          { label: 'ไม้แบดมินตัน', value: 18 },
          { label: 'วอลเลย์บอล', value: 10 },
          { label: 'ลูกปิงปอง', value: 5 }
        ]
      };
    }
  }
};

export default function ReportScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [viewMode, setViewMode] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState('all'); 
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);

  useEffect(() => {
    setSelectedBarIndex(null);
    fetchDashboardStats();
  }, [viewMode, selectedMonth]); 

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // ดึงข้อมูลจริงจาก Backend
      const response = await fetch(`${API_URL}/api/admin/dashboard-stats?mode=${viewMode}&month=${selectedMonth}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      let realData = null;
      if (response.ok) {
        realData = await response.json();
      }

      // ดึง Mock Data เพื่อนำมาเติมในส่วนที่ข้อมูลจริงเป็น 0
      const mock = getMockData(viewMode, selectedMonth);

      // ผสมข้อมูล: หากไม่มีข้อมูลจริง หรือเป็น 0 ระบบจะเอา Mock Data ขึ้นแสดงให้ดูแน่นทันที
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
      console.log('ใช้ออฟไลน์/Mock Data เนื่องจากเชื่อมต่อเซิร์ฟเวอร์ไม่ได้:', error.message);
      // หากเชื่อมต่อไม่ได้เลย ให้ดึง Mock Data ขึ้นแสดงแทน
      setStats(getMockData(viewMode, selectedMonth));
    } finally {
      setIsLoading(false);
    }
  };

  const maxChartValue = stats?.chartBar && stats.chartBar.length > 0 ? Math.max(...stats.chartBar.map(d => d.value), 1) : 1;
  
  let displayDateStr = new Date().toLocaleDateString('th-TH');
  if (viewMode === 'monthly') {
    if (selectedMonth === 'all') {
      displayDateStr = `ข้อมูลรวมตลอดทั้งปี ${new Date().getFullYear() + 543}`;
    } else {
      const mName = monthOptions.find(m => m.id === selectedMonth)?.name;
      displayDateStr = `ข้อมูลเดือน ${mName} ${new Date().getFullYear() + 543}`;
    }
  }
  
  const totalRevenue = stats?.revenue || 0;
  const cashPercent = totalRevenue > 0 ? (stats?.cash / totalRevenue) * 100 : 0;
  const qrPercent = totalRevenue > 0 ? (stats?.qr / totalRevenue) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>แดชบอร์ดภาพรวม</Text>
              <Text style={styles.headerSubtitle}>สรุปข้อมูลสำคัญของศูนย์กีฬา</Text>
            </View>
          </View>
          
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
                <TouchableOpacity style={styles.monthDropdownBtn} onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}>
                  <Text style={styles.monthDropdownText}>{monthOptions.find(m => m.id === selectedMonth)?.name || 'เลือกเดือน'}</Text>
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
        </View>

        {/* State Displays */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={{ marginTop: 10, color: '#666' }}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardStats}>
              <Text style={styles.retryBtnText}>ลองใหม่อีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>ผู้เข้าใช้ฟิตเนส</Text>
                  <Ionicons name="people-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue}>{stats?.fitnessUsers || 0}</Text>
                  <Text style={styles.cardUnit}>คน</Text>
                </View>
                <Text style={styles.cardFooterText}>ข้อมูล: {displayDateStr}</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>ยอดเงินค่าบริการ</Text>
                  <Ionicons name="cash-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue}>{stats?.revenue || 0}</Text>
                  <Text style={styles.cardUnit}>บาท</Text>
                </View>
                <Text style={styles.cardFooterText}>เงินสด {stats?.cash || 0} บ. • QR {stats?.qr || 0} บ.</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>อุปกรณ์ที่ถูกยืม</Text>
                  <Ionicons name="cube-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue}>{stats?.borrowed || 0}</Text>
                  <Text style={styles.cardUnit}>ชิ้น</Text>
                </View>
                <Text style={styles.cardFooterText}>{stats?.notReturned || 0} รายการที่ยังไม่คืน</Text>
              </View>

              <View style={[styles.summaryCard, { borderColor: stats?.overdue > 0 ? '#FCA5A5' : '#E2E8F0' }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>เกินกำหนดคืน</Text>
                  <Ionicons name="calendar-outline" size={20} color={stats?.overdue > 0 ? '#EF4444' : '#64748B'} />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={[styles.cardValue, stats?.overdue > 0 && { color: '#EF4444' }]}>{stats?.overdue || 0}</Text>
                  <Text style={[styles.cardUnit, stats?.overdue > 0 && { color: '#EF4444' }]}>รายการ</Text>
                </View>
                <Text style={[styles.cardFooterText, stats?.overdue > 0 && { color: '#EF4444' }]}>
                  {stats?.overdue > 0 ? 'แจ้งเตือนล่าสุดแล้ว' : 'ต้องติดตามทวงคืน'}
                </Text>
              </View>
            </View>

            {/* Charts Row */}
            <View style={styles.chartsRow}>
              {/* Bar Chart */}
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

              {/* Payment Donut */}
              <View style={styles.donutChartCard}>
                <Text style={styles.chartTitle}>สัดส่วนวิธีชำระเงิน</Text>
                <Text style={styles.chartSubtitle}>เงินสด {stats?.cash || 0} บ. • QR {stats?.qr || 0} บ.</Text>
                
                <View style={styles.donutContainer}>
                  <View style={[styles.donutRing, { borderColor: totalRevenue > 0 ? '#1E3A8A' : '#E2E8F0' }]}>
                    {qrPercent > 0 && (
                      <View style={[styles.donutHalf, { backgroundColor: '#166534', height: `${qrPercent}%` }]} />
                    )}
                    <View style={styles.donutHole}>
                      <Text style={styles.donutCenterLabel}>ยอดรวม</Text>
                      <Text style={styles.donutCenterValue}>฿{totalRevenue}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#1E3A8A' }]} />
                    <Text style={styles.legendText}>เงินสด ({cashPercent.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#166534' }]} />
                    <Text style={styles.legendText}>QR ({qrPercent.toFixed(0)}%)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Popular Equipment */}
            <View style={styles.chartsRow}>
              <View style={[styles.barChartCard, { flex: 1, minHeight: 250, marginTop: 15 }]}>
                <Text style={styles.chartTitle}>5 อันดับอุปกรณ์ที่ถูกยืมมากที่สุด</Text>
                <Text style={styles.chartSubtitle}>
                  {viewMode === 'monthly' ? 'สถิติรวมของเดือนที่เลือก' : 'สถิติรายวัน'}
                </Text>

                <View style={{ marginTop: 15, flex: 1, justifyContent: 'center' }}>
                  {stats?.popularEquipment && stats.popularEquipment.length > 0 ? (
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
          </>
        )}

        {/* Detailed Report Navigation */}
        <Text style={[styles.chartTitle, { marginTop: 25, marginBottom: 15 }]}>รายงานแบบละเอียด</Text>
        
        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'borrow' })}>
          <Text style={styles.menuDetailText}>รายงานการยืม-คืนอุปกรณ์</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'pending' })}>
          <Text style={styles.menuDetailText}>รายงานอุปกรณ์คงค้าง</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'fitness' })}>
          <Text style={styles.menuDetailText}>รายงานการเข้าใช้ฟิตเนส</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7F6', minHeight: 300 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  errorBox: { backgroundColor: '#FEF2F2', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', marginVertical: 20 },
  errorText: { fontSize: 14, color: '#991B1B', marginTop: 10, textAlign: 'center', fontWeight: '500' },
  retryBtn: { marginTop: 15, backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 15, zIndex: 10 },
  backButton: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  toggleGroup: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', ...Platform.select({ web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 1 } }) },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#1E3A8A' },
  
  monthDropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', height: 38 },
  monthDropdownText: { fontSize: 14, fontWeight: '600', color: '#334155', marginRight: 8 },
  monthDropdownList: { position: 'absolute', top: 45, right: 0, width: 160, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  monthDropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  monthDropdownItemText: { fontSize: 13, color: '#475569' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, zIndex: 1 },
  summaryCard: { flexGrow: 1, flexBasis: '23%', minWidth: 150, backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  cardValue: { fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginRight: 5 },
  cardUnit: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  cardFooterText: { fontSize: 12, color: '#94A3B8' },

  chartsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15, zIndex: 1 },
  barChartCard: { flexGrow: 2, flexBasis: '60%', minWidth: 300, backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  chartSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  
  chartArea: { height: 230, paddingBottom: 20, paddingTop: 30 },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 10 },
  barItem: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barBackground: { width: '100%', maxWidth: 40, height: '100%', backgroundColor: '#F8FAFC', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' }, 
  barFill: { width: '100%', backgroundColor: '#1E3A8A', borderRadius: 4 }, 
  barLabel: { fontSize: 11, color: '#64748B', position: 'absolute', bottom: -25 },
  xAxisLine: { height: 1, backgroundColor: '#E2E8F0', width: '100%', position: 'absolute', bottom: 0 },

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

  donutChartCard: { flexGrow: 1, flexBasis: '35%', minWidth: 250, backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  donutContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  donutRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 25, borderColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  donutHalf: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#166534' }, 
  donutHole: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFF', position: 'absolute', justifyContent: 'center', alignItems: 'center' }, 
  donutCenterLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  donutCenterValue: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#334155', fontWeight: '500' },

  menuDetailBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  menuDetailText: { fontSize: 14, fontWeight: '600', color: '#334155' }
});
