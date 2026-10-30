# 四楼

一栋没有电梯的老公寓，四楼的合租房里住着阿澈、小满、Nico，楼下是老周的旧书店，还有一只叫「房东」的猫。
现实里过一天，四楼也过一天。

线上地址：https://4f.brandonsli.com

## 怎么玩

- 在线：打开上面的网址。
- 本地：双击 `start.command`，会打开 `dist/fourth-floor.html`（单文件版，不需要联网和服务器）。
- 进度存在浏览器里。换设备或清缓存之前，在「设置 → 存档」里导出存档文件，之后再导入。

节奏默认是真实时间：每天解锁一天故事。在「设置 → 节奏」里可以改成「不用等」。
故事之外，点「四楼」可以看到此刻谁在家（按你那里的真实时间），点他们可以聊几句。

## 内容

第一章「四楼的灯」：序章加 14 天，共 31 段。每个角色都有一条长线，选择会被记住，后面的台词会提到；结局由你和谁最亲近决定。

## 接入大模型（可选）

「设置 → 让角色自由聊天」里选择厂商、填模型名和 API key，勾选「启用」。之后在「四楼」里点角色就是自由对话，剧情主线不变。
已预留：Anthropic、OpenAI、Google Gemini、DeepSeek、通义千问、Kimi、智谱 GLM、本机 Ollama，以及任意 OpenAI 兼容接口。

- API key 只保存在当前浏览器，导出的存档里不含 key。
- 有些厂商不允许网页直接调用，浏览器会报跨域错误；这时需要一个转发请求的小代理，把「接口地址」改成代理地址即可。
- 角色设定和记忆如何拼成提示词，见 `src/llm/index.js`；厂商请求格式见 `src/llm/providers.js`。

## 目录

| 路径 | 内容 |
|---|---|
| `story/bible.js` | 世界观与角色设定，剧本和大模型提示词都以它为准 |
| `story/ch1/` | 第一章剧本，按天分文件 |
| `story/idle.js` | 故事之外的日常台词、谁在家、久别重逢的问候 |
| `src/engine.js` | 剧本运行器（对白、选项、条件、记忆） |
| `src/calendar.js` | 真实时间节奏 |
| `src/state.js` | 存档、导入导出 |
| `src/art/` | 用代码画的场景与立绘 |
| `src/main.js` | 界面与流程 |
| `tools/build.mjs` | 打包成单文件 `dist/fourth-floor.html` |

## 开发

```bash
npm test          # 引擎、日历、存档、剧本完整性、大模型接口（不发真实请求）
npm run e2e       # 无头浏览器走完整章并截图到 tests/shots/
npm run build     # 重新生成 dist/fourth-floor.html
./backup.sh       # 打包备份到 ~/Backups/fourth-floor/
```

剧本写法见 `story/lines.js` 与 `src/engine.js` 顶部注释。新增一章：在 `story/` 下新建文件夹，按同样格式写场景，在 `story/chapter1.js` 旁边加一个章节文件并接入 `src/main.js`。
