//require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import mongoose from "mongoose";

dotenv.config({
  path: "./env",
});

connectDB();

//const app = express()
// //ifi
// ;(async()=>{
//     try{
//          await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//          app.on("error",(error)=>{
//             console.log("ERROR : ",error);
//             throw error
//          })
//          app.listen(process.env.PORT,()=>{
//             console.log(`App is listen on PORT ${process.env.PORT}`);
//          })
//     }
//     catch(err){
//         console.error("ERROR : ",err)
//         throw err
//     }
// })()
