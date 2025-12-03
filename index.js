/**
 * Cloudflare Workers 短链接服务
 * 
 * 功能：
 * - 首页：提供短链接生成表单
 * - API：/api/create 创建短链接（POST）
 * - 跳转：/{code} 重定向到原始 URL
 * 
 * 部署要求：
 * 1. 绑定 KV 命名空间（在 wrangler.toml 中命名为 URLS）
 * 2. 自定义域名需解析到此 Worker
 * 
 * @license MIT
 */

// =============
// 静态 HTML 页面
// =============
const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🔗 短链接服务</title>
  <!-- 替换为你的 favicon 地址，或删除此行 -->
  <link rel="icon" type="image/png" href="https://example.com/favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      max-width: 600px; 
      margin: 50px auto; 
      padding: 20px; 
      line-height: 1.6; 
    }
    h1 { text-align: center; margin-bottom: 30px; }
    input, button { 
      padding: 12px; 
      width: 100%; 
      margin: 10px 0; 
      box-sizing: border-box; 
      border: 1px solid #ccc; 
      border-radius: 4px; 
    }
    button { 
      background: #007bff; 
      color: white; 
      cursor: pointer; 
      font-size: 16px; 
    }
    button:hover { background: #0069d9; }
    #result { 
      margin-top: 20px; 
      padding: 12px; 
      background: #f8f9fa; 
      border: 1px solid #e9ecef; 
      border-radius: 4px; 
      word-break: break-all; 
    }
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

      // 生成6位随机短码 (字母+数字)
      const shortCode = Math.random().toString(36).substring(2, 8);

      try {
        const res = await fetch('/api/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ longUrl, shortCode })
        });

        const data = await res.json();
        const resultDiv = document.getElementById('result');
        if (data.ok) {
          resultDiv.innerHTML = '<strong>您的短链接：</strong><br>' +
            '<a href="' + data.shortUrl + '" target="_blank">' + data.shortUrl + '</a>';
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

// ==================
// 主请求处理逻辑
// ==================
export default {
  /**
   * 处理所有 HTTP 请求
   * @param {Request} request - 原始请求对象
   * @param {Object} env - 环境变量（包含 KV 命名空间）
   * @returns {Response} 响应对象
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // === 首页路由 ===
    if (pathname === "/") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // === CORS 预检请求 ===
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // === 创建短链接 API ===
    if (pathname === "/api/create" && request.method === "POST") {
      try {
        const { longUrl, shortCode } = await request.json();
        
        // 参数校验
        if (!longUrl || !shortCode) {
          return new Response(JSON.stringify({ 
            error: "缺少必要参数：longUrl 或 shortCode" 
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        // 存储到 KV (命名空间需在 wrangler.toml 中绑定为 URLS)
        await env.URLS.put(shortCode, longUrl);
        
        // ⚠️ 部署前修改此处：替换为你的实际域名
        const shortUrl = "https://your-domain.com/" + shortCode;
        
        return new Response(JSON.stringify({
          ok: true,
          shortUrl
        }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: "服务器内部错误" 
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // === 短链接跳转 ===
    const code = pathname.slice(1); // 移除开头的 "/"
    if (code) {
      const targetUrl = await env.URLS.get(code);
      if (targetUrl) {
        // 302 临时重定向（可改为 301 永久重定向）
        return Response.redirect(targetUrl, 302);
      }
    }

    // === 未找到页面 ===
    return new Response("短链接不存在", { status: 404 });
  }
};