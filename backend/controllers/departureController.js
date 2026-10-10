const pool = require('../config/database');
const { validateTourDates } = require('../utils/tourDates');
const crypto = require('node:crypto');
const utc = date => date.toISOString().slice(0,19).replace('T',' ');
exports.list = async(req,res) => {
 try { const [rows]=await pool.query("SELECT d.DepartureID,d.TourID,DATE_FORMAT(d.StartDate,'%Y-%m-%dT%H:%i:%sZ') AS StartDate,DATE_FORMAT(d.EndDate,'%Y-%m-%dT%H:%i:%sZ') AS EndDate,d.MaxSlots,d.AvailableSlots,d.Status,EXISTS(SELECT 1 FROM Bookings b WHERE b.DepartureID=d.DepartureID) AS HasBookings FROM TourDepartures d WHERE TourID=? ORDER BY d.StartDate DESC",[req.params.tourId]);return res.json({success:true,data:rows}); }
 catch(error){return res.status(500).json({success:false,message:'Không tải được lịch khởi hành.'});}
};
exports.create = async(req,res) => {
 let connection;
 try {
  const dates=validateTourDates(req.body.startDate,req.body.endDate);const max=Number(req.body.maxSlots);
  if(dates.startDate<=new Date())throw Error('Lịch mới phải khởi hành trong tương lai.');
  if(!Number.isInteger(max)||max<1)throw Error('Sức chứa phải là số nguyên dương.');
  connection=await pool.getConnection();await connection.beginTransaction();
  const [tours]=await connection.query("SELECT TourID FROM Tours WHERE TourID=? AND Status<>'DELETED' FOR UPDATE",[req.params.tourId]);if(!tours.length)throw Error('Không tìm thấy tour.');
  const id=crypto.randomUUID();await connection.query("INSERT INTO TourDepartures (DepartureID,TourID,StartDate,EndDate,MaxSlots,AvailableSlots,Status) VALUES (?,?,?,?,?,?,'OPEN')",[id,req.params.tourId,utc(dates.startDate),utc(dates.endDate),max,max]);
  await connection.commit();return res.status(201).json({success:true,message:'Đã tạo lịch khởi hành.',departureId:id});
 }catch(error){if(connection)await connection.rollback();return res.status(400).json({success:false,message:error.message});}finally{if(connection)connection.release();}
};
exports.update = async(req,res) => {
 let connection;
 try {
  connection=await pool.getConnection();await connection.beginTransaction();
  const [rows]=await connection.query('SELECT *,EXISTS(SELECT 1 FROM Bookings b WHERE b.DepartureID=d.DepartureID) AS HasBookings FROM TourDepartures d WHERE DepartureID=? AND TourID=? FOR UPDATE',[req.params.departureId,req.params.tourId]);if(!rows.length)throw Error('Không tìm thấy lịch.');
  const d=rows[0];const {startDate,endDate,maxSlots,status}=req.body;
  if((startDate!==undefined||endDate!==undefined)&&d.HasBookings)throw Error('Lịch đã có booking: không thể sửa ngày. Hãy tạo lịch mới.');
  if((startDate!==undefined)!==(endDate!==undefined))throw Error('Vui lòng nhập cả ngày khởi hành và kết thúc.');
  const dates=startDate!==undefined?validateTourDates(startDate,endDate):null;
  if(dates&&dates.startDate<=new Date())throw Error('Lịch phải khởi hành trong tương lai.');
  const max=maxSlots===undefined?Number(d.MaxSlots):Number(maxSlots),used=Number(d.MaxSlots)-Number(d.AvailableSlots);
  if(!Number.isInteger(max)||max<1||max<used)throw Error('Sức chứa không hợp lệ hoặc nhỏ hơn số chỗ đã giữ/bán.');
  if(status&&!['OPEN','CLOSED'].includes(status))throw Error('Chỉ được mở hoặc đóng bán lịch.');
  await connection.query('UPDATE TourDepartures SET StartDate=COALESCE(?,StartDate),EndDate=COALESCE(?,EndDate),MaxSlots=?,AvailableSlots=?,Status=COALESCE(?,Status) WHERE DepartureID=?',[dates?utc(dates.startDate):null,dates?utc(dates.endDate):null,max,max-used,status||null,d.DepartureID]);
  await connection.commit();return res.status(200).json({success:true,message:'Đã cập nhật lịch.'});
 }catch(error){if(connection)await connection.rollback();return res.status(400).json({success:false,message:error.message});}finally{if(connection)connection.release();}
};
