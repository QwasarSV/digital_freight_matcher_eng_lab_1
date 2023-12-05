import express from 'express'
import DB from './db/db'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import dotenv from 'dotenv'
import * as process from 'process'
import { Routes } from "./routes";

const app = express()
dotenv.config()

app.use(morgan('dev'))
app.use(bodyParser.json())

const db = DB.getInstance()

async function initializeDatabase() {
  try {
    const isTablesCreated = await db.createTables();
    if (isTablesCreated) {
      console.log('DB successfully instantiated...');
      await db.seedLocations();
      await db.seedTrucks();
      await db.seedRoutes();
      await db.seedStops();
      await db.seedClient();
      await db.seedRequests();
    } else {
      console.error('Error creating tables');
    }
  } catch (e) {
    console.error('Error initializing database:', e);
    throw e;
  }
}

initializeDatabase().then(() => {
  console.log('DB seeded with Incurred Contract data...')
});

const port = process.env.PG_PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
