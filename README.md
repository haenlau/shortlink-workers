🔗 短链接服务（Cloudflare Workers + KV）

一个极简、高效、完全免费的短链接生成器，基于 Cloudflare Workers + Workers KV 实现。
✅ 无需服务器
✅ 全球加速
✅ 零运维
✅ 可绑定自定义域名
💡 本项目支持 纯网页操作部署，无需安装 Wrangler 或本地环境，适合快速上手！

🚀 部署方式：直接在 Cloudflare 控制台完成

你不需要使用 wrangler.toml 或 CLI 工具，只需在 Cloudflare Dashboard 上几步操作即可上线。
✅ 步骤 1：创建 KV 命名空间
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入你的域名 → Workers & Pages → KV
3. 点击 Create a namespace
命名空间名称：URLS（必须与代码中的 env.URLS 一致）
4. 创建完成后，记住这个命名空间 ID（后续会用到）

✅ 步骤 2：创建 Worker 并绑定 KV
1. 在 Workers & Pages 页面，点击 Create application → Create Worker
2. 将你的 JavaScript 代码（index.js）粘贴到编辑器中
3. 滚动到底部，找到 Variables and Secrets → KV Namespace Bindings
4. 添加绑定：
Variable name: URLS
KV namespace: 选择你刚创建的 URLS
5. 点击 Save and Deploy
⚠️ 必须确保变量名为 URLS，否则代码无法访问 KV 存储！

✅ 步骤 3：绑定自定义域名
1. 在 Worker 详情页 → Triggers → Routes
2. 添加路由规则：
Route: your-domain.com/
3. 保存后，即可通过 https://your-domain.com/xxx 访问短链

📄 项目结构

.
├── index.js # 主 Worker 脚本（已上传至 Cloudflare）
└── README.md # 本文件
index.js 包含完整的短链接逻辑：
首页表单：输入长链接并生成短码
API 接口：POST /api/create 创建短链
跳转逻辑：/{code} 自动重定向到原始 URL
支持 CORS 和错误处理

🧩 核心功能说明

功能 说明
------ ------
🌐 首页 提供 HTML 表单，用户可输入长链接生成短链
📤 API 创建 POST /api/create 接收 { longUrl, shortCode }，存入 KV
🔁 跳转 访问 https://your-domain.com/abc123 即跳转到对应长链接
🔒 安全性 所有数据存储在 Cloudflare KV，无数据库依赖，安全可靠

⚙️ 使用说明
1. 如何生成短链接？
访问 https://your-domain.com/
输入目标网址（如 https://github.com/air1）
点击“生成短链接”
复制返回的短链（如 https://your-domain.com/abc123）
2. 如何调用 API？
bash
curl -X POST https://your-domain.com/api/create \
-H "Content-Type: application/json" \
-d '{"longUrl": "https://example.com", "shortCode": "test"}'
3. 如何跳转？
访问 https://your-domain.com/test 即自动跳转到 https://example.com

🔧 自定义配置

项目 修改方式
------ ----------
域名 修改代码中 shortUrl: "https://your-domain.com/" + shortCode
favicon 修改 HTML 中 <link rel="icon"> 的 href
页面标题 修改 <title> 标签内容
✅ 请在部署前修改所有占位符（如 your-domain.com），否则短链将无效！

❓ 常见问题
Q：为什么不用 Wrangler？
A：本方案专为零本地依赖设计，适合快速部署。如果你习惯 CLI，也可配合 wrangler.toml 使用。
Q：短码会重复吗？
A：当前使用 6 位随机码，冲突概率极低（约 1/21 亿），适合个人使用。如需更高可靠性，可改用 UUID 或检查 KV 是否已存在。
Q：能用于生产环境吗？
A：完全可以！Cloudflare Workers 免费计划支持每天 10 万次请求，足够个人或小团队使用。

📜 License
MIT © [haen]

✨ Enjoy your own short link service!
项目地址：https://github.com/haenlau/shortlink-workers