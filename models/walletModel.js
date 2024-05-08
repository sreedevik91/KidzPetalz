var mongoose = require('mongoose');
const userModel = require('./userModel')

var walletSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactions:[{
        type:{
            type:String,
            required:true,
            enum:['credit','debit']
        },
        amount:{
            type:Number,
            required:true
        },
        date:{
            type:Date,
            default:Date.now()
        }
    }]
}, 
{
    timestamps: true
});

module.exports=mongoose.model('wallet',walletSchema)