const validator = require('validator')

// Signup validation for sanitization
const signupValidate = (req)=>{
        // Getting the data from request body
        const {userName,email,password} = req.body

        // Validating the data 
        if (!userName) {
            throw new Error('Username field is required')
        }else if(!validator.isEmail(email)){
            throw new Error('Please enter a valid email')
        }else if(!validator.isStrongPassword(password)){
            throw new Error('Password is too weak! minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1')
        }
}
    

const loginValidate = (req)=>{
    const {email,password} = req.body
    if (!email) {
        throw new Error('Email field is required')
    }else if(!validator.isEmail(email)){
        throw new Error('Please enter a valid email')
    }else if(!password){
        throw new Error('Password field is required')
    }
}

module.exports = {signupValidate,loginValidate}