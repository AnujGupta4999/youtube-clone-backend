import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



// const uploadOnCloudinary = async (localFilePath)=>{
//     try{
//         if(!localFilePath){
//             return null;
//         }

//         //upload the file on cloudinary
//         const response  = await cloudinary.uploader.upload
//         (localFilePath, {
//             resource_type:"auto"
//         })

//         //file has been uploaded onn cloudinary
//         // console.log("file is uploaded on cloudinary",response.url);
//         fs.unlinkSync(localFilePath)
//         return response;

//     }catch(e){
//         fs.unlinkSync(localFilePath) //remove the locally saved temporary file
//         // as the upload operation got failed
//         return null;
//     }
// }

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }

        // Check if the file exists before attempting to upload
        if (!fs.existsSync(localFilePath)) {
            throw new Error('Local file does not exist');
        }

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded on Cloudinary, now delete the local file
        fs.unlinkSync(localFilePath);
        return response;

    } catch (e) {
        // Remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export { uploadOnCloudinary };

