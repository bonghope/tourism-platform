const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTourDates } = require('../utils/tourDates');
const { processRatingJobs } = require('../cron/ratingWorker');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
test('admin create stores EndDate and rejects missing or reversed dates', async () => {
  const calls=[];
  const sandbox={module:{exports:{}},require:name=>name.includes('database')?{query:async(sql,params)=>{calls.push({sql,params});return [{}];}}:require(name),console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../controllers/admin.controller.js'),'utf8'),sandbox);
  const response=()=>({status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
  for (const endDate of [undefined,'2026-11-01T07:00']) {
    const res=response();
    await sandbox.module.exports.createTour({body:{price:100,startDate:'2026-11-01T08:00',endDate}},res);
    assert.equal(res.code,400);
  }
  assert.equal(calls.length,0);
  const res=response();
  await sandbox.module.exports.createTour({body:{price:100,startDate:'2026-11-01T08:00',endDate:'2026-11-02T18:00'}},res);
  assert.equal(res.code,201);
  assert.ok(calls[0].sql.includes('EndDate'));
  const columns = calls[0].sql.match(/INSERT INTO Tours \((.*?)\)/)[1].split(',').map(column => column.trim());
  assert.equal(calls[0].params[columns.indexOf('EndDate')].toISOString(),'2026-11-02T11:00:00.000Z');
});
test('tour dates require valid end after start and interpret input in Vietnam time', () => {
  for (const pair of [['2026-11-01', null], ['2026-02-30','2026-03-01'], ['2026-11-02','2026-11-01']]) {
    assert.throws(() => validateTourDates(...pair));
  }
  assert.equal(validateTourDates('2026-11-01T08:00','2026-11-02T18:00').startDate.toISOString(),'2026-11-01T01:00:00.000Z');
});
test('completion worker runs every minute and only completes paid ended tours', async () => {
  let schedule, task, sql;
  const sandbox={module:{exports:{}},require:name=>name==='node-cron'?{schedule:(expression,callback)=>{schedule=expression;task=callback;}}:{getConnection:async()=>({beginTransaction:async()=>{},query:async value=>{sql=value;return [{affectedRows:0}];},commit:async()=>{},rollback:async()=>{},release:()=>{}})},console:{log:()=>{},error:()=>{}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cron/bookingWorker.js'),'utf8'),sandbox);
  assert.equal(schedule,'* * * * *');
  await task();
  assert.ok(sql.includes("b.Status = 'PAID'"));
  assert.ok(sql.includes('t.EndDate > t.StartDate AND t.EndDate <= NOW()'));
  assert.ok(sql.includes("SET b.Status = 'COMPLETED'"));
});
test('editing start without end validates against existing end and rolls back invalid changes', async () => {
  const calls=[];
  const connection={beginTransaction:async()=>{},query:async(sql,params)=>{calls.push({sql,params});return [[{StartDate:new Date('2026-11-01T01:00Z'),EndDate:new Date('2026-11-02T11:00Z'),Status:'DRAFT',MaxSlots:10,AvailableSlots:10}]];},commit:async()=>calls.push({sql:'commit'}),rollback:async()=>calls.push({sql:'rollback'}),release:()=>{}};
  const sandbox={module:{exports:{}},require:name=>name.includes('database')?{getConnection:async()=>connection}:require(name),console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../controllers/admin.controller.js'),'utf8'),sandbox);
  const res={status(code){this.code=code;return this;},json(){return this;}};
  await sandbox.module.exports.updateTour({params:{tourId:'TOUR'},body:{startDate:'2026-11-03T08:00'}},res);
  assert.equal(res.code,400);
  assert.equal(calls.some(c=>c.sql.startsWith('UPDATE')),false);
  assert.ok(calls.some(c=>c.sql==='rollback'));
});
test('rating worker commits cache and removes job, failed updates roll back for retry', async () => {
  for (const fail of [false, true]) {
    const calls=[];
    const connection={beginTransaction:async()=>calls.push('begin'),commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release'),query:async(sql)=>{
      calls.push(sql);
      if(sql.startsWith('UPDATE Tours')&&fail)throw Error('database failure');
      if(sql.startsWith('SELECT COALESCE'))return [[{points:0,count:0}]];
      return [[{TourID:'TOUR'}]];
    }};
    await processRatingJobs({query:async()=>[[{TourID:'TOUR'}]],getConnection:async()=>connection},{error:()=>{}});
    assert.equal(calls.includes('commit'),!fail);
    assert.equal(calls.includes('rollback'),fail);
    assert.equal(calls.some(s=>s.startsWith('DELETE FROM')),!fail);
    assert.equal(calls.at(-1),'release');
  }
});
