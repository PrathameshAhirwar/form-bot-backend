const mongoose = require('mongoose')
const validator = require('validator')
const {Schema} = mongoose 
const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email'+ value)
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error('Password is too weak! minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1')
            }
        }
    },
    folder: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default:null
    }],
    forms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        defualt:null
    }],
},{
    timestamps:true
})

const User = mongoose.model('User',userSchema)

module.exports = User;