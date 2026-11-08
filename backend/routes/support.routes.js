const express = require('express');
const crypto = require('node:crypto');
const pool = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(verifyToken);
const categories = ['TOUR','PAYMENT','CANCELLATION','OTHER'];
const statuses = ['OPEN','IN_PROGRESS','RESOLVED'];
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function text(value,max,label) {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw Object.assign(Error(`${label} phải có từ 1 đến ${max} ký tự.`),{status:400});
  return value.trim();
}
function failure(res,error) {
  if(!error.status) console.error('[Support]',error.code||error.message);
  return res.status(error.status||500).json({success:false,message:error.status?error.message:'Không thể xử lý yêu cầu hỗ trợ. Vui lòng thử lại.'});
}
async function getThread(c,req,lock=false) {
  const [rows]=await c.query(`SELECT * FROM Support_Conversations WHERE ConversationID=? ${lock?'FOR UPDATE':''}`,[req.params.id]);
  const thread=rows[0];
  if(!thread||(req.user.role!=='ADMIN'&&thread.UserID!==req.user.userId))throw Object.assign(Error('Không tìm thấy yêu cầu hỗ trợ.'),{status:404});
  return thread;
}
router.get('/unread',async(req,res)=>{
  try {
    const admin=req.user.role==='ADMIN';
    const [[row]]=await pool.query(`SELECT COUNT(*) AS count FROM Support_Messages m JOIN Support_Conversations c ON c.ConversationID=m.ConversationID WHERE m.ReadAt IS NULL AND m.SenderRole=? ${admin?'':'AND c.UserID=?'}`,admin?['USER']:['ADMIN',req.user.userId]);
    res.json({success:true,count:Number(row.count)});
  }catch(e){failure(res,e);}
});
router.get('/',async(req,res)=>{
  try {
    const admin=req.user.role==='ADMIN',params=[admin?'USER':'ADMIN'];
    let where=admin?'1=1':'c.UserID=?';if(!admin)params.push(req.user.userId);
    if(req.query.status){if(!statuses.includes(req.query.status))throw Object.assign(Error('Trạng thái không hợp lệ.'),{status:400});where+=' AND c.Status=?';params.push(req.query.status);}
    const offset=Number(req.query.offset||0);if(!Number.isSafeInteger(offset)||offset<0)throw Object.assign(Error('Trang không hợp lệ.'),{status:400});
    const [rows]=await pool.query(`SELECT c.ConversationID,c.UserID,c.BookingID,c.Subject,c.Category,c.Status,u.FullName AS CustomerName,
      DATE_FORMAT(c.UpdatedAt,'%Y-%m-%dT%H:%i:%s.%fZ') AS UpdatedAt,
      (SELECT Content FROM Support_Messages m WHERE m.ConversationID=c.ConversationID ORDER BY m.CreatedAt DESC,m.MessageID DESC LIMIT 1) AS LastMessage,
      (SELECT COUNT(*) FROM Support_Messages m WHERE m.ConversationID=c.ConversationID AND m.SenderRole=? AND m.ReadAt IS NULL) AS UnreadCount
      FROM Support_Conversations c JOIN Users u ON u.UserID=c.UserID WHERE ${where} ORDER BY c.UpdatedAt DESC,c.ConversationID LIMIT 51 OFFSET ?`,[...params,offset]);
    res.json({success:true,data:rows.slice(0,50),hasMore:rows.length>50});
  }catch(e){failure(res,e);}
});
router.post('/',async(req,res)=>{
  let c;
  try {
    const subject=text(req.body.subject,150,'Tiêu đề'),content=text(req.body.content,2000,'Tin nhắn');
    const category=req.body.category||'OTHER';if(!categories.includes(category))throw Object.assign(Error('Chủ đề không hợp lệ.'),{status:400});
    const bookingId=req.body.bookingId||null;
    if(bookingId!==null&&(typeof bookingId!=='string'||bookingId.length>50))throw Object.assign(Error('Mã đặt tour không hợp lệ.'),{status:400});
    c=await pool.getConnection();await c.beginTransaction();
    if(bookingId){const [b]=await c.query('SELECT BookingID FROM Bookings WHERE BookingID=? AND UserID=?',[bookingId,req.user.userId]);if(!b.length)throw Object.assign(Error('Đơn đặt tour không thuộc tài khoản của bạn.'),{status:403});}
    const id=crypto.randomUUID();
    await c.query("INSERT INTO Support_Conversations (ConversationID,UserID,BookingID,Subject,Category,Status,CreatedAt,UpdatedAt) VALUES (?,?,?,?,?,'OPEN',UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))",[id,req.user.userId,bookingId,subject,category]);
    // A customer request is always the customer side, including a customer account with an admin role.
    await c.query('INSERT INTO Support_Messages (MessageID,ConversationID,SenderID,SenderRole,Content,CreatedAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))',[crypto.randomUUID(),id,req.user.userId,'USER',content]);
    await c.commit();res.status(201).json({success:true,conversationId:id});
  }catch(e){if(c)await c.rollback();failure(res,e);}finally{if(c)c.release();}
});
router.get('/:id',async(req,res)=>{
  let c;
  try{
    c=await pool.getConnection();await c.beginTransaction();const thread=await getThread(c,req,true);
    const before=req.query.before;
    if(before&&!uuid(before))throw Object.assign(Error('Mốc tin nhắn không hợp lệ.'),{status:400});
    let bound='',params=[thread.ConversationID];
    if(before){const [anchor]=await c.query('SELECT CreatedAt,MessageID FROM Support_Messages WHERE MessageID=? AND ConversationID=?',[before,thread.ConversationID]);if(!anchor.length)throw Object.assign(Error('Không tìm thấy tin nhắn.'),{status:404});bound=' AND (m.CreatedAt<? OR (m.CreatedAt=? AND m.MessageID<?))';params.push(anchor[0].CreatedAt,anchor[0].CreatedAt,before);}
    const [messages]=await c.query(`SELECT m.MessageID,m.SenderID,m.SenderRole,m.Content,DATE_FORMAT(m.CreatedAt,'%Y-%m-%dT%H:%i:%s.%fZ') AS CreatedAt,DATE_FORMAT(m.ReadAt,'%Y-%m-%dT%H:%i:%s.%fZ') AS ReadAt,u.FullName AS SenderName FROM Support_Messages m JOIN Users u ON u.UserID=m.SenderID WHERE m.ConversationID=? ${bound} ORDER BY m.CreatedAt DESC,m.MessageID DESC LIMIT 51`,params);
    const visible=messages.slice(0,50).reverse();
    if(visible.length)await c.query('UPDATE Support_Messages SET ReadAt=UTC_TIMESTAMP(3) WHERE ConversationID=? AND MessageID IN (?) AND SenderRole=? AND ReadAt IS NULL',[thread.ConversationID,visible.map(m=>m.MessageID),req.user.role==='ADMIN'?'USER':'ADMIN']);
    const [[owner]]=await c.query('SELECT FullName,Phone,Email FROM Users WHERE UserID=?',[thread.UserID]);
    const [bookings]=thread.BookingID?await c.query('SELECT b.BookingID,b.Status,t.Title,b.ContactName,b.ContactPhone FROM Bookings b JOIN Tours t ON t.TourID=b.TourID WHERE b.BookingID=?',[thread.BookingID]):[[]];
    await c.commit();res.json({success:true,data:{ConversationID:thread.ConversationID,Subject:thread.Subject,Status:thread.Status,Category:thread.Category,CustomerName:owner.FullName,Booking:bookings[0]||null,messages:visible,hasOlder:messages.length>50}});
  }catch(e){if(c)await c.rollback();failure(res,e);}finally{if(c)c.release();}
});
router.post('/:id/messages',async(req,res)=>{
  let c;
  try{
    const content=text(req.body.content,2000,'Tin nhắn'),messageId=req.body.messageId;
    if(!uuid(messageId))throw Object.assign(Error('Mã tin nhắn không hợp lệ.'),{status:400});
    c=await pool.getConnection();await c.beginTransaction();const thread=await getThread(c,req,true);
    const [old]=await c.query('SELECT ConversationID,SenderID,Content FROM Support_Messages WHERE MessageID=?',[messageId]);
    if(old.length){if(old[0].ConversationID!==thread.ConversationID||old[0].SenderID!==req.user.userId||old[0].Content!==content)throw Object.assign(Error('Mã tin nhắn đã được sử dụng.'),{status:409});}
    else{
      const role=req.user.role==='ADMIN'?'ADMIN':'USER';
      await c.query('INSERT INTO Support_Messages (MessageID,ConversationID,SenderID,SenderRole,Content,CreatedAt) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))',[messageId,thread.ConversationID,req.user.userId,role,content]);
      await c.query('UPDATE Support_Conversations SET Status=?,UpdatedAt=UTC_TIMESTAMP(3) WHERE ConversationID=?',[role==='ADMIN'?'IN_PROGRESS':thread.Status==='RESOLVED'?'OPEN':thread.Status,thread.ConversationID]);
    }
    await c.commit();res.status(201).json({success:true,messageId});
  }catch(e){if(c)await c.rollback();failure(res,e);}finally{if(c)c.release();}
});
router.patch('/:id/status',isAdmin,async(req,res)=>{
  let c;try{
    if(!statuses.includes(req.body.status))throw Object.assign(Error('Trạng thái không hợp lệ.'),{status:400});
    c=await pool.getConnection();await c.beginTransaction();await getThread(c,req,true);
    await c.query('UPDATE Support_Conversations SET Status=?,UpdatedAt=UTC_TIMESTAMP(3) WHERE ConversationID=?',[req.body.status,req.params.id]);
    await c.commit();res.json({success:true});
  }catch(e){if(c)await c.rollback();failure(res,e);}finally{if(c)c.release();}
});
module.exports=router;
