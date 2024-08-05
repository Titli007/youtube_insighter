import express from 'express'
import cors from 'cors'
require('dotenv').config();
import mongoose from 'mongoose'

import routes from './routes/chatRoutes.js'
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Successfully connected to the database.");
}).catch(err => {
    console.error("Connection error", err);
});


// const {connectDB} = require('./db/mongoConfig')

const app = express()
const port = process.env.PORT;
app.use(express.json())
app.use(cors())
app.use(routes)


// connectDB()

app.listen(port, ()=>{
    console.log('app listening to the port', port)
})