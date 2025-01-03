require('dotenv').config()
const mongoose = require('mongoose')

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,
            {useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 30000,  // 30 seconds
            }
        )
    }catch(err){
        console.log(err)
    }
}

module.exports = connectDB;