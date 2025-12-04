使用 Cloudflare Workers + KV 快速搭建短链接服务

本指南适用于 Cloudflare 免费账户用户。

功能特性
支持通过 Web 界面生成短链接（公开接口）
提供带 Token 鉴权的 API 接口（用于程序调用）
基于 Cloudflare KV 存储长/短链接映射
自动 302 跳转
完全兼容免费账户（无需付费）

源码已开源，JavaScript 核心逻辑文件请参考项目仓库中的 [index.js](https://github.com/haenlau/shortlink-workers/blob/main/index.js)。

部署步骤
第一步：创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单点击 Workers 和 Pages
3. 点击右上角 + 添加 → 选择 Worker
4. 输入服务名称（如 short-url-service），选择 从 Hello World 开始，点击 部署
记下分配的默认地址：https://short-url-service.workers.dev

第二步：创建 KV 命名空间

1. 在左侧菜单中，展开 存储和数据库
2. 点击 Workers KV
3. 点击 创建命名空间
4. 输入名称：URLS，点击 创建

第三步：绑定 KV 到 Worker

1. 返回您的 Worker 详情页
2. 在 绑定 区域点击 + 绑定
3. 类型选择 KV 命名空间
4. 选择刚创建的 URLS 命名空间
5. 设置变量名为 URLS
6. 点击 添加绑定
成功后，Worker 即可通过 env.URLS 访问该 KV 存储。

第四步：配置 API 密钥（用于受控接口）

1. 在 Worker 页面顶部点击 设置
2. 找到 变量 区域，点击 添加变量
3. 填写：
Key: API_TOKEN
Value: 任意高强度随机字符串（如 x7G!kL9@qP2mNvR5）
类型: 密钥（Secret）
4. 点击 保存
此密钥将用于保护 /api/create 接口，请勿泄露。

第五步：部署代码

1. 在 Worker 页面点击 编辑代码
2. 清空默认代码，粘贴项目仓库中的 [index.js](https://github.com/your-username/short-url-worker/blob/main/index.js) 内容
3. 关键修改：将代码中所有 <your-domain> 替换为您的实际访问域名：
若使用默认域名：short-url-service.workers.dev
若使用自定义域名（如 go.example.com）：请确保已在 DNS 中解析并绑定到此 Worker
4. 点击右上角 部署

第六步：测试服务
访问 Web 界面
打开浏览器访问：

https://short-url-service.workers.dev

测试公开 API（无需认证）
```bash
curl -X POST https://short-url-service.workers.dev/api/create-public \
-H "Content-Type: application/json" \
-d '{"longUrl":"https://example.com","shortCode":"test123"}'
```
测试受控 API（需 Token）
```bash
curl -X POST https://short-url-service.workers.dev/api/create \
-H "Authorization: Bearer your-api-token-here" \
-H "Content-Type: application/json" \
-d '{"longUrl":"https://example.com","shortCode":"secure456"}'
```
测试跳转
访问：

https://short-url-service.workers.dev/test123

应自动重定向至 https://example.com

自定义域名

1. 在您的域名提供商处添加一条 CNAME 记录：
名称：go（或其他子域）
目标：short-url-service.workers.dev
2. 在 Cloudflare DNS 设置中确保该记录由 Cloudflare 代理（橙色云图标）
3. 返回 Worker 的 绑定 页面，点击 + 绑定 → 自定义域名
4. 输入 go.yourdomain.com 并按指引完成验证
完成后，将 index.js 中的 <your-domain> 替换为 go.yourdomain.com

安全与维护建议
公开接口 (/api/create-public) 可能被滥用，建议在生产环境中限制或关闭
定期轮换 API_TOKEN
可通过 Cloudflare Logs 查看请求日志（需启用）
如需更高安全性，可结合 Cloudflare Access 或 Rate Limiting（高级功能）

开源许可

本项目采用 MIT 许可证。

MIT License

项目地址：[https://github.com/haenlau/shortlink-workers](https://github.com/your-username/short-url-worker)