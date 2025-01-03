const express = require('express')
const app = express()
const connectDB = require('./config/database')
const cookieParser = require('cookie-parser')
const authRouter = require('./Route/auth')
const dashBoardRouter = require('./Route/dashboardRoute')
const formFlowRouter = require('./Route/formFlow')
const formResponse = require('./Route/response')
const workSpaceRouter = require('./Route/WorkSpaceRoute')
const cors = require('cors');
const PORT = process.env.PORT || 3000


app.use(cors({
    origin: 'https://form-bot-2f4t.vercel.app/', // Your frontend's origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allow PATCH method
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));



app.use(express.json())
app.use(cookieParser())
app.options('*', cors());

app.use('/',authRouter);
app.use('/',dashBoardRouter);
app.use('/',formFlowRouter);
app.use('/',formResponse);
app.use('/',workSpaceRouter);


connectDB().then(()=>{
    console.log("Connected to MongoDB")
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("Error connecting to MongoDB" + err.message)
})



