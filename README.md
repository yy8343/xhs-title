# 小红书标题生成器

免费的纯前端小工具：输入主题，生成小红书风格标题和正文。

## 统计与隐私
- 统计用 GoatCounter（`js/count.js` 为官方脚本的自托管副本，ISC 许可；上报到 `https://xhstitle.goatcounter.com/count`）。脚本异步加载、所有上报包在 try/catch 里，加载失败不影响工具。
- 只上报固定事件名：`generate`、`copy-title`、`copy-body`、`copy-fail`、`share-click`、`share-native-ok`、`share-native-cancel`、`share-copylink`、`share-fail`、`email-submit`、`src-<来源代码>`、`ref-share`、`engaged-30s`、`returning`、`env-wechat|env-qq|env-other`。
- 不上报用户输入或生成内容；不用 cookie；localStorage 只存 `xt_last_visit`（上次访问日期）。
- 来源参数：`?src=xhs|x|wx|zhihu|jike|x-bio…`（只接受小写字母短代码），分享链接带 `?ref=share`。上报字段 `q` 只保留校验通过的 `src`/`ref`，其他 query（如 `utm_*`、`subscribed`）一律丢掉。

## 自测
```
npm i playwright-core   # 使用本机 Chrome，可用 CHROME=/path/to/chrome 指定
node tests/e2e.mjs
```

## robots.txt 说明
本仓库的 `robots.txt` 位于 GitHub Pages 子路径 `https://yy8343.github.io/xhs-title/robots.txt`。爬虫只认域名根目录的 `https://yy8343.github.io/robots.txt`，因此**子路径下的 robots.txt 对爬虫无效**；如需生效，需放在用户主页仓库（`yy8343.github.io`）的根目录。
