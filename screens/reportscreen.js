import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const monthOptions = [
  { id: 'all', name: 'ทั้งปี' }, { id: '1', name: 'ม.ค.' }, { id: '2', name: 'ก.พ.' },
  { id: '3', name: 'มี.ค.' }, { id: '4', name: 'เม.ย.' }, { id: '5', name: 'พ.ค.' },
  { id: '6', name: 'มิ.ย.' }, { id: '7', name: 'ก.ค.' }, { id: '8', name: 'ส.ค.' },
  { id: '9', name: 'ก.ย.' }, { id: '10', name: 'ต.ค.' }, { id: '11', name: 'พ.ย.' }, { id: '12', name: 'ธ.ค.' },
];

export default function ReportScreen({ navigation }) {
  const API_URL = 'https://rmutk-sport.onrender.com'; 
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); 
  const [selectedMonth, setSelectedMonth] = useState('all'); 
  
  useEffect(() => { fetchDashboardStats(); }, [viewMode, selectedMonth]); 

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard-stats?mode=${viewMode}&month=${selectedMonth}`);
      if (res.ok) setStats(await res.json());
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const maxChartValue = stats?.chartBar ? Math.max(...stats.chartBar.map(d => d.value), 1) : 1;
  const totalRevenue = stats?.revenue || 0;
  const cashPercent = totalRevenue > 0 ? (stats?.cash / totalRevenue) * 100 : 0;
  const qrPercent = totalRevenue > 0 ? (stats?.qr / totalRevenue) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>สรุปสถิติภาพรวม</Text>
        </View>

        <View style={styles.toggleGroup}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'daily' && styles.toggleBtnActive]} onPress={() => setViewMode('daily')}>
            <Text style={[styles.toggleText, viewMode === 'daily' && styles.toggleTextActive]}>รายวัน</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]} onPress={() => { setViewMode('monthly'); setSelectedMonth('all'); }}>
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>รายเดือน</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'monthly' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
            {monthOptions.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.monthPill, selectedMonth === item.id && styles.monthPillActive]} onPress={() => setSelectedMonth(item.id)}>
                <Text style={[styles.monthPillText, selectedMonth === item.id && styles.monthPillTextActive]}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>คนเข้าฟิตเนส</Text>
            <Text style={styles.cardValue}>{stats?.fitnessUsers || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>รายได้ (บ.)</Text>
            <Text style={[styles.cardValue, {color: '#059669'}]}>{stats?.revenue || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>ยืมอุปกรณ์</Text>
            <Text style={[styles.cardValue, {color: '#D97706'}]}>{stats?.borrowed || 0}</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: stats?.overdue > 0 ? '#FCA5A5' : '#E2E8F0' }]}>
            <Text style={[styles.cardTitle, stats?.overdue > 0 && {color: '#DC2626'}]}>เกินกำหนดคืน</Text>
            <Text style={[styles.cardValue, stats?.overdue > 0 && {color: '#DC2626'}]}>{stats?.overdue || 0}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>สถิติคนเข้าฟิตเนส</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartArea}>
              <View style={styles.barsContainer}>
                {stats?.chartBar && stats.chartBar.map((item, index) => {
                  const barHeightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                  return (
                    <View key={index} style={styles.barItem}>
                      <View style={{ flex: 1, width: 20, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <View style={styles.barBackground}>
                          {item.value > 0 && <View style={[styles.barFill, { height: `${barHeightPercent}%` }]} />}
                        </View>
                      </View>
                      <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.xAxisLine} />
            </View>
          </ScrollView>
        </View>

        <Text style={[styles.chartTitle, { marginTop: 15, marginBottom: 10 }]}>ดูรายงานแบบละเอียด</Text>
        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'borrow' })}>
          <Text style={styles.menuDetailText}>รายงานการยืม-คืนอุปกรณ์</Text><Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'pending' })}>
          <Text style={styles.menuDetailText}>รายงานอุปกรณ์คงค้าง</Text><Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuDetailBtn} onPress={() => navigation.navigate('ReportDetail', { reportType: 'fitness' })}>
          <Text style={styles.menuDetailText}>รายงานการเข้าใช้ฟิตเนส</Text><Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 15, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  
  toggleGroup: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 15, alignSelf: 'flex-start' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', elevation: 1 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#1E3A8A' },
  
  monthPill: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
  monthPillActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  monthPillText: { fontSize: 12, color: '#475569' },
  monthPillTextActive: { color: '#FFF' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  summaryCard: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  cardTitle: { fontSize: 12, color: '#64748B', marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },

  chartCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 10 },
  chartArea: { height: 180, minWidth: 400, paddingBottom: 25, paddingTop: 10 },
  barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 5 },
  barItem: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barBackground: { width: '100%', maxWidth: 20, height: '100%', backgroundColor: '#F8FAFC', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' }, 
  barFill: { width: '100%', backgroundColor: '#1E3A8A', borderRadius: 4 }, 
  barLabel: { fontSize: 10, color: '#64748B', position: 'absolute', bottom: -20 },
  xAxisLine: { height: 1, backgroundColor: '#E2E8F0', width: '100%', position: 'absolute', bottom: 0 },

  menuDetailBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  menuDetailText: { fontSize: 13, fontWeight: 'bold', color: '#334155' }
});
