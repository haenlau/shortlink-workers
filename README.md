短链接生成服务（Short URL Service）

这是一个基于 Cloudflare Workers + KV 的轻量级短链接生成服务。
提供网页界面（公开）和 API 接口（带 Token 验证），适合个人或小团队快速部署自己的短链系统。
💡 无需服务器，免费托管，全球加速！

🛠 部署前修改项

在部署之前，请完成以下配置：
1. 替换域名占位符
在 worker.js 中搜索 YOUR_DOMAIN，将其替换为你实际绑定的自定义域名（例如：s.example.com）：
HTML title 和 favicon 链接
JavaScript 中拼接 shortUrl 的地方
所有返回 shortUrl 的 API 响应
示例：https://YOUR_DOMAIN/abc123 → https://s.yourdomain.com/abc123
2. 配置 Cloudflare Worker
创建 KV Namespace
名称建议为 URLS（可在 [Cloudflare Dashboard → Workers & Pages → KV](https://dash.cloudflare.com) 创建）
绑定 KV 到 Worker
在 Worker 编辑页 → Settings → Variables and Secrets → KV Namespace Bindings
Variable name: URLS
Namespace: 选择你刚创建的 URLS
添加 Secret
在 Secrets 区域添加：
Key: API_TOKEN
Value: 你自定义的密钥（如 my-secret-12345），用于保护 /api/create 接口
3. 绑定自定义域名（可选但推荐）
在 Worker Triggers → Routes 中添加：YOUR_DOMAIN/*
并在 Cloudflare DNS 中将该域名 CNAME 到你的 .workers.dev 子域
4. （可选）替换 favicon
将 HTML 中的：
html
<link rel="icon" type="image/png" href="https://YOUR_DOMAIN/favicon.png" />

替换为你自己的图标地址，或删除该行使用默认。

🧪 使用方式
网页版（公开）
访问你的域名（如 https://s.example.com），输入长链接，点击“生成”即可获得短链接。
API 调用（需 Token）
bash
curl -X POST https://s.example.com/api/create \
-H "Authorization: Bearer your-api-token" \
-H "Content-Type: application/json" \
-d '{"longUrl":"https://github.com","shortCode":"gh"}'
返回：{"ok":true,"shortUrl":"https://s.example.com/gh"}

📦 技术栈
Runtime: Cloudflare Workers (Edge)
Storage: Cloudflare KV
Frontend: Vanilla HTML/JS (零依赖)
Security: Bearer Token 验证（仅限 API）

📄 许可证（License）

本项目采用 MIT 许可证

MIT License

Copyright (c) 2025 [Your Name or Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.