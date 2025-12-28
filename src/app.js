import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//to handle json formate
app.use(express.json({limit: "20kb"}))

//to handle the data from url
app.use(express.urlencoded({extended: true, limit:"20kb"}))

//access the static files
app.use(express.static("public"))
app.use(cookieParser())
export {app}