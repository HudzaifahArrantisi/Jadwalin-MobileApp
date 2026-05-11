export const parseTaskDate = (dateField: any): Date | null => {
  if (!dateField) return null;
  if (typeof dateField.toDate === 'function') return dateField.toDate();
  if (typeof dateField.seconds === 'number') return new Date(dateField.seconds * 1000);
  if (dateField instanceof Date) return dateField;
  if (typeof dateField === 'string' || typeof dateField === 'number') return new Date(dateField);
  return null;
};
