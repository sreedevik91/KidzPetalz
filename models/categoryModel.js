const mongoose=require('mongoose')

const categorySchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    is_listed:{
        type:Boolean,
        default:true
    }
},
{
    timestamps:true
})

module.exports=mongoose.model('category',categorySchema)