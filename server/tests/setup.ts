process.env.DATABASE_URL ??= "postgres://localhost:5432/ainews_test";
process.env.JWT_SECRET ??= "test-jwt-secret-not-used-in-unit-tests";
process.env.TOKEN_ENCRYPTION_KEY ??= "a".repeat(64);
process.env.GOOGLE_CLIENT_ID ??= "test-client-id.apps.googleusercontent.com";
