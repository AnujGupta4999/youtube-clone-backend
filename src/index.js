
import app from './app.js';

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
});


// Call connectDB function
connectDB()
    .then(() => {
        console.log("MongoDB connected successfully");
        const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log(`Server is running at port: ${port}`);
        });
    })
    .catch(error => {
        console.error("MONGO db connection failed:", error);
    });

    