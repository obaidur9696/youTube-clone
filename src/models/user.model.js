import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


const userSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            require: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            require: true
        },
        coverImage: {
            type: String
        },
        watchHistroy: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            require: [true, "Password is required"],
            minlength: 6,
            select: false // good security practice
        },
        refreshToken: {
            type: String,
            select: false
        }

    },
    {
        timestamps: true
    }

)

// middleware on various event. and encription of password.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAcessToken = async function () {
    const payload = {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    }
    const secret = process.env.ACCESS_TOKEN_SECRET
    const expireIn = process.env.ACCESS_TOKEN_EXPIRY

    return jwt.sign(payload, secret, { expiresIn: expireIn })
}

userSchema.methods.generateRefreshToken = async function () {
const payload = {
        _id: this._id
    }
    const secret = process.env.REFRESH_TOKEN_SECRET
    const expireIn = process.env.REFRESH_TOKEN_EXPIRY

    return jwt.sign(payload, secret, { expiresIn: expireIn })
}

export const User = mongoose.model("User", userSchema)