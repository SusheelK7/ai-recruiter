import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.connect().then(client => {
  console.log('Connected to PG successfully!');
  client.release();
  pool.end();
}).catch(err => {
  console.error('PG connection error:', err);
});
