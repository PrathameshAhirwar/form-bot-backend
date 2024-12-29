const express = require('express')
const app = express()
const connectDB = require('./config/database')
const cookieParser = require('cookie-parser')
const authRouter = require('./Route/auth')
const dashBoardRouter = require('./Route/dashboardRoute')
const formFlowRouter = require('./Route/formFlow')
const cors = require('cors');
const PORT = 3000


app.use(cors({
    origin: 'http://localhost:3006',
    credentials:true
}));
app.use(express.json())
app.use(cookieParser())


app.use('/',authRouter);
app.use('/',dashBoardRouter);
app.use('/',formFlowRouter)



connectDB().then(()=>{
    console.log("Connected to MongoDB")
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("Error connecting to MongoDB" + err.message)
})



