import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  Modal, Image, ActivityIndicator, Alert, Platform, TextInput 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  
  const cameraRef = useRef(null);
  
  const [scanMode, setScanMode] = useState(null); 
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [manualCode, setManualCode] = useState('');

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!permission) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#00A87E" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ marginBottom: 20 }}>แอปต้องการสิทธิ์ในการใช้งานกล้อง</Text>
        <TouchableOpacity style={styles.btnOK} onPress={requestPermission}>
          <Text style={styles.btnOKText}>อนุญาตการเข้าถึง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showErrorPopup = (msg) => {
    setErrorMessage(msg);
    setErrorModalVisible(true);
    setLoading(false);
  };

  const processScannedCode = async (code) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    setLoadingText('กำลังตรวจสอบข้อมูลในระบบ...');

    try {
      const response = await fetch(`https://envision-stumble-kept.ngrok-free.dev/api/users/scan/${code}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const result = await response.json();

      if (response.ok) {
        if (scanMode === 'student' && result.role !== 'student') {
          showErrorPopup('ข้อมูลไม่ถูกต้อง: บัตรนี้ไม่ใช่สถานะนักศึกษา กรุณาตรวจสอบประเภทผู้เข้าใช้งาน');
          setTimeout(() => setScanned(false), 2000);
          return;
        }
        if (scanMode === 'external' && result.role !== 'external') {
          showErrorPopup('ข้อมูลไม่ถูกต้อง: บัตรนี้ไม่ใช่สถานะบุคคลภายนอก กรุณาตรวจสอบประเภทผู้เข้าใช้งาน');
          setTimeout(() => setScanned(false), 2000);
          return;
        }

        if (result.role === 'student') {
          setScanMode(null);
          navigation.replace('Fitness', { qrData: result.code_id });
          return;
        }

        let userProfileImg = null;
        try {
          const detailRes = await fetch(`https://envision-stumble-kept.ngrok-free.dev/api/admin/users/${result.id}/detail`, {
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            // 🌟 ดึงรูปภาพโปรไฟล์จากระบบมาใช้
            userProfileImg = detailData.profile_image || detailData.id_card_image || detailData.avatar || null;
          }
        } catch (e) {
          console.log('Could not fetch detail image:', e);
        }

        setScannedUser({ 
          ...result, 
          liveImage: userProfileImg // ใช้รูปจากระบบ แทนรูปที่เพิ่งถ่าย
        });
        setScanMode(null); 
        setVerifyModalVisible(true); 
      } else {
        showErrorPopup('ไม่พบข้อมูลสมาชิกในระบบ\nบัตรนี้อาจยังไม่ได้ลงทะเบียนสมัครสมาชิก กรุณาลงทะเบียนก่อนใช้งานครับ');
        setTimeout(() => setScanned(false), 2000);
      }
    } catch (error) {
      showErrorPopup('เกิดข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setTimeout(() => setScanned(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const processCardOCR = async (base64Image) => {
    try {
      const response = await fetch('https://envision-stumble-kept.ngrok-free.dev/api/ocr', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ image: base64Image })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'ไม่สามารถอ่านข้อความจากรูปภาพได้');
      }

      let finalId = result.citizenId;

      if (!finalId && result.text) {
        const idRegex = /(?:\d[ \.\-\_]*){13}/;
        const idMatch = result.text.match(idRegex);
        if (idMatch) {
          finalId = idMatch[0].replace(/[^\d]/g, '');
          if (finalId.length > 13) finalId = finalId.substring(0, 13);
        }
      }

      if (!finalId || finalId.length !== 13) {
        throw new Error('ระบบ AI มองไม่เห็นเลข 13 หลักบนบัตร กรุณาถ่ายในที่สว่างและให้ภาพชัดเจนที่สุดครับ');
      }

      return finalId;
    } catch (error) {
      throw error;
    }
  };

  const handleCaptureCard = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setLoadingText('กำลังอ่านข้อมูลจากบัตรประชาชน...');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      const rawBase64 = photo.base64;
      
      const citizenId = await processCardOCR(photo.base64);

      setLoadingText('กำลังตรวจสอบข้อมูลในระบบ...');
      
      const response = await fetch(`https://envision-stumble-kept.ngrok-free.dev/api/users/scan/${citizenId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const result = await response.json();

      if (response.ok) {
        if (result.role !== 'external') {
          showErrorPopup('ข้อมูลไม่ถูกต้อง: บัตรนี้ถูกบันทึกเป็นสถานะนักศึกษา');
          setLoading(false);
          return;
        }

        // 🌟 ดึงข้อมูลรูปแบบเดิมจากระบบ เพื่อมาแสดงใน Pop-up
        let userProfileImg = null;
        try {
          const detailRes = await fetch(`https://envision-stumble-kept.ngrok-free.dev/api/admin/users/${result.id}/detail`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            userProfileImg = detailData.profile_image || detailData.id_card_image || detailData.avatar || null;
          }
        } catch (e) {
          console.log('Error fetching user image:', e);
        }

        setScannedUser({ ...result, liveImage: userProfileImg }); // ใช้รูปที่ดึงจากระบบ
        setScanMode(null);
        setVerifyModalVisible(true);
      } else {
        showErrorPopup('ไม่พบข้อมูลสมาชิกในระบบ\nบัตรประชาชนนี้ยังไม่ได้ลงทะเบียนสมัครสมาชิกครับ');
      }
    } catch (error) {
      showErrorPopup(error.message || 'เกิดข้อผิดพลาดในการประมวลผลบัตร');
    } finally {
      setLoading(false);
    }
  };

  const confirmUser = () => {
    setVerifyModalVisible(false);
    navigation.replace('Fitness', { qrData: scannedUser.code_id }); 
  };

  const cancelUser = () => {
    setVerifyModalVisible(false);
    setScanned(false);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      showErrorPopup('กรุณากรอกรหัสก่อนกดยืนยัน');
      return;
    }
    setScanMode(null);
    processScannedCode(manualCode.trim());
  };

  return (
    <SafeAreaView style={styles.selectionContainer}>
      <View style={styles.headerLight}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitleLight}>เข้าใช้ฟิตเนส</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentSelection}>
        <Text style={styles.selectionTitle}>กรุณาเลือกประเภทผู้เข้าใช้งาน</Text>
        <Text style={styles.selectionSubtitle}>ระบบจะตั้งค่าการสแกนตามประเภทที่เลือก</Text>

        <TouchableOpacity style={styles.bigButtonStudent} onPress={() => { setScanMode('student'); setIsCameraActive(true); setScanned(false); setManualCode(''); }}>
          <Ionicons name="school" size={60} color="#00A87E" style={{marginBottom: 10}} />
          <Text style={styles.bigButtonTitle}>นักศึกษา</Text>
          <Text style={styles.bigButtonDesc}>สแกน QR Code จากแอปพลิเคชัน</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bigButtonExternal} onPress={() => { setScanMode('external'); setIsCameraActive(true); setScanned(false); setManualCode(''); }}>
          <Ionicons name="id-card" size={60} color="#F5A623" style={{marginBottom: 10}} />
          <Text style={styles.bigButtonTitle}>บุคคลภายนอก</Text>
          <Text style={styles.bigButtonDesc}>สแกน QR Code หรือถ่ายภาพบัตรประชาชน</Text>
        </TouchableOpacity>
      </View>

      {/* Modal กล้องสแกน / ถ่ายบัตร */}
      <Modal animationType="fade" transparent={true} visible={scanMode !== null} onRequestClose={() => { setScanMode(null); setScanned(false); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 0, overflow: 'hidden' }]}>
            
            <View style={[styles.modalHeader, { padding: 20, paddingBottom: 15, marginBottom: 0 }]}>
              <Text style={styles.modalTitle}>
                {scanMode === 'student' ? 'สแกน QR Code นักศึกษา' : 'สแกน QR หรือ ถ่ายภาพบัตร'}
              </Text>
              <TouchableOpacity onPress={() => { setScanMode(null); setScanned(false); }}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerBox}>
              {isCameraActive ? (
                <View style={{ flex: 1, width: '100%', position: 'relative' }}>
                  <CameraView
                    ref={cameraRef}
                    onBarcodeScanned={scanned ? undefined : ({ data }) => processScannedCode(data)}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  
                  <View style={styles.cameraOverlay}>
                    <View style={styles.scanFrame}>
                      <View style={[styles.corner, styles.topLeft]} />
                      <View style={[styles.corner, styles.topRight]} />
                      <View style={[styles.corner, styles.bottomLeft]} />
                      <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.manualInputWrapper}>
                  <TextInput 
                    style={styles.manualInput} 
                    placeholder={scanMode === 'student' ? "ป้อนรหัสนักศึกษา 12 หลัก" : "ป้อนรหัสบัตรประชาชน 13 หลัก"}
                    placeholderTextColor="#999" 
                    value={manualCode} 
                    onChangeText={setManualCode} 
                  />
                </View>
              )}

              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#00A87E" />
                  <Text style={{ color: '#333', marginTop: 10, fontWeight: 'bold' }}>{loadingText}</Text>
                </View>
              )}
            </View>

            <View style={[styles.modalFooter, { padding: 20, paddingTop: 10 }]}>
              <TouchableOpacity style={styles.btnGray} onPress={() => setIsCameraActive(!isCameraActive)}>
                <Text style={styles.btnGrayText}>{isCameraActive ? 'ป้อนรหัสด้วยตนเอง' : 'เปิดกล้อง'}</Text>
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                {scanMode === 'external' && isCameraActive ? (
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#00A87E' }]} onPress={handleCaptureCard}>
                    <Text style={styles.btnTextWhite}>ถ่ายภาพบัตร</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#1E8E3E' }]} onPress={handleManualSubmit}>
                    <Text style={styles.btnTextWhite}>ตกลง</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>
        </View>
      </Modal>

      {/* 🌟 Pop-up แจ้งเตือนข้อผิดพลาด */}
      <Modal transparent={true} visible={errorModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModalBox}>
            <Ionicons name="alert-circle" size={60} color="#D93025" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>ไม่พบข้อมูล / ยังไม่สมัครสมาชิก</Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              {errorMessage}
            </Text>
            <TouchableOpacity 
              style={[styles.btnAction, { backgroundColor: '#D93025', width: '100%', paddingVertical: 12, borderRadius: 8 }]} 
              onPress={() => { setErrorModalVisible(false); setScanned(false); }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>เข้าใจแล้ว</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🌟 Pop-up ตรวจสอบข้อมูล (ใช้เฉพาะบุคคลภายนอกเท่านั้น) */}
      <Modal transparent={true} visible={verifyModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyModalBox}>
            <View style={styles.verifyModalHeader}>
              <Ionicons name="shield-checkmark" size={30} color="#F5A623" />
              <Text style={styles.verifyModalTitle}>ตรวจสอบข้อมูลผู้เข้าใช้</Text>
            </View>

            <View style={styles.idCardImageContainer}>
              {scannedUser?.liveImage ? (
                <Image source={{ uri: scannedUser.liveImage }} style={styles.idCardImage} />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="person-circle-outline" size={80} color="#CBD5E1" />
                </View>
              )}
            </View>

            <View style={styles.userInfoBox}>
              <Text style={styles.userNameLabel}>ชื่อ - นามสกุล:</Text>
              <Text style={styles.userName}>{scannedUser?.name}</Text>

              <Text style={styles.userIdLabel}>รหัสประจำตัวประชาชน:</Text>
              <Text style={styles.userId}>{scannedUser?.code_id}</Text>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#F1F5F9' }]} onPress={cancelUser}>
                <Text style={{ color: '#475569', fontWeight: 'bold' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#F5A623' }]} onPress={confirmUser}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ยืนยันข้อมูลถูกต้อง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  btnOK: { backgroundColor: '#00A87E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnOKText: { color: '#FFF', fontWeight: 'bold' },

  selectionContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  headerLight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitleLight: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  backButton: { padding: 5 },
  
  contentSelection: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  selectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 5 },
  selectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 40 },
  
  bigButtonStudent: { width: '100%', maxWidth: 350, backgroundColor: '#E6F5EF', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#00A87E', marginBottom: 20, elevation: 2 },
  bigButtonExternal: { width: '100%', maxWidth: 350, backgroundColor: '#FEF3C7', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#F5A623', elevation: 2 },
  bigButtonTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 5 },
  bigButtonDesc: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 16, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  
  scannerBox: { width: '100%', height: 260, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 170, height: 170, backgroundColor: 'transparent', position: 'relative' }, 
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#FFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },

  manualInputWrapper: { width: '85%', justifyContent: 'center' },
  manualInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 16, height: 50, backgroundColor: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btnGray: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnGrayText: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnTextWhite: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },

  verifyModalBox: { width: '85%', maxWidth: 380, backgroundColor: '#FFF', borderRadius: 16, padding: 25, alignItems: 'center' },
  verifyModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  verifyModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  // 🌟 ปรับกรอบรูปภาพโปรไฟล์ให้เป็นวงกลม ดูสวยงามขึ้น
  idCardImageContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', overflow: 'hidden', marginBottom: 20, borderWidth: 2, borderColor: '#E2E8F0', alignSelf: 'center' },
  idCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

  userInfoBox: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  userNameLabel: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  userIdLabel: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  userId: { fontSize: 16, fontWeight: '600', color: '#334155' },

  modalActionRow: { flexDirection: 'row', gap: 10, width: '100%' },
});
