const User = require('../models/user')
const jwt = require('jsonwebtoken')

const userAuth = async (req,res,next)=>{
    try{
        // Verify token
        const {token} = req.cookies;
        console.log('Token received:', token);
        if(!token){
            throw new Error('Please Login!')
        }
        const decodeToken = jwt.verify(token,"ahir@2000")
        const {_id} = decodeToken
        const user = await User.findById({_id})
        req.user = user;
        next()
    }catch(err){
        console.error("Authentication error:", err.message);
        res.status(400).send("ERROR : " + err.message)
    }
}

module.exports = userAuth