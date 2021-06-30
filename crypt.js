const crypto = require('crypto')

const md5sum = crypto.createHash('md5');
let str = "TEst1234";

const res = md5sum.update(str).digest('hex');
console.log(res);