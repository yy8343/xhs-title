const assert = require('assert');
const g = require('../utils/generator.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
for (let k = 0; k < 300; k++) {
  for (const who of ['', '打工人', '姐妹们', '宝妈']) {
    const r = g.generate(k % 3 ? '通勤 穿搭！' : '', who, 10);
    ok(r.length === 10, 'count');
    ok(new Set(r.map(x => x.title)).size === 10, 'unique titles');
    for (const x of r) {
      const all = x.title + x.body;
      ok(!/们们/.test(all), '们们: ' + all);
      ok(!/[{}]/.test(all), 'placeholder left');
      ok(!/爆款/.test(all), '爆款');
      const tags = x.body.split('\n').pop().split(' ');
      tags.forEach(t => ok(/^#[\p{Script=Han}A-Za-z0-9_]+$/u.test(t), 'bad tag ' + t));
    }
  }
}
assert.strictEqual(g.cleanTag('考研 英语！！🔥'), '考研英语');
assert.strictEqual(g.fill('{w}们好', 't', '姐妹们'), '姐妹们好');
assert.strictEqual(g.fill('{w}们好', 't', '宝妈'), '宝妈们好');
assert.strictEqual(g.normalize('x'.repeat(50)).t.length, 30);
assert.strictEqual(g.normalize('  ', '').t, '穿搭');
console.log('PASS', n + 4, 'assertions');
