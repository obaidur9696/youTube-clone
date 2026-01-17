import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
   //get user details from user
   //validation (not empty field, correct formate email)
   //check user already exits: (check by email, username)
   // check for images, check for avatar
   // upload them to cloudnary, 
   //create user object - create entry in db
   //remove paasword and refresh token feild from response
   // check for user creation (response)
   //return response

   const { username, email, fullName, password } = req.body;

   //handle each field one by one.
   // if (fullName === "") {
   //    throw new ApiError(400, "FullName is required")
   // }

   //handle all field in once.
   if (
      [username, email, fullName, password].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All field is required")
   }

   // checking user is exits or not
   const exitsUser = await User.findOne({
      $or: [{ username }, { email }]
   })
   if (exitsUser) {
      throw new ApiError(409, "username or email already exits")
   }

   // == handle files ==
   const avatarLocalPath = req.files?.avatar[0]?.path
   // const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
   }

   //upload to cloudnary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })


   const createdUser = await User.findById(user._id)

   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while register the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
   )
})


export { registerUser }