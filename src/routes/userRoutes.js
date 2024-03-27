import { loginUser, logoutUser, refreshAccessToken, registerUser } from '../controllers/userControllers.js'; 
import  {Router}  from "express";
import { upload } from '../middlewares/multer.js'
import { verifyJWT } from '../middlewares/auth.js';

const userRouter = Router();

userRouter.route('/hello').get((req, res)=>{
    res.status(200).json({message: 'Hello'});
})

// Define route for user registration
userRouter.route('/register', 
        
).post(upload.fields([
    {
      name:"avatar",
      maxCount:1
    } ,{
      name:"coverImage",
      maxCount:1
    } 
  ]),
  
registerUser);

userRouter.route('/login').post(loginUser)


//secured routes
userRouter.route('/logout').post(verifyJWT,logoutUser)

userRouter.route('/refresh-token').post(refreshAccessToken)
export default userRouter;

