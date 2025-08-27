export const databaseConfig = {
  type: 'postgres' as const,
  host: 'dpg-d2mpmr15pdvs7395ke1g-a.oregon-postgres.render.com',
  port: 5432,
  username: 'admin',
  password: 'pXhtaqRCFlb5v2BTav6gulaoVpLzlpWC',
  database: 'hello_lingo',
  synchronize: false, // Disabled to prevent schema conflicts
  ssl: {
    rejectUnauthorized: false,
  },
};
