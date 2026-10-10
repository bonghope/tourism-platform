const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { decodeImages, saveImages, removeImages } = require('../utils/reviewImages');
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=';
test('review images validate type, signature, count and size',()=>{
 assert.equal(decodeImages([png])[0].extension,'png');
 assert.throws(()=>decodeImages(Array(6).fill(png)));
 assert.throws(()=>decodeImages(['data:image/png;base64,aGVsbG8=']));
 assert.throws(()=>decodeImages(['data:image/svg+xml;base64,PHN2Zz4=']));
 assert.throws(()=>decodeImages(['data:image/jpeg;base64,'+'A'.repeat(700001)]));
});
test('review images persist as files with short URLs and clean up',async()=>{
 const saved=[];
 try { const urls=await saveImages(decodeImages([png]),saved);assert.match(urls[0],/^\/uploads\/reviews\/[a-f0-9-]+\.png$/);assert.equal((await fs.readFile(saved[0])).length,decodeImages([png])[0].data.length); }
 finally { await removeImages(saved); }
 if(saved.length)await assert.rejects(fs.access(saved[0]));
});
