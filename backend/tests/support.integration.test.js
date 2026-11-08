const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');

test('support: ownership, admin replies, read receipts, status, pagination and idempotency', {skip:process.env.RUN_SUPPORT_INTEGRATION!=='true'},async()=>{
 require('dotenv').config({quiet:true});
 assert.ok(['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST),'Integration test must use a local database');
 const pool=require('../config/database'),jwt=require('jsonwebtoken'),express=require('express');
 const app=express();app.use(express.json());app.use('/api/support',require('../routes/support.routes'));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/support`;
 const token=id=>jwt.sign({userId:id},process.env.JWT_SECRET||'webdulich_secret_key_module1',{expiresIn:'5m'});
 const user=token('U-002'),other=token('U-003'),admin=token('U-001');let conversationId;
 async function request(path='',auth=user,method='GET',body){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
 try {
  const [[booking]]=await pool.query("SELECT BookingID FROM Bookings WHERE UserID='U-002' LIMIT 1");assert.ok(booking);
  assert.equal((await request('',null)).status,401);
  assert.equal((await request('',user,'POST',{subject:'Test',content:'Test',bookingId:'B-011'})).status,403);
  assert.equal((await request('',user,'POST',{subject:' ',content:'Test'})).status,400);
  const created=await request('',user,'POST',{subject:'Kiểm thử hỗ trợ tự động',category:'PAYMENT',content:'Kiểm tra thanh toán <script>alert(1)</script>',bookingId:booking.BookingID,userId:'U-003',senderRole:'ADMIN'});
  assert.equal(created.status,201);conversationId=created.conversationId;
  let result=await request('/'+conversationId);assert.equal(result.data.messages[0].SenderRole,'USER');assert.equal(result.data.Booking.BookingID,booking.BookingID);
  assert.equal((await request('/'+conversationId,other)).status,404);
  assert.equal((await request('/'+conversationId+'/messages',other,'POST',{messageId:crypto.randomUUID(),content:'Unauthorized'})).status,404);
  assert.equal((await request('/'+conversationId+'/status',user,'PATCH',{status:'RESOLVED'})).status,403);
  let list=await request('',admin);assert.equal(Number(list.data.find(c=>c.ConversationID===conversationId).UnreadCount),1);
  await request('/'+conversationId,admin);list=await request('',admin);assert.equal(Number(list.data.find(c=>c.ConversationID===conversationId).UnreadCount),0);
  const messageId=crypto.randomUUID(),body={messageId,content:'TaVivu đã tiếp nhận yêu cầu.'};
  assert.equal((await request('/'+conversationId+'/messages',admin,'POST',body)).status,201);
  assert.equal((await request('/'+conversationId+'/messages',admin,'POST',body)).status,201);
  assert.equal((await request('/'+conversationId+'/messages',admin,'POST',{...body,content:'Different'})).status,409);
  list=await request();assert.equal(Number(list.data.find(c=>c.ConversationID===conversationId).UnreadCount),1);
  result=await request('/'+conversationId);assert.equal(result.data.Status,'IN_PROGRESS');assert.equal(result.data.messages.length,2);
  list=await request();assert.equal(Number(list.data.find(c=>c.ConversationID===conversationId).UnreadCount),0);
  assert.equal((await request('/'+conversationId+'/status',admin,'PATCH',{status:'RESOLVED'})).status,200);
  await request('/'+conversationId+'/messages',user,'POST',{messageId:crypto.randomUUID(),content:'Tôi cần hỗ trợ thêm.'});
  assert.equal((await request('/'+conversationId)).data.Status,'OPEN');
  assert.equal((await request('/'+conversationId+'/messages',user,'POST',{messageId:crypto.randomUUID(),content:'x'.repeat(2001)})).status,400);
  for(let i=0;i<52;i++)await pool.query("INSERT INTO Support_Messages (MessageID,ConversationID,SenderID,SenderRole,Content,CreatedAt) VALUES (?,?,'U-002','USER',?,DATE_SUB(UTC_TIMESTAMP(3),INTERVAL ? SECOND))",[crypto.randomUUID(),conversationId,'Older '+i,100+i]);
  result=await request('/'+conversationId,admin);assert.equal(result.data.messages.length,50);assert.equal(result.data.hasOlder,true);
  const older=await request('/'+conversationId+'?before='+result.data.messages[0].MessageID,admin);assert.equal(older.data.messages.length,5);assert.equal(older.data.hasOlder,false);
 }finally{
  if(conversationId){await pool.query('DELETE FROM Support_Messages WHERE ConversationID=?',[conversationId]);await pool.query('DELETE FROM Support_Conversations WHERE ConversationID=?',[conversationId]);}
  await new Promise(resolve=>server.close(resolve));await pool.end();
 }
});
