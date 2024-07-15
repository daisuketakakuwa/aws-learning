

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;
const API_SERVICE_URL = process.env.API_SERVICE_URL || 'http://localhost:8080/api';

const proxyMiddleware = createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
})

// /api/** のリクエストをプロキシ
app.use('/api', proxyMiddleware);

// // 静的ファイルのホスティング
// app.use(express.static(path.join(__dirname, 'public')));

// その他のリクエストは index.html を返す
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
