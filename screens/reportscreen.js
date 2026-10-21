import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, Platform, StatusBar, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const monthOptions = [
  { id: 'all', name: 'ดูรวมทั้งปี' }, { id: '1', name: 'มกราคม' }, { id: '2', name: 'กุมภาพันธ์' },
  { id: '3', name: 'มีนาคม' }, { id: '4', name: 'เมษายน' }, { id: '5', name: 'พฤษภาคม' },
  { id: '6', name: 'มิถุนายน' }, { id: '7', name: 'กรกฎาคม' }, { id: '8', name: 'สิงหาคม' },
  { id: '9', name: 'กันยายน' }, { id: '10', name: 'ตุลาคม' }, { id: '11', name: 'พฤศจิกายน' }, { id: '12', name: 'ธันวาคม' },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://envision-stumble-kept.ngrok-free.dev'; 

// 🌟 Mock Data 
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
    } finally {
      setIsLoading(false);
    }
  };

  const maxChartValue = stats?.chartBar && stats.chartBar.length > 0 ? Math.max(...stats.chartBar.map(d => d.value), 1) : 1;
  
  let displayDateStr = new Date().toLocaleDateString('th-TH');
  if (viewMode === 'monthly') {
    if (selectedMonth === 'all') {
      displayDateStr = `ข้อมูลรวมทั้งปี ${new Date().getFullYear() + 543}`;
    } else {
      const mName = monthOptions.find(m => m.id === selectedMonth)?.name;
      displayDateStr = `เดือน ${mName} ${new Date().getFullYear() + 543}`;
    }
  }
  
  const totalRevenue = stats?.revenue || 0;
  const cashPercent = totalRevenue > 0 ? (stats?.cash / totalRevenue) * 100 : 0;
  const qrPercent = totalRevenue > 0 ? (stats?.qr / totalRevenue) * 100 : 0;

  const isDetailedMonthView = viewMode === 'monthly' && selectedMonth !== 'all';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F6" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>แดชบอร์ดภาพรวม</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>สรุปข้อมูลสำคัญของศูนย์กีฬา</Text>
            </View>
          </View>
          
          <View style={styles.filterControlsRow}>
            <View style={styles.toggleGroup}>
              <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'daily' && styles.toggleBtnActive]} 
                onPress={() => setViewMode('daily')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>รายวัน</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]} 
                onPress={() => { setViewMode('monthly'); setSelectedMonth('all'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>รายเดือน</Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'monthly' && (
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.monthDropdownBtn} 
                  onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.monthDropdownText} numberOfLines={1}>
                    {monthOptions.find(m => m.id === selectedMonth)?.name || 'เลือกเดือน'}
                  </Text>
                  <Ionicons name={isMonthDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
                </TouchableOpacity>

                {isMonthDropdownOpen && (
                  <View style={styles.monthDropdownList}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
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
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 14 }}>กำลังโหลดข้อมูล...</Text>
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
            {/* Summary Cards Grid (2x2) */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>ผู้เข้าใช้ฟิตเนส</Text>
                  <Ionicons name="people-outline" size={18} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue} numberOfLines={1}>{stats?.fitnessUsers || 0}</Text>
                  <Text style={styles.cardUnit}>คน</Text>
                </View>
                <Text style={styles.cardFooterText} numberOfLines={1}>{displayDateStr}</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>ยอดเงินค่าบริการ</Text>
                  <Ionicons name="cash-outline" size={18} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue} numberOfLines={1}>{stats?.revenue || 0}</Text>
                  <Text style={styles.cardUnit}>บาท</Text>
                </View>
                <Text style={styles.cardFooterText} numberOfLines={1}>สด {stats?.cash || 0} • QR {stats?.qr || 0}</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>อุปกรณ์ที่ถูกยืม</Text>
                  <Ionicons name="cube-outline" size={18} color="#64748B" />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={styles.cardValue} numberOfLines={1}>{stats?.borrowed || 0}</Text>
                  <Text style={styles.cardUnit}>ชิ้น</Text>
                </View>
                <Text style={styles.cardFooterText} numberOfLines={1}>ค้างคืน {stats?.notReturned || 0} รายการ</Text>
              </View>

              <View style={[styles.summaryCard, { borderColor: stats?.overdue > 0 ? '#FCA5A5' : '#E2E8F0' }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>เกินกำหนดคืน</Text>
                  <Ionicons name="calendar-outline" size={18} color={stats?.overdue > 0 ? '#EF4444' : '#64748B'} />
                </View>
                <View style={styles.cardValueRow}>
                  <Text style={[styles.cardValue, stats?.overdue > 0 && { color: '#EF4444' }]} numberOfLines={1}>{stats?.overdue || 0}</Text>
                  <Text style={[styles.cardUnit, stats?.overdue > 0 && { color: '#EF4444' }]}>รายการ</Text>
                </View>
                <Text style={[styles.cardFooterText, stats?.overdue > 0 && { color: '#EF4444' }]} numberOfLines={1}>
                  {stats?.overdue > 0 ? 'ต้องติดตามทวงคืน' : 'ไม่มีรายการค้าง'}
                </Text>
              </View>
            </View>

            {/* Bar Chart Section */}
            <View style={styles.cardContainer}>
              <View style={styles.chartHeaderBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chartTitle}>จำนวนผู้เข้าใช้ฟิตเนส</Text>
                  <Text style={styles.chartSubtitle}>
                    {viewMode === 'monthly' 
                      ? (selectedMonth === 'all' ? 'นับรวมตลอดทั้งปี (รายเดือน)' : `นับตามวันที่ในเดือน ${monthOptions.find(m=>m.id===selectedMonth)?.name}`) 
                      : 'นับตามรอบ 2 ชั่วโมง'}
                  </Text>
                </View>
                <View style={styles.peakBadgeContainer}>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>พีคที่สุด</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#00A87E' }}>
                    {stats?.peakUsage?.label || '-'} ({stats?.peakUsage?.value || 0} คน)
                  </Text>
                </View>
              </View>

              <View style={styles.chartArea}>
                {isDetailedMonthView ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.horizontalBarScroll}>
                    {stats?.chartBar && stats.chartBar.map((item, index) => {
                      const barHeightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                      return (
                        <TouchableOpacity 
                          key={index} 
                          activeOpacity={0.8}
                          onPress={() => setSelectedBarIndex(selectedBarIndex === index ? null : index)}
                          style={styles.barItemDetailed}
                        >
                          <View style={styles.barColumnContainer}>
                            {selectedBarIndex === index && (
                              <View style={[styles.tooltipBubble, { bottom: `${Math.min(barHeightPercent + 5, 85)}%` }]}>
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
                  </ScrollView>
                ) : (
                  <View style={styles.barsContainer}>
                    {stats?.chartBar && stats.chartBar.map((item, index) => {
                      const barHeightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                      return (
                        <TouchableOpacity 
                          key={index} 
                          activeOpacity={0.8}
                          onPress={() => setSelectedBarIndex(selectedBarIndex === index ? null : index)}
                          style={styles.barItemFlex}
                        >
                          <View style={styles.barColumnContainer}>
                            {selectedBarIndex === index && (
                              <View style={[styles.tooltipBubble, { bottom: `${Math.min(barHeightPercent + 5, 85)}%` }]}>
                                <Text style={styles.tooltipText}>{item.value} คน</Text>
                                <View style={styles.tooltipArrow} />
                              </View>
                            )}
                            <View style={styles.barBackground}>
                              {item.value > 0 && <View style={[styles.barFill, { height: `${barHeightPercent}%` }]} />}
                            </View>
                          </View>
                          <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <View style={styles.xAxisLine} />
              </View>
            </View>

            {/* Payment Proportion Donut Chart */}
            <View style={styles.cardContainer}>
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

            {/* Popular Equipment List */}
            <View style={styles.cardContainer}>
              <Text style={styles.chartTitle}>5 อันดับอุปกรณ์ที่ถูกยืมมากที่สุด</Text>
              <Text style={styles.chartSubtitle}>
                {viewMode === 'monthly' ? 'สถิติรวมของช่วงเวลาที่เลือก' : 'สถิติรายวัน'}
              </Text>

              <View style={{ marginTop: 15 }}>
                {stats?.popularEquipment && stats.popularEquipment.length > 0 ? (
                  stats.popularEquipment.map((item, index) => {
                    const maxEqVal = Math.max(...stats.popularEquipment.map(d => d.value), 1);
                    const pct = (item.value / maxEqVal) * 100;
                    return (
                      <View key={index} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>{index + 1}. {item.label}</Text>
                          <Text style={{ fontSize: 13, color: '#00A87E', fontWeight: 'bold' }}>{item.value} ชิ้น</Text>
                        </View>
                        <View style={{ width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#00A87E', borderRadius: 4 }} />
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ textAlign: 'center', color: '#94A3B8', marginVertical: 15 }}>ไม่มีข้อมูลการยืมในช่วงเวลานี้</Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* Detailed Report Navigation */}
        <Text style={[styles.chartTitle, { marginTop: 15, marginBottom: 12 }]}>รายงานแบบละเอียด</Text>
        
        <TouchableOpacity 
          style={styles.menuDetailBtn} 
          onPress={() => navigation.navigate('ReportDetail', { reportType: 'borrow' })}
          activeOpacity={0.7}
        >
          <Text style={styles.menuDetailText}>รายงานการยืม-คืนอุปกรณ์</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuDetailBtn} 
          onPress={() => navigation.navigate('ReportDetail', { reportType: 'pending' })}
          activeOpacity={0.7}
        >
          <Text style={styles.menuDetailText}>รายงานอุปกรณ์คงค้าง</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuDetailBtn} 
          onPress={() => navigation.navigate('ReportDetail', { reportType: 'fitness' })}
          activeOpacity={0.7}
        >
          <Text style={styles.menuDetailText}>รายงานการเข้าใช้ฟิตเนส</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: 250 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 30 
  },
  
  errorBox: { 
    backgroundColor: '#FEF2F2', 
    padding: 20, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#FCA5A5', 
    alignItems: 'center', 
    marginVertical: 15 
  },
  errorText: { 
    fontSize: 13, 
    color: '#991B1B', 
    marginTop: 8, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  retryBtn: { 
    marginTop: 12, 
    backgroundColor: '#EF4444', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 6 
  },
  retryBtnText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 13 
  },

  /* Header Styles */
  headerContainer: { 
    marginBottom: 16, 
    zIndex: 50 
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  backButton: { 
    marginRight: 10, 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#0F172A' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 1 
  },

  filterControlsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 50
  },
  toggleGroup: { 
    flexDirection: 'row', 
    backgroundColor: '#E2E8F0', 
    borderRadius: 8, 
    padding: 3 
  },
  toggleBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 14, 
    borderRadius: 6 
  },
  toggleBtnActive: { 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#64748B' 
  },
  toggleTextActive: { 
    color: '#1E3A8A' 
  },
  
  dropdownWrapper: { 
    position: 'relative', 
    zIndex: 100 
  },
  monthDropdownBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    height: 34 
  },
  monthDropdownText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#334155', 
    marginRight: 6 
  },
  monthDropdownList: { 
    position: 'absolute', 
    top: 38, 
    right: 0, 
    width: 140, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 200
  },
  monthDropdownItem: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  monthDropdownItemText: { 
    fontSize: 12, 
    color: '#475569' 
  },

  /* Grid Layout (2x2 Cards) */
  summaryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  summaryCard: { 
    width: '48.5%', 
    backgroundColor: '#FFF', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#475569',
    flex: 1,
    marginRight: 4
  },
  cardValueRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    marginBottom: 6 
  },
  cardValue: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#0F172A', 
    marginRight: 4 
  },
  cardUnit: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#64748B' 
  },
  cardFooterText: { 
    fontSize: 11, 
    color: '#94A3B8' 
  },

  /* Card Container */
  cardContainer: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#0F172A' 
  },
  chartSubtitle: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 2 
  },

  /* Bar Chart Styles */
  chartHeaderBlock: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    gap: 8
  },
  peakBadgeContainer: { 
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  chartArea: { 
    height: 180, 
    marginTop: 10,
    position: 'relative'
  },
  barsContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    paddingBottom: 22 
  },
  horizontalBarScroll: { 
    alignItems: 'flex-end', 
    paddingBottom: 22,
    paddingRight: 10
  },
  barItemFlex: { 
    flex: 1, 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'flex-end' 
  },
  barItemDetailed: { 
    width: 24, 
    marginRight: 8, 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'flex-end' 
  },
  barColumnContainer: { 
    flex: 1, 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    position: 'relative' 
  },
  barBackground: { 
    width: '80%', 
    maxWidth: 24, 
    height: '100%', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 4, 
    justifyContent: 'flex-end', 
    overflow: 'hidden' 
  }, 
  barFill: { 
    width: '100%', 
    backgroundColor: '#1E3A8A', 
    borderRadius: 4 
  }, 
  barLabel: { 
    fontSize: 10, 
    color: '#64748B', 
    position: 'absolute', 
    bottom: 0,
    textAlign: 'center'
  },
  xAxisLine: { 
    height: 1, 
    backgroundColor: '#E2E8F0', 
    width: '100%', 
    position: 'absolute', 
    bottom: 18 
  },

  tooltipBubble: { 
    position: 'absolute', 
    backgroundColor: '#0F172A', 
    paddingHorizontal: 6, 
    paddingVertical: 4, 
    borderRadius: 4, 
    zIndex: 100,
    alignItems: 'center'
  },
  tooltipText: { 
    color: '#FFF', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A'
  },

  /* Donut Chart Styles */
  donutContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 20 
  },
  donutRing: { 
    width: 130, 
    height: 130, 
    borderRadius: 65, 
    borderWidth: 20, 
    borderColor: '#1E3A8A', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    position: 'relative' 
  },
  donutHalf: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    backgroundColor: '#166534' 
  }, 
  donutHole: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#FFF', 
    position: 'absolute', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }, 
  donutCenterLabel: { 
    fontSize: 11, 
    color: '#64748B' 
  },
  donutCenterValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0F172A' 
  },
  legendRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 16 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  legendDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 6 
  },
  legendText: { 
    fontSize: 12, 
    color: '#334155', 
    fontWeight: '500' 
  },

  /* Navigation Buttons */
  menuDetailBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  menuDetailText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#334155' 
  }
});
