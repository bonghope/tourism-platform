const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTourDates } = require('../utils/tourDates');
const { processRatingJobs } = require('../cron/ratingWorker');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
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
  assert.ok(sql.includes('d.EndDate > d.StartDate AND d.EndDate <= UTC_TIMESTAMP()'));
  assert.ok(sql.includes("SET b.Status = 'COMPLETED'"));
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
