package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.net.URI;
import java.nio.file.Files;

public class StaticFileHandler implements HttpHandler {
    private final File publicDir;

    public StaticFileHandler() {
        this.publicDir = new File("public");
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        URI uri = exchange.getRequestURI();
        String path = uri.getPath();

        if (path == null || path.equals("/") || path.isEmpty()) {
            serveFile(exchange, new File(publicDir, "index.html"));
            return;
        }

        if (path.equals("/dashboard")) {
            serveFile(exchange, new File(publicDir, "dashboard.html"));
            return;
        }

        if (path.equals("/admin") || path.equals("/login")) {
            exchange.getResponseHeaders().set("Location", "/?auth=admin");
            exchange.sendResponseHeaders(302, -1);
            return;
        }

        // Remove leading slash
        String relPath = path.startsWith("/") ? path.substring(1) : path;
        File file = new File(publicDir, relPath);

        // Security check: prevent directory traversal
        if (!file.getCanonicalPath().startsWith(publicDir.getCanonicalPath())) {
            exchange.sendResponseHeaders(403, -1);
            return;
        }

        if (file.exists() && file.isFile()) {
            serveFile(exchange, file);
        } else {
            // SPA fallback to index.html
            File indexFile = new File(publicDir, "index.html");
            if (indexFile.exists()) {
                serveFile(exchange, indexFile);
            } else {
                exchange.sendResponseHeaders(404, -1);
            }
        }
    }

    private void serveFile(HttpExchange exchange, File file) throws IOException {
        String mimeType = getMimeType(file.getName());
        exchange.getResponseHeaders().set("Content-Type", mimeType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");

        byte[] bytes = Files.readAllBytes(file.toPath());
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String getMimeType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}
