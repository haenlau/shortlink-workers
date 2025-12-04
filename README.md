# Cloudflare 短链接服务

基于 Cloudflare Workers + KV 的轻量级短链接生成与跳转服务。

所有短链接永久有效（除非手动清除），支持公开创建和带 Token 的受保护 API 创建。  
完全免费、无需服务器、开箱即用，适合快速生成可分享的短网址。

本项目仅依赖 Cloudflare 免费套餐功能，无需高级订阅。

---

## 功能特性

-  Web 界面输入长链接，自动生成短链接
-  支持 `/api/create-public` 公开接口（无需鉴权）
-  支持 `/api/create` 受保护接口（需 Bearer Token 鉴权）
-  所有短链接通过 302 临时重定向跳转至目标地址
-  自动处理 CORS，支持前端直接调用 API
-  无数据库、无用户系统、无外部依赖 —— 极简架构，零运维

---

## 使用方式

### 第一步：创建 Worker

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com)。
2. 进入 **计算和 AI > Workers 和 Pages**。
3. 点击 **“+ 添加”**，选择 **“从 Hello World! 开始”**。
4. 输入名称（如 `short-url`），点击 **“部署”**。

### 第二步：创建并绑定 KV 命名空间

1. 进入 **存储和数据库 > Workers KV**。
2. 点击 **“+ 创建命名空间”**，名称设为 `URLS`。
3. 返回该命名空间，点击 **“绑定”**，选择你的 Worker，变量名设为 `URLS`，完成绑定。

### 第三步：配置 API Token（可选但推荐）

若需使用受保护的 `/api/create` 接口：

1. 在 Worker 页面，进入 **“变量和机密”**。
2. 在 **“密钥”** 区域点击 **“+ 添加”**。
3. 设置：
   - **名称**：`API_TOKEN`
   - **值**：任意强字符串（如 `s3cr3t-t0k3n-xyz`）
4. 点击 **“保存”**。

> 若未设置 `API_TOKEN`，`/api/create` 将返回错误，但 Web 界面和 `/api/create-public` 仍可正常使用。

### 第四步：部署代码

1. 复制本项目的 `index.js` 内容。
2. 在 Cloudflare Worker 编辑器中清空默认代码，粘贴新代码。
3. 点击 **“保存并部署”**。

> 注意：HTML 模板中的 `<your-domain>` 仅为占位符，实际跳转链接由访问域名自动决定，无需修改代码。

### 第五步：（可选）绑定自定义域名

在 Worker 的 **“域和路由”** 中添加自定义子域名（如 `go.yourdomain.com`），并按提示配置 DNS 记录。

---

## 测试服务

### Web 界面测试

访问你的 Worker 地址，例如：
https://short-url.yourname.workers.dev

或自定义域名：
https://go.yourdomain.com

输入长链接，点击生成即可获得短链接。

### 公开 API 测试

```bash
curl -X POST https://go.yourdomain.com/api/create-public \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com/very/long/path","shortCode":"abc123"}'
```
 ### 受保护 API 测试（需 Token）
```bash
curl -X POST https://go.yourdomain.com/api/create \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com","shortCode":"xyz789"}'
```

开源许可

本项目采用 MIT 许可证。

项目地址：https://github.com/haenlau/shortlink-workers

Demo 地址：https://go.air1.cn