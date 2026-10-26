// Mock-only static client. No proxy, plugin, backend or remote host access.
export default {
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: false,
    hmr: false,
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2022' },
};
