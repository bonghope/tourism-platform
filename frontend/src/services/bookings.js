import api from './api';
import { useAuthStore } from '../stores/auth';
import { formatVietnamDate } from './dates';
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
export const userId = () => { const id = useAuthStore().user?.userId; if (!id) throw new Error('Vui lòng đăng nhập để đặt và xem tour.'); return id; };
export const demoPayment = import.meta.env.VITE_ENABLE_DEMO_PAYMENT === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_PAYMENT !== 'false');
export async function request(path, options = {}) {
  let response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try { response = await fetch(`${base}${path}`, { ...options, signal: controller.signal, headers: { ...api.getAuthHeaders(), ...options.headers } }); }
  catch (error) { throw new Error(error.name === 'AbortError' ? 'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra backend và thử lại.' : 'Không thể kết nối máy chủ. Vui lòng thử lại.'); }
  finally { clearTimeout(timeout); }
  let json;
  try { json = await response.json(); } catch { throw new Error('Máy chủ trả về dữ liệu không hợp lệ.'); }
  if (!response.ok || !json.success) throw new Error(json.message || 'Không thể thực hiện yêu cầu.');
  return json;
}
export const getBooking = async id => (await request(`/bookings/${encodeURIComponent(id)}`)).data;
export const getBookings = async () => (await request(`/bookings/user/${encodeURIComponent(userId())}`)).data;
export const cancelBooking = id => request(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);
export const date = formatVietnamDate;
export const statusLabel = value => ({ PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy', REFUNDING: 'Chờ hoàn tiền', REFUNDED: 'Đã hoàn tiền', COMPLETED: 'Đã hoàn thành' }[value] || value);
