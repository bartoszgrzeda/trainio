import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SelectOptionBase {
  id: string;
}

interface SearchableSelectModalProps<T extends SelectOptionBase> {
  visible: boolean;
  title: string;
  options: T[];
  isLoading?: boolean;
  disabled?: boolean;
  selectedOptionId?: string | null;
  emptyMessage: string;
  searchValue: string;
  searchPlaceholder: string;
  searchAccessibilityLabel: string;
  getOptionLabel: (option: T, index: number) => string;
  onSearchChange: (value: string) => void;
  onSelectOption: (option: T) => void;
  onRequestClose: () => void;
  getOptionTestID?: (option: T, index: number) => string;
  closeButtonLabel?: string;
  closeButtonTestID?: string;
  searchInputTestID?: string;
  clearSearchButtonTestID?: string;
  listTestID?: string;
  loadingTestID?: string;
  emptyTextTestID?: string;
}

export function SearchableSelectModal<T extends SelectOptionBase>({
  visible,
  title,
  options,
  isLoading = false,
  disabled = false,
  selectedOptionId,
  emptyMessage,
  searchValue,
  searchPlaceholder,
  searchAccessibilityLabel,
  getOptionLabel,
  onSearchChange,
  onSelectOption,
  onRequestClose,
  getOptionTestID,
  closeButtonLabel = 'Close',
  closeButtonTestID,
  searchInputTestID,
  clearSearchButtonTestID,
  listTestID,
  loadingTestID,
  emptyTextTestID,
}: SearchableSelectModalProps<T>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalBackdropDismissArea} onPress={onRequestClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable
              testID={closeButtonTestID}
              accessibilityRole="button"
              onPress={onRequestClose}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed,
              ]}>
              <Text style={styles.modalCloseButtonText}>{closeButtonLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              testID={searchInputTestID}
              accessibilityLabel={searchAccessibilityLabel}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!disabled}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              style={styles.searchInput}
              value={searchValue}
            />
            <Pressable
              testID={clearSearchButtonTestID}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${searchAccessibilityLabel}`}
              disabled={disabled || searchValue.length === 0}
              onPress={() => {
                onSearchChange('');
              }}
              style={({ pressed }) => [
                styles.clearSearchButton,
                (disabled || searchValue.length === 0) && styles.clearSearchButtonDisabled,
                pressed &&
                  !(disabled || searchValue.length === 0) &&
                  styles.clearSearchButtonPressed,
              ]}>
              <Text
                style={[
                  styles.clearSearchButtonText,
                  (disabled || searchValue.length === 0) && styles.clearSearchButtonTextDisabled,
                ]}>
                X
              </Text>
            </Pressable>
          </View>

          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loadingState} testID={loadingTestID}>
                <ActivityIndicator color="#1D4ED8" />
              </View>
            ) : null}

            {!isLoading && options.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText} testID={emptyTextTestID}>
                  {emptyMessage}
                </Text>
              </View>
            ) : null}

            {!isLoading && options.length > 0 ? (
              <ScrollView testID={listTestID} keyboardShouldPersistTaps="handled">
                {options.map((option, index) => {
                  const isSelected = selectedOptionId != null && option.id === selectedOptionId;
                  const optionTestID = getOptionTestID?.(option, index);

                  return (
                    <Pressable
                      key={option.id}
                      testID={optionTestID}
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => {
                        onSelectOption(option);
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        isSelected && styles.rowSelected,
                        pressed && !disabled && styles.rowPressed,
                      ]}>
                      <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                        {getOptionLabel(option, index)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismissArea: {
    flex: 1,
  },
  modalCard: {
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  modalCloseButtonPressed: {
    backgroundColor: '#E0E7FF',
  },
  modalCloseButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  searchRow: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  clearSearchButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  clearSearchButtonPressed: {
    backgroundColor: '#EEF2FF',
  },
  clearSearchButtonDisabled: {
    opacity: 0.4,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  clearSearchButtonTextDisabled: {
    color: '#CBD5E1',
  },
  listContainer: {
    minHeight: 180,
    maxHeight: 360,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  loadingState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
  rowSelected: {
    backgroundColor: '#EFF6FF',
  },
  rowText: {
    fontSize: 15,
    color: '#111827',
  },
  rowTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
});
