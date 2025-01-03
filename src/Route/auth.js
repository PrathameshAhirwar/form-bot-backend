const express = require('express')
const authRouter = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const cookies = require('cookie-parser')
const {signupValidate,loginValidate}=require('../utils/validate')
const userAuth = require('../middlewares/userAuth')

require('dotenv').config()



authRouter.post("/signup",async(req,res)=>{
    try{
        // Validating data
        signupValidate(req)

        // User will store username,email,password
        const {userName,email,password,confirmPassword} = req.body

        
        // User already exist
        const existingUser = await User.findOne({email})
        if(existingUser){
           throw new Error("User already exist")
        }

        // Compare the password
        if(password !== confirmPassword){
            throw new Error("Password not match")
        }

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password,10)

        

        // Store in DB
        const user = new User({
            userName,
            email,
            password:passwordHash
        })
        
        await user.save()
        res.send("User signedup successfully")
    }catch(err){
        res.status(400).send(err.message)
    }
})

authRouter.post("/login",async (req,res)=>{
    try{
        // Validate data
        loginValidate(req)

        const {email,password} = req.body
        // Check User exist or not
        const isUserExist = await User.findOne({email})
        if(!isUserExist){
            throw new Error("User not found Please signup")
        }

        // Compare the password
        const isValidPassword = await bcrypt.compare(password,isUserExist.password)
        if(!isValidPassword){
            throw new Error("Invalid password")
        }

        // Generate a JWT token
        const token = await jwt.sign({_id:isUserExist._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"1d"
        })
        
        res.cookie('token', token, {
            secure: true, // Not using HTTPS in local development
            sameSite: 'Lax', // Allows cookies for same-site requests
            expires: new Date(Date.now() + 86400000),
            httpOnly: true, // Ensures cookie is only sent in HTTP(S) requests, not accessible via JavaScript
        });
        res.cookie('userId',isUserExist._id.toString())
        
        res.json({
            message: `${isUserExist.userName} logged in successfully`,
            userId: `${isUserExist._id}`
        })
    }catch(err){
        console.log(err.message)
        res.status(400).json({
            message: err.message
        })
    }
})

// Logout route
authRouter.post("/logout", userAuth, (req, res) => {
    try {
        // Check if user exists in the request from userAuth middleware
        if (!req.user) {
            return res.status(400).json({ message: "User is not logged in" });
        }

        // Clear cookies to log the user out
        res.clearCookie('token');
        res.clearCookie('userId');

        res.json({
            message: "User logged out successfully"
        });
    } catch (err) {
        console.error("Error during logout:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



module.exports = authRouter