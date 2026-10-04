import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './src/server/api.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'quiz-backend-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            try {
              await handleApiRequest(req, res);
            } catch (err) {
              console.error('API Error in Vite middleware:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
});
