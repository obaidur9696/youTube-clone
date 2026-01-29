import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'

const generateAcessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId)
      const refreshToken = await user.generateRefreshToken()
      const accessToken = await user.generateAcessToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return { accessToken, refreshToken }
   }
   catch {
      throw new ApiError(500, "Something went wrong while generating refresh and access token")
   }
}

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
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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
      avatar: {
         url: avatar?.url,
         public_id: avatar?.public_id
      },
      coverImage: {
         url: coverImage?.url,
         public_id: coverImage?.public_id
      },
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

const loginUser = asyncHandler(async (req, res) => {
   // req body -> data
   //username or email
   //find the user
   //password chack
   //access and refresh token
   //send cookies

   const { email, username, password } = req.body

   if (!username && !email) {
      throw new ApiError(400, "username or email is required")
   }

   const user = await User.findOne({
      $or: [{ username }, { email }]
   }).select("+password")

   if (!user) {
      throw new ApiError(400, "User does not exits")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Password invalid")
   }

   const { accessToken, refreshToken } = await generateAcessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id)

   const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
   }
   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken
            },
            "user logged in successfully"
         )
      )
})


const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true   // if we add then it will give the return new undefined refreshtoken values from new user
      }
   )

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(
            200, {}, "User Logout Successfully"
         )
      )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRfreshToken = req.cookies?.refreshToken || req.body.refreshToken

   try {
      if (!incomingRfreshToken) {
         throw new ApiError(401, "unauthorized request incomingRefreshToken")
      }

      const decodedToken = jwt.verify(
         incomingRfreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )

      const user = await User.findById(decodedToken?._id).select("+ refreshToken")

      if (!user) {
         throw new ApiError(401, "Invalid refreshtoken in refreshAccessToken")
      }

      if (incomingRfreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or invalid")
      }


      const { accessToken, newefreshToken } = await generateAcessAndRefreshToken(user._id)

      const options = {
         httpOnly: true,
         secure: true
      }

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newefreshToken, options)
         .json(
            new ApiResponse(
               200,
               {
                  accessToken,
                  refreshToken: newefreshToken
               },
               "Access token Genreated"
            )
         )
   } catch (error) {
      throw new ApiError(500, error?.message || "Something went wrong while refreshing access token")

   }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {},
            "Password changed successfully"
         )
      )

})

const getCurrentUser = asyncHandler(async (req, res) => {
   return res.
      status(200)
      .json(new ApiResponse(
         200,
         req.user,
         "Current user fetched successfully"
      ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { email, fullName } = req.body;

   if (!fullName || !email) {
      throw new ApiError(400, "All fields are required in updation")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email
         }
      },
      { new: true }  // when we write this one in updation it return the updated user.
   )

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            user,
            "Account details updated successfully"
         )
      )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path    // here we have req.file because we want to only update only file that is wht we are nou using req.files like how we used in the registered case.
   const oldAvatarPublicId = req.user?.avatar?.public_id;

   if (!avatarLocalPath) {
      throw new ApiError(400, "AVATAR FILE IS MISSING")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      { new: true }
   )

   // delete old avatar from cloudinary
   if (oldAvatarPublicId) {
      await deleteFromCloudinary(oldAvatarPublicId);
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
         )
      )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path    // here we have req.file because we want to only update only file that is wht we are nou using req.files like how we used in the registered case.

   const oldCoverImagePublicId = req.user?.coverImage?.public_id;

   if (!coverImageLocalPath) {
      throw new ApiError(400, "COVERIMAGE FILE IS MISSING")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading on coverImage")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      { new: true }
   )

   // delete old coverImage from cloudinary
   if (oldCoverImagePublicId) {
      await deleteFromCloudinary(oldCoverImagePublicId);
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            user,
            "coverImage updated successfully"
         )
      )

})


const getUserChannelProfile = asyncHandler(async (req, res) => {
   const { username } = req.params

   if (!username?.trim()) {
      throw new ApiError(400, "Username is missing when getUserChannelProfile called")
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: _id,
            foreignField: "channel",
            as: "subscribers"
         },

         $lookup: {
            from: "subscriptions",
            localField: _id,
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },

      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            channelsSubscribedToCount: {
               $size: "subscribedTo"
            },

            //checked isSubscribed or not?
            isSubscribed: {
               $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  esle: false
               }
            }
         }
      },

      {
         $project: {
            username: 1,
            fullName: 1,
            email: 1,
            coverImage: 1,
            avatar: 1,
            subscribersCount,
            channelsSubscribedToCount,
            isSubscribed

         }
      }

   ])

   if (!channel?.length) {
      throw new ApiError(400, "Channel does not exits")
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
         )
      )
})

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile
}