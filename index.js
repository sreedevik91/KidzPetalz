const express=require('express')
const app=express()
const dotenv=require('dotenv')
const mongoose=  require('mongoose')
const userRoute=require('./routes/userRoute')
const adminRoute=require('./routes/adminRoute')

dotenv.config()

const connect=mongoose.connect(process.env.MONGO_URL)

connect.then((data)=>{
    console.log('db connected');
}).catch((err)=>{
    console.log(err.message);
})

app.use('/',userRoute)
app.use('/admin',adminRoute)

app.listen(process.env.PORT || 3333,()=>{
    console.log('server listening to port 3333');
})

