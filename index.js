const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Short URL Service</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 500px;
      margin: 40px auto;
      padding: 20px;
      overflow-x: hidden;
    }
    h1 { text-align: center; }
    input, button {
      width: 100%;
      padding: 12px;
      margin: 10px 0;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 16px;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      cursor: pointer;
    }
    button:hover { background: #0069d9; }
    #result {
      margin-top: 15px;
      padding: 12px;
      background: #e8f4ff;
      border-radius: 6px;
      word-break: break-all;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🔗 Short URL Generator</h1>
  <input id="longUrl" placeholder="Enter a long URL (e.g., https://...)" />
  <button onclick="createShortLink()">Generate Short URL</button>
  <div id="result"></div>

  <script>
    async function createShortLink() {
      const longUrl = document.getElementById('longUrl').value.trim();
      if (!longUrl) {
        alert("Please enter a valid URL");
        return;
      }

      const shortCode = Math.random().toString(36).substring(2, 8);

      try {
        const res = await fetch('/api/create-public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ longUrl, shortCode })
        });

        const data = await res.json();
        const resultDiv = document.getElementById('result');
        if (data.ok) {
          const url = "https://<your-domain>/" + shortCode;
          resultDiv.innerHTML = '<strong>✅ Your short URL:</strong><br>' +
            '<a href="' + url + '" target="_blank">' + url + '</a>';
        } else {
          resultDiv.innerText = "❌ Error: " + (data.error || "Unknown error");
        }
      } catch (err) {
        document.getElementById('result').innerText = "Network error: " + err.message;
      }
    }
  </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Serve homepage
    if (pathname === "/") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Public API: /api/create-public
    if (pathname === "/api/create-public" && request.method === "POST") {
      try {
        const { longUrl, shortCode } = await request.json();
        if (!longUrl || !shortCode) {
          return new Response(JSON.stringify({ error: "Missing longUrl or shortCode" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        await env.URLS.put(shortCode, longUrl);
        return new Response(JSON.stringify({
          ok: true,
          shortUrl: "https://<your-domain>/" + shortCode
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // Authenticated API: /api/create
    if (pathname === "/api/create" && request.method === "POST") {
      const expectedToken = env.API_TOKEN;
      if (!expectedToken) {
        return new Response(JSON.stringify({ error: "API_TOKEN not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Invalid Authorization header" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const token = authHeader.substring(7);
      if (token !== expectedToken) {
        return new Response(JSON.stringify({ error: "Invalid API token" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      try {
        const { longUrl, shortCode } = await request.json();
        if (!longUrl || !shortCode) {
          return new Response(JSON.stringify({ error: "Missing longUrl or shortCode" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        await env.URLS.put(shortCode, longUrl);
        return new Response(JSON.stringify({
          ok: true,
          shortUrl: "https://<your-domain>/" + shortCode
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // Redirect short code
    const code = pathname.slice(1);
    if (code) {
      const target = await env.URLS.get(code);
      if (target) {
        return Response.redirect(target, 302);
      }
    }

    return new Response("Not found", { status: 404 });
  }
};