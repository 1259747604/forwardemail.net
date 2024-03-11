const http = require('http');

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, world!');
});

server.listen(3003, '127.0.0.1', () => {
    console.log('Server running at http://localhost:3003/');
});