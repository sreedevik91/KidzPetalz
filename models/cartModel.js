var mongoose = require('mongoose');

const cartSchema = mongoose.Schema({

    user: {
        type: String,
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                // here type has to be objectId inorder toget aggregaion results while matching up with products collection to show in the cart page
                ref:'products',
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            },
            offerAmount:{
                type: Number
            },
            offersApplied: [{
                name: {type:String},
                offerId:{type:mongoose.Schema.Types.ObjectId},
                discountAmount:{type:Number},
                type:{type:String},
                productId:{type:String}
            }],
            unitPrice:{
                type: Number
            } 
        
        }
    ],
    quantity: {
        type: Number,
        default: 1
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('cart', cartSchema)
