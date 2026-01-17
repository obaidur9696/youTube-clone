import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: DB_NAME
        })

        console.log(`MogoDB connected !!`)
    } catch (error) {
        console.log("MogoDB connection failed", error)
        process.exit(1)
    }
}

export default connectDB;