// Loads backend/.env when present (Node >= 20.12). Real env vars always win.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on the process environment */
}
