const mongoose=require('mongoose')
const userModel=require('./userModel')

const otpSchema=mongoose.Schema({
    user_id:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    expiration:{
        type:Date,
        required:true
    }
},
{
    timestamps:true
})

module.exports=mongoose.model('otp',otpSchema)