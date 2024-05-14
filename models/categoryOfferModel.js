const mongoose = require('mongoose');

const categoryOfferSchema = mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    categories: {
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

    module.exports=mongoose.model('categoryOffer',categoryOfferSchema)