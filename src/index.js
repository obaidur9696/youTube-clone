import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
  path: './.env'
});


console.log("MONGO =", process.env.MONGODB_URL);



connectDB()