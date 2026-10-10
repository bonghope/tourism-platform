// Admin submits local Vietnam date/time; mysql2 stores local DATETIME values.
function validateTourDates(start, end) {
  function parse(value) {
    if (!value) throw new Error('Vui lòng nhập ngày giờ khởi hành và kết thúc.');
    if (!(value instanceof Date)) {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) throw new Error('Ngày giờ tour không hợp lệ.');
      const day = value.slice(0, 10);
      const calendar = new Date(`${day}T00:00:00Z`);
      if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) throw new Error('Ngày giờ tour không hợp lệ.');
    }
    const normalized = typeof value === 'string' && !/(Z|[+-]\d{2}:\d{2})$/.test(value)
      ? `${value.length === 10 ? value + 'T00:00:00' : value.replace(' ', 'T')}+07:00` : value;
    const date = new Date(normalized);
    if (!Number.isFinite(date.getTime())) throw new Error('Ngày giờ tour không hợp lệ.');
    return date;
  }
  const startDate = parse(start), endDate = parse(end);
  if (endDate <= startDate) throw new Error('Ngày giờ kết thúc phải sau ngày giờ khởi hành.');
  return { startDate, endDate };
}
module.exports = { validateTourDates };
