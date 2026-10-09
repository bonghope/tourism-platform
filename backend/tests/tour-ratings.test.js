const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ratingColumns, syncRating } = require('../utils/tourRatings');
test('live ratings explicitly scope aggregate to published reviews and tour',()=>{
 const sql=ratingColumns('Tours');
 assert.ok(sql.includes('AVG(Rating)'));assert.ok(sql.includes('COUNT(*)'));
 assert.equal((sql.match(/Status = 'PUBLISHED'/g)||[]).length,2);
 assert.equal((sql.match(/= Tours.TourID/g)||[]).length,2);
 assert.ok(sql.includes('COALESCE'));
});
test('cache recalculation uses actual aggregates, not old counters',async()=>{
 let captured;
 await syncRating({query:async(sql,params)=>{captured={sql,params};}},'TOUR_A');
 assert.deepEqual(captured.params,['TOUR_A','TOUR_A','TOUR_A','TOUR_A']);
 assert.ok(captured.sql.includes('AVG(Rating)'));
 assert.ok(captured.sql.includes('SUM(Rating)'));
 assert.ok(captured.sql.includes('COUNT(*)'));
 assert.equal(captured.sql.includes('ReviewCount + 1'),false);
});
test('hiding review recalculates totals inside transaction before commit',async()=>{
 const calls=[];
 const connection={beginTransaction:async()=>calls.push('begin'),query:async(sql)=>{calls.push(sql);return sql.startsWith('SELECT TourID FROM Reviews')?[[{TourID:'TOUR_A'}]]:[{}];},commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release')};
 const sandbox={module:{exports:{}},require:name=>name.includes('database')?{getConnection:async()=>connection}:require(name),console};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../controllers/admin.controller.js'),'utf8'),sandbox);
 const res={status(n){this.code=n;return this;},json(){return this;}};
 await sandbox.module.exports.hideReview({params:{reviewId:'REVIEW_A'}},res);
 assert.equal(res.code,200);
 const hidden=calls.findIndex(sql=>sql.startsWith('UPDATE Reviews'));
 const sync=calls.findIndex(sql=>sql.startsWith('UPDATE Tours'));
 assert.ok(sync>hidden);assert.ok(calls.indexOf('commit')>sync);
});
