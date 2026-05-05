// Local Postgres connection details. The Docker container in
// `docker-compose.db.yml` is provisioned with these exact credentials,
// so they're committed as constants — there's no separate "real" value
// hidden in an env file. Change them here (and in the compose file) if
// you ever need to.

export const DB_USER = 'user';
export const DB_PASSWORD = 'password';
export const DB_NAME = 'database';
export const DB_HOST = '127.0.0.1';
export const DB_PORT = 5433;

export const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
