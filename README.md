## 🛠 部署前修改项

1. **替换域名占位符**  
   在 `const HTML = ...` 和 `shortUrl` 拼接处，将 `YOUR_DOMAIN` 替换为你的实际域名（如 `s.example.com`）。

2. **配置 Cloudflare Worker**
   - 创建 KV Namespace，命名为 `URLS`
   - 在 Worker 的 **Settings → Variables and Secrets** 中：
     - 添加 **Secret**: `API_TOKEN` = 你的密钥
     - 添加 **KV Binding**: Variable name = `URLS`, Namespace = `URLS`

3. **绑定路由**  
   在 Worker Triggers 中添加 Route: `YOUR_DOMAIN/*`

4. **（可选）自定义 favicon**  
   将 HTML 中的 `href="https://YOUR_DOMAIN/favicon.png"` 替换为你自己的图标地址。