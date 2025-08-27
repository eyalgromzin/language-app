const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'dpg-d2mpmr15pdvs7395ke1g-a.oregon-postgres.render.com',
  port: 5432,
  user: 'admin',
  password: 'pXhtaqRCFlb5v2BTav6gulaoVpLzlpWC',
  database: 'hello_lingo',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function createNowPlayingTable() {
  const client = new Client(dbConfig);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'create-now-playing-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating now_playing table...');
    await client.query(sql);
    console.log('Table created successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'now_playing'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ now_playing table exists in the database');
    } else {
      console.log('❌ now_playing table was not created');
    }
    
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createNowPlayingTable();
