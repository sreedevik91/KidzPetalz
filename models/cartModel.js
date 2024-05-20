var mongoose = require('mongoose');

// const cartSchema = mongoose.Schema({

//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true
//     },
//     products: [
//         {
//             type: mongoose.Schema.Types.ObjectId,
//             required: true
//         }
//     ],
//     quantity: {
//         type: Number,
//         default: 1
//     },
//     couponId: {
//         type: mongoose.Schema.Types.ObjectId
//     }

// },
//     {
//         timestamps: true
//     });

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
                discountAmount:{type:String},
                type:{type:String},
                productId:{type:String}
            }]
        

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
