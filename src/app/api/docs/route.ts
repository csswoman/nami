/** Documentación interactiva de la API (Swagger UI sobre /api/openapi.json). */
const SWAGGER = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ñami API</title>
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="${SWAGGER}/swagger-ui.css" />
  <style>body { margin: 0; background: #fff; } .topbar { display: none; }</style>
</head>
<body>
  <div id="docs"></div>
  <script src="${SWAGGER}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#docs", deepLinking: true, withCredentials: true });
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
