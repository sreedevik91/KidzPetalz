const mongoose = require('mongoose');

const productOfferSchema = mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    products: {
        type: Array,
        required:true
    },
    description:{
        type: String,
        required:true
    },
    offerPercentage: {
        type: Number,
        required:true
    },
    maxUse:{
        type: Number,
        default:1
    },
    is_active: {
        type: Boolean,
        required:true
    },
    valid_from: {
        type: Date,
        required:true
    },
    valid_till: {
        type: Date,
        required:true
    }
},
    {
        timestamps: true
    });

    module.exports=mongoose.model('productOffer',productOfferSchema)