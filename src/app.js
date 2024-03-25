import { Express } from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
const app = Express();
// CORS_ORIGIN=*  it means * means that request come froom anywhere

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true

}))
app.use(express.json({limit:"16kb"})) 

app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))

app.use(cookieParser())
 
export { app} ;