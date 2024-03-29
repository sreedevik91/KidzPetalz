const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        minlength:3,
        maxlength:13,
        required:[true,'name is required']
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required: true
    },
    token:{
        type:String,
        default:''
    },
    is_admin:{
        type:Boolean,
        default:false
    },
    is_verified:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
})

const userModel=mongoose.model('user',userSchema)
module.exports=userModel