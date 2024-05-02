const mongoose=require('mongoose')

const googleUserSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
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
        required:true
    },
    is_blocked:{
        type:Boolean,
        default:false
    }

},
{
    timestamps:true
})

const googleUserModel=mongoose.model('googleUser',googleUserSchema)
module.exports=googleUserModel