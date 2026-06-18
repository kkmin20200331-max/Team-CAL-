import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';

const EmployeeManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees } = useSchedule();

  const sections = useMemo(() => {
    const pending = employees.filter(emp => emp.status === 'PENDING');
    const active = employees.filter(emp => emp.status === 'ACTIVE');
    const sectionsData = [];

    if (pending.length > 0) {
      sectionsData.push({ title: '승인 대기', data: pending });
    }
    if (active.length > 0) {
      sectionsData.push({ title: '활동 중인 직원', data: active });
    }
    return sectionsData;
  }, [employees]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EmployeeDetail', { employee: item })}>
      <View style={styles.itemInfo}>
        <View style={[styles.colorDot, { backgroundColor: item.color || '#A1A1AA' }]} />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemRole}>{item.role}</Text>
      </View>
      <Text style={styles.arrow}>〉</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 관리</Text>
        <View style={{ width: 40 }} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.subText,
    paddingVertical: 12,
    paddingTop: 24,
    backgroundColor: colors.background,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemRole: {
    fontSize: 14,
    color: colors.subText,
    marginLeft: 8,
  },
  arrow: {
    fontSize: 20,
    color: colors.subText,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
});

export default EmployeeManagementScreen;