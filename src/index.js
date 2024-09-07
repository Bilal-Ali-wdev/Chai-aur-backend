//require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import mongoose from "mongoose";
import express from "express"
const app = express()

dotenv.config({
  path: "./env",
});

connectDB().then(()=>{
   app.listen(process.env.PORT || 8001 , ()=>{
    console.log(`Server is running at PORT : ${process.env.PORT}`);
   }) 
}).catch((err)=>{
  console.log("MONGODB CONNECTION FAILED : ",err);
});