import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ListRenderItem } from 'react-native';

// 1. 데이터의 형태(타입)를 먼저 정의해 줍니다.
interface ScheduleItem {
  id: string;
  date: string;
  status: string;
  time: string;
}

// 2. 더미 데이터에도 타입을 적용해 줍니다.
const dummySchedule: ScheduleItem[] = [
  { id: '1', date: '5/25 (월)', status: '근무', time: '09:00 - 18:00' },
  { id: '2', date: '5/26 (화)', status: '근무', time: '09:00 - 18:00' },
  { id: '3', date: '5/27 (수)', status: '휴무', time: '-' },
  { id: '4', date: '5/28 (목)', status: '근무', time: '09:00 - 18:00' },
  { id: '5', date: '5/29 (금)', status: '근무', time: '09:00 - 18:00' },
];

const ScheduleScreen = () => {
  // 3. renderItem에 방금 만든 타입을 지정해 줍니다.
  // 방법: 파라미터 옆에 { item }: { item: ScheduleItem } 라고 적어줍니다.
  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.row}>
      <Text style={styles.cellDate}>{item.date}</Text>
      <Text style={styles.cellStatus}>{item.status}</Text>
      <Text style={styles.cellTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 중앙 정렬된 헤더 타이틀 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>이번 주 스케줄</Text>
      </View>

      {/* 스케줄 목록 표 */}
      <View style={styles.tableContainer}>
        {/* 표의 컬럼 제목들 */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={styles.cellDate}>날짜</Text>
          <Text style={styles.cellStatus}>상태</Text>
          <Text style={styles.cellTime}>근무 시간</Text>
        </View>
        
        <FlatList
          data={dummySchedule}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    </SafeAreaView>
  );
};

// 3. UI 스타일링 (중앙 정렬 및 모던한 디자인 적용)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // 깔끔한 배경색
  },
  header: {
    padding: 20,
    alignItems: 'center', // 헤더 내용 중앙 정렬
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // 텍스트 중앙 정렬
  },
  tableContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3, // 안드로이드 그림자 효과
    shadowColor: '#000', // iOS 그림자 효과
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center', // 행 내부 요소 중앙 정렬
  },
  tableHeader: {
    backgroundColor: '#F1F3F5',
  },
  cellDate: {
    flex: 1,
    textAlign: 'center', // 열 내용 중앙 정렬
    fontSize: 14,
    color: '#555',
  },
  cellStatus: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF', // 포인트 컬러
  },
  cellTime: {
    flex: 1.5,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  }
});

export default ScheduleScreen;