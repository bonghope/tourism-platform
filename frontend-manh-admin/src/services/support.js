import adminApi from './api';
const base=(import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api').replace(/\/+$/,'');
export async function supportRequest(path,options={}) {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try {
  const response=await fetch(base+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('admin_token')||adminApi.token||''),...options.headers}});
  let data;try{data=await response.json();}catch{throw Error('Máy chủ trả về dữ liệu không hợp lệ.');}
  if(!response.ok||!data.success)throw Error(data.message||'Không thể tải yêu cầu hỗ trợ.');
  return data;
 } catch(e) {if(e.name==='AbortError')throw Error('Máy chủ phản hồi quá lâu. Vui lòng thử lại.');throw e;}finally{clearTimeout(timer);}
}
export const ownBookings=async()=>[];
