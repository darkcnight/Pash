// server.ts (or server.js)
import { serve } from "bun";

console.log("Serving index.html on http://localhost:3000");

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    // Serve index.html for the root path
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file("./index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Optional: Serve other static files (CSS, JS) from the current directory
    const filePath = "." + url.pathname;
    const file = Bun.file(filePath);
    return new Response(file); // Bun automatically sets Content-Type for known types

    // Handle 404s for other paths
    // return new Response("Not Found", { status: 404 }); // Bun might do this implicitly if file doesn't exist
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: { "Content-Type": "text/html" },
    });
  },
});
