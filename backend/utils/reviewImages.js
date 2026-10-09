const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const directory = path.join(__dirname, '../uploads/reviews');
function decodeImages(images = []) {
  if (!Array.isArray(images) || images.length > 5) throw new Error('Chỉ được gửi tối đa 5 ảnh.');
  return images.map(value => {
    if (typeof value !== 'string' || value.length > 700000) throw new Error('Ảnh không hợp lệ hoặc quá lớn.');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) throw new Error('Ảnh phải là JPG, PNG hoặc WebP.');
    const data = Buffer.from(match[2], 'base64');
    const valid = match[1] === 'jpeg' ? data[0] === 255 && data[1] === 216 && data[2] === 255 : match[1] === 'png' ? data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP';
    if (!valid || !data.length || data.length > 512000) throw new Error('Nội dung ảnh không hợp lệ hoặc vượt 500 KB.');
    return { data, extension:match[1] === 'jpeg' ? 'jpg' : match[1] };
  });
}
async function saveImages(images, saved) {
  if (!images.length) return [];
  await fs.mkdir(directory, { recursive:true });
  const urls = [];
  for (const image of images) {
    const filename = crypto.randomUUID() + '.' + image.extension;
    const file = path.join(directory, filename);
    await fs.writeFile(file, image.data, { flag:'wx' });
    saved.push(file); urls.push('/uploads/reviews/' + filename);
  }
  return urls;
}
async function removeImages(files) { await Promise.all(files.map(file => fs.unlink(file).catch(() => {}))); }
module.exports = { decodeImages, saveImages, removeImages, directory };
