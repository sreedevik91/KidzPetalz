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

app.set('view engine','ejs')
app.set('views','./views')

app.use('/',userRoute)
app.use('/admin',adminRoute)

// catching undefined/invalid/random routes
app.use((req, res) => {
    // res.status(404).send('Route not found. Please check the URL.');
    res.render('error/404',{message:'Page Not Found'})
});


app.listen(process.env.PORT || 3333,()=>{
    console.log('server listening to port 3333');
})

