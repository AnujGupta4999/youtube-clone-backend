import  multer  from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
      cb(null, file.originalname)

    }
  })

  const fileFilter = async(req,file,cb)=>{
    // if(!req.files){
    //     return res.status(400).json({
    //         success:false,
    //         message:"No files were uploaded"
    //     })
    // }
    // const file = req.files.file;
    // if(!file){
    //     return res.status(400).json({
    //         success:false,
    //         message:"No files were uploaded"
    //     })
    // }
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype  === 'image/jpg'){
        cb(null, true);       
    }else{
      cb(new Error("only Jpeg and PNG files are allowed"),false);
    }
    // if(file.size > 1000000){
    //     return res.status(400).json({
    //         success:false,
    //         message:"File size is too large"
    //     })
    // }
    // return true;
  }
  
  
export const upload = multer({ storage, fileFilter});