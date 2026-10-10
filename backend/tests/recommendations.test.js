const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { ratingColumns } = require('../utils/tourRatings');
async function recommend(destinationTours, favorites, guest = false) {
  const calls=[];
  const pool={query:async(sql,params)=>{
    calls.push({sql,params});
    if(sql.includes('INNER JOIN User_Favorite_Destinations'))return [destinationTours];
    if(sql.includes('INNER JOIN User_Favorite_Tours ft'))return [favorites];
    if(sql.includes('ORDER BY RAND()'))return [[{TourID:'RANDOM'}]];
    if(sql.startsWith('SELECT TourID FROM User_Favorite_Tours'))return [favorites];
    return [[{ImageURL:'/image.jpg'}]];
  }};
  const sandbox={module:{exports:{}},require:name=>name.includes('database')?pool:name.includes('departures')?require('../utils/departures'):{ratingColumns}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../controllers/destinationController.js'),'utf8'),sandbox);
  const res={status(){return this;},json(body){this.body=body;}};
  await sandbox.module.exports.getRecommendations({user:guest?null:{userId:'USER'}},res,error=>{throw error;});
  return {calls,data:res.body.data};
}
test('destination favorites take priority without mixing other tours',async()=>{
  const {calls,data}=await recommend([{TourID:'DEST'}],[{TourID:'SAVED'}]);
  assert.equal(data[0].TourID,'DEST');
  assert.equal(calls.some(c=>c.sql.includes('ORDER BY RAND()')||c.sql.includes('INNER JOIN User_Favorite_Tours ft')),false);
});
test('empty destination results fall back to exact saved tours',async()=>{
  const {calls,data}=await recommend([],[{TourID:'SAVED'}]);
  assert.equal(data[0].TourID,'SAVED');
  assert.equal(data[0].isFavorite,true);
  assert.equal(calls.some(c=>c.sql.includes('ORDER BY RAND()')),false);
});
test('empty favorites and guests fall back to random bookable tours',async()=>{
  for(const guest of [false,true]){
    const {calls,data}=await recommend([],[],guest);
    assert.equal(data[0].TourID,'RANDOM');
    const query=calls.find(c=>c.sql.includes('ORDER BY RAND()'));
    assert.ok(query.sql.includes("Status = 'PUBLISHED' AND EXISTS"));
    if(guest)assert.equal(calls.some(c=>c.sql.includes('User_Favorite')),false);
  }
});
