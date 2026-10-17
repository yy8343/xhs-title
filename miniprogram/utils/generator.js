// 生成逻辑（与网页版 index.html 一致），抽出为纯函数便于测试。
// 小程序修复：① "姐妹们们"叠字；② 话题标签去掉标点/空白/emoji。
// 审核考虑：标题模板弱化了"天花板""惊呆""出奇的好"等绝对化/夸大用语，界面与文案不使用"爆款"。
const T = [
  "{w}必看！{t}这样做真的很实用", "后悔没早点知道的{t}技巧", "{t}｜认真总结的一篇", "{w}的{t}，看这一篇就够了",
  "别再乱来了！{t}的正确打开方式", "坚持30天{t}，说说我的变化", "{t}避坑指南，{w}可以收藏", "被问了很多遍的{t}，今天全分享",
  "零基础也能学会的{t}", "{t}｜普通人也能做到的小改变", "求求了，{t}千万别这样做", "花了3年才总结出的{t}经验",
  "{t}真的会上瘾，{w}冲！", "低成本{t}，效果还不错", "{t}清单｜建议先码住"
];
const O = ["{w}们！今天必须跟你们聊聊{t}💡", "说真的，{t}这件事我踩过太多坑了😭", "最近好多人私信问我{t}，今天一次说清楚✨", "作为一个{w}，{t}真的改变了我很多🙌"];
const M = [
  ["先说结论：{t}没有你想的那么难。", "关键是找对方法，而不是盲目跟风。", "坚持一段时间，变化真的肉眼可见。"],
  ["✅ 第一步：先明确自己的需求和预算", "✅ 第二步：从最简单的一件小事开始", "✅ 第三步：每天记录，及时调整"],
  ["❌ 不要一开始就追求完美", "❌ 不要只看别人怎么做，适合自己最重要", "❌ 不要三天打鱼两天晒网"],
  ["📌 小建议：可以先从一周的小目标开始", "📌 遇到瓶颈很正常，换个思路就好", "📌 找个伙伴一起，更容易坚持"]
];
const E = ["有问题评论区问我，看到都会回💬", "觉得有用记得点赞收藏⭐ 下次找得到", "你们还有什么{t}的心得？评论区分享一下👇", "关注我，持续分享更多{w}干货～"];
const WHO = ["打工人", "学生党", "宝妈", "新手", "女生"];
const DEFAULT_TOPIC = "穿搭", DEFAULT_WHO = "姐妹们";
const MAX_TOPIC = 30;

function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
function shuffle(a, rnd) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// 只保留中英文、数字、下划线作为话题标签
function cleanTag(s) { return String(s).replace(/[^\p{Script=Han}A-Za-z0-9_]/gu, ""); }

function fill(tpl, t, w) {
  // "{w}们" 且 w 已以"们"结尾 → 不再叠加
  const wPlural = /们$/.test(w) ? w : w + "们";
  return tpl.split("{w}们").join(wPlural).split("{t}").join(t).split("{w}").join(w);
}

function normalize(topic, who) {
  const t = String(topic || "").trim().slice(0, MAX_TOPIC) || DEFAULT_TOPIC;
  const w = String(who || "").trim() || DEFAULT_WHO;
  return { t, w };
}

function body(t, w, rnd) {
  rnd = rnd || Math.random;
  const mids = shuffle(M, rnd).slice(0, 2).reduce((x, y) => x.concat(y), []);
  const tag = cleanTag(t) || DEFAULT_TOPIC, wt = cleanTag(w);
  const tags = ["#" + tag, "#" + tag + "分享", wt ? "#" + wt : "", "#干货分享", "#经验分享"].filter(Boolean);
  return [fill(pick(O, rnd), t, w), ""].concat(mids.map(s => fill(s, t, w)), ["", fill(pick(E, rnd), t, w), "", tags.join(" ")]).join("\n");
}

function generate(topic, who, n, rnd) {
  rnd = rnd || Math.random; n = n || 10;
  const { t, w } = normalize(topic, who);
  return shuffle(T, rnd).slice(0, n).map((s, i) => ({ id: i, title: fill(s, t, w), body: body(t, w, rnd) }));
}

module.exports = { generate, body, fill, cleanTag, normalize, T, O, M, E, WHO, MAX_TOPIC };
