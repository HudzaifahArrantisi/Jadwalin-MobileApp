import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';

interface TimePickerProps {
  value: string; // format "HH.mm"
  onChange: (time: string) => void;
  label?: string;
}

const parseTimeToDate = (time: string) => {
  const [rawHour, rawMinute] = time.split('.');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const date = new Date();

  date.setHours(Number.isFinite(hour) ? Math.max(0, Math.min(23, hour)) : 9);
  date.setMinutes(Number.isFinite(minute) ? Math.max(0, Math.min(59, minute)) : 0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

const formatDateToTime = (date: Date) => {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}.${minute}`;
};

const displayTime = (time: string) => time.replace('.', ':');

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const { Colors, isDark } = useAppTheme();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseTimeToDate(value));

  useEffect(() => {
    if (!isPickerOpen) {
      setDraftDate(parseTimeToDate(value));
    }
  }, [isPickerOpen, value]);

  const selectedPreview = useMemo(() => displayTime(value), [value]);

  const openPicker = () => {
    setDraftDate(parseTimeToDate(value));
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
  };

  const handleNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setDraftDate(selectedDate);
    }
  };

  const saveTime = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(formatDateToTime(draftDate));
    setIsPickerOpen(false);
  };

  return (
    <View style={styles.pickerWrapper}>
      {label ? <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text> : null}

      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: Colors.inputBg,
            borderColor: Colors.inputBorder,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <Ionicons name="time-outline" size={sw(18)} color={Colors.textSecondary} />
        <Text style={[styles.fieldText, { color: Colors.textPrimary }]}>{selectedPreview}</Text>
        <Ionicons name="chevron-down" size={sw(16)} color={Colors.textMuted} />
      </Pressable>

      <Modal visible={isPickerOpen} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: Colors.profileFormBg,
                borderColor: Colors.borderLight,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Pressable onPress={closePicker} hitSlop={sw(10)}>
                <Text style={[styles.headerAction, { color: Colors.textSecondary }]}>Batal</Text>
              </Pressable>
              <Text style={[styles.sheetTitle, { color: Colors.textPrimary }]}>{label || 'Pilih Waktu'}</Text>
              <Pressable onPress={saveTime} hitSlop={sw(10)}>
                <Text style={[styles.headerAction, styles.doneAction, { color: Colors.brownDark }]}>Selesai</Text>
              </Pressable>
            </View>

            <View style={[styles.pickerBox, { backgroundColor: Colors.inputBg, borderColor: Colors.inputBorder }]}>
              <DateTimePicker
                value={draftDate}
                mode="time"
                display="spinner"
                is24Hour
                onChange={handleNativeChange}
                style={styles.nativePicker}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>

            <Text style={[styles.previewText, { color: Colors.textSecondary }]}>Waktu dipilih: {displayTime(formatDateToTime(draftDate))}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerWrapper: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  field: {
    minHeight: sw(50),
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fieldText: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? sw(34) : Spacing.xl,
  },
  sheetHeader: {
    minHeight: sw(36),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  headerAction: {
    minWidth: sw(64),
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  doneAction: {
    textAlign: 'right',
  },
  pickerBox: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  nativePicker: {
    width: '100%',
    height: sw(180),
  },
  previewText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
