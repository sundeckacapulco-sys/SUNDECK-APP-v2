const http = require('http');

const parseBody = payload => {
  if (!payload) {
    return undefined;
  }

  if (typeof payload !== 'string') {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    return payload;
  }
};

const buildResponse = (status, body, headers = {}) => ({
  status,
  body,
  headers
});

const request = app => ({
  get: path => new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, () => {
      const { port } = server.address();

      const req = http.request({
        method: 'GET',
        hostname: '127.0.0.1',
        port,
        path,
        headers: {
          'Content-Type': 'application/json'
        }
      }, res => {
        let rawData = '';

        res.setEncoding('utf8');
        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          const body = parseBody(rawData);
          const headers = Object.fromEntries(
            Object.entries(res.headers).map(([key, value]) => [key.toLowerCase(), value])
          );

          server.close(closeError => {
            if (closeError) {
              reject(closeError);
              return;
            }

            resolve(buildResponse(res.statusCode, body, headers));
          });
        });
      });

      req.on('error', error => {
        server.close(() => reject(error));
      });

      req.end();
    });

    server.on('error', reject);
  })
});

module.exports = request;
