const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ratingColumns, syncRating } = require('../utils/tourRatings');
test('tour reads use cached ratings without querying reviews',()=>{
 const sql=ratingColumns('Tours');
 assert.equal(sql, 'Tours.ReviewCount, Tours.AverageRating');
 assert.equal(sql.includes('Reviews'), false);
});
test('cache recalculation uses actual aggregates, not old counters',async()=>{
 const calls=[];
 await syncRating({query:async(sql,params)=>{calls.push({sql,params});return [[{points:9,count:2}]];}},'TOUR_A');
 assert.ok(calls[0].sql.includes("Status = 'PUBLISHED'"));
 assert.deepEqual(calls[1].params,[9,2,4.5,'TOUR_A']);
});
test('hiding review queues rating update in the same transaction',async()=>{
 const calls=[];
 const connection={beginTransaction:async()=>calls.push('begin'),query:async(sql)=>{calls.push(sql);return sql.startsWith('SELECT TourID FROM Reviews')?[[{TourID:'TOUR_A'}]]:[{}];},commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release')};
 const sandbox={module:{exports:{}},require:name=>name.includes('database')?{getConnection:async()=>connection}:require(name),console};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../controllers/admin.controller.js'),'utf8'),sandbox);
 const res={status(n){this.code=n;return this;},json(){return this;}};
 await sandbox.module.exports.hideReview({params:{reviewId:'REVIEW_A'}},res);
 assert.equal(res.code,200);
 const hidden=calls.findIndex(sql=>sql.startsWith('UPDATE Reviews'));
 const sync=calls.findIndex(sql=>sql.startsWith('INSERT INTO Tour_Rating_Jobs'));
 assert.ok(sync>hidden);assert.ok(calls.indexOf('commit')>sync);
});
