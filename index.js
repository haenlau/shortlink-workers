// =============================================================================
// 📌 使用说明：
// 1. 替换下方 HTML 中的 YOUR_DOMAIN 占位符为你的实际域名（如 example.com）
// 2. 在 Cloudflare Worker 的 "Variables and Secrets" 中添加 Secret:
//    - Key: API_TOKEN
//    - Value: 你自定义的密钥（用于 /api/create 接口）
// 3. 绑定 KV Namespace:
//    - Variable name: URLS
//    - Namespace: 你创建的 KV 实例名（如 "URLS"）
// =============================================================================

const HTML = 
`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🔗 Short URL Service</title>
  <!-- 可选：替换为你自己的 favicon -->
  <link rel="icon" type="image/png" href="https://YOUR_DOMAIN/favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; line-height: 1.6; }
    h1 { text-align: center; margin-bottom: 30px; }
    input, button { padding: 12px; width: 100%; margin: 10px 0; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
    button { background: #007bff; color: white; cursor: pointer; font-size: 16px; }
    button:hover { background: #0069d9; }
    #result { margin-top: 20px; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; word-break: break-all; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>短链接生成</h1>
  <input id="longUrl" placeholder="请输入长链接（例如：https://...）" />
  <button onclick="createShortLink()">生成短链接</button>
  <div id="result"></div>

  <script>
    async function createShortLink() {
      const longUrl = document.getElementById('longUrl').value.trim();
      if (!longUrl) {
        alert("请输入一个有效的网址");
        return;
      }

      const shortCode = Math.random().toString(36).substring(2, 8);

      try {
        // 调用公开接口，无需 Token
        const res = await fetch('/api/create-public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ longUrl, shortCode })
        });

        const data = await res.json();
        const resultDiv = document.getElementById('result');
        if (data.ok) {
          // ⚠️ 注意：这里拼接的是你的域名，请确保与实际一致
          const shortUrl = 'https://YOUR_DOMAIN/' + data.shortCode;
          resultDiv.innerHTML = '<strong>您的短链接：</strong><br>' +
            '<a href="' + shortUrl + '" target="_blank">' + shortUrl + '</a>';
        } else {
          resultDiv.innerText = "错误：" + (data.error || "未知错误");
        }
      } catch (err) {
        resultDiv.innerText = "网络错误：" + err.message;
      }
    }
  </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // 首页：返回 HTML
    if (pathname === "/") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // CORS 预检请求（适用于两个 API）
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    // ───────────────────────────────────────
    // 公开创建接口：/api/create-public（无需 Token）
    // ───────────────────────────────────────
    if (pathname === "/api/create-public" && request.method === "POST") {
      try {
        const { longUrl, shortCode } = await request.json();
        if (!longUrl || !shortCode) {
          return new Response(JSON.stringify({ error: "缺少 longUrl 或 shortCode" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        await env.URLS.put(shortCode, longUrl);
        // ⚠️ 返回时也使用通用域名占位符（实际部署需替换）
        return new Response(JSON.stringify({
          ok: true,
          shortUrl: "https://YOUR_DOMAIN/" + shortCode,
          shortCode: shortCode // 方便前端拼接（可选）
        }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "服务器内部错误" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // ───────────────────────────────────────
    // 受控创建接口：/api/create（需要 API_TOKEN）
    // ───────────────────────────────────────
    if (pathname === "/api/create" && request.method === "POST") {
      const expectedToken = env.API_TOKEN;
      if (!expectedToken) {
        return new Response(JSON.stringify({ error: "服务器未配置 API_TOKEN Secret" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "缺少或无效的 Authorization 头。格式应为：Bearer <API_TOKEN>" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const token = authHeader.substring(7); // 移除 "Bearer "
      if (token !== expectedToken) {
        return new Response(JSON.stringify({ error: "API Token 无效" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 验证通过，处理创建逻辑
      try {
        const { longUrl, shortCode } = await request.json();
        if (!longUrl || !shortCode) {
          return new Response(JSON.stringify({ error: "缺少 longUrl 或 shortCode" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        await env.URLS.put(shortCode, longUrl);
        return new Response(JSON.stringify({
          ok: true,
          shortUrl: "https://YOUR_DOMAIN/" + shortCode
        }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "服务器内部错误" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 短链接跳转
    const code = pathname.slice(1); // 去掉开头的 "/"
    if (code) {
      const target = await env.URLS.get(code);
      if (target) {
        return Response.redirect(target, 302);
      }
    }

    // 未找到
    return new Response("短链接不存在", { status: 404 });
  }
};