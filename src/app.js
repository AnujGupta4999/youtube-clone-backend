import  express  from "express";
import cors from "cors";
import userRouter from './routes/userRoutes.js'


import cookieParser from "cookie-parser";
const app = express();
// CORS_ORIGIN=*  it means * means that request come froom anywhere

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true

}))
app.use(express.json({limit:"16kb"})) 

app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))

app.use(cookieParser())



//routes import
app.get('/',(req,res)=>{
    res.send("success")
})
app.use("/api/v1/user",  userRouter);
 
export  default app  ;