import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudnary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
       const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file is successfully uploaded
        console.log("file successfully uploaded", response.url)
        return response;

    } catch (error){
        fs.unlinkSync(localFilePath)  // remove the locally saved temporaray file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudnary}

unlinkSync