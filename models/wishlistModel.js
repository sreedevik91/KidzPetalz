var mongoose = require('mongoose');
const userModel = require('./userModel')

var wishlistSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        }
    }
    ],
    quantity: {
        type: Number,
        default:1
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('wishlist', wishlistSchema)