import mongoose, { Types } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscribers:{
        type:mongoose.Schema.Types.ObjectId,
     ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User" 
    }
},{timestamps:true})

export const Subscriber = mongoose.model("Subscriber",subscriptionSchema)