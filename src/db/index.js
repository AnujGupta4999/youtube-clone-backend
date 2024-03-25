process.setMaxListeners(15);

import mongoose from "mongoose";

import { DB_NAME } from '../constant.js';

const connectDB = async ()=> {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URl}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connect.host}`);
    }catch(error){
        console.log("Mongodb connection error: " ,error);
        process.exit(1);
    }
}

export default connectDB;