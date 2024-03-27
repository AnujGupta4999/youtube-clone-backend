// process.setMaxListeners(15);

// import mongoose from "mongoose";

// import { DB_NAME } from '../constant.js';

// const connectDB = async ()=> {
//     try{
//         const connectionInstance = await mongoose.connect("mongodb://localhost:27017/youtube-clone",  {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });
//         console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connect.host}`);
//     }catch(error){
//         console.log("Mongodb connection error: " ,error);
//         process.exit(1);
//     }
// }

// export default connectDB;


import mongoose from "mongoose";
// import { DB_NAME } from '../constant.js';

const connectDB = async () => {
    try {
        // Connect to MongoDB
        const connectionInstance = await mongoose.connect("mongodb://localhost:27017/youtube-clone");

        // Access the connected host from the connection object
        console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error("Mongodb connection error: ", error);
        process.exit(1); // Exit the process if there's an error
    }
}

export default connectDB;
