var mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
    name: {
        type: String,
        unique:true,
        required: true
    },
    code: {
        type: String,
        unique:true,
        required: true
    },
    discountType: {
        type: String
    },
    discountAmount: {
        type: Number
    },
    description: {
        type: String
    },
    minPurchase: {
        type: Number,
        required: true
    },
    valid_from: {
        type: Date,
        required: true
    },
    valid_till: {
        type: Date,
        required: true
    },
    max_use: {
        type: Number,
        required: true
    },
    claimed_users: {
        type: Array
    },
    is_active:{
        type:Boolean,
        default:true
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('coupon', couponSchema)