import sql, { ConnectionPool } from "mssql";

function getConnectionString(): string {
  const connectionString = process.env.MSSQL_CONNECTION_STRING_AUR3M;

  if (!connectionString) {
    throw new Error("Missing MSSQL_CONNECTION_STRING_AUR3M environment variable.");
  }

  return connectionString;
}

let poolPromise: Promise<ConnectionPool> | undefined;

export function getDbPool(): Promise<ConnectionPool> {
  if (!poolPromise) {
    poolPromise = sql.connect(getConnectionString());
  }

  return poolPromise as Promise<ConnectionPool>;
}
