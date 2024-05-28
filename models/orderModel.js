const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    shippingAddress: {
        type: Object,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    products: [
        {
            productId: {
                type: String,
                // here type has to be objectId inorder toget aggregaion results while matching up with products collection to show in the cart page
                ref: 'products',
                required: true
            },
            title: {
                type: String,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            offerDiscount: {
                type: Number
            },
            offersApplied: [{
                name: { type: String },
                offerId: { type: mongoose.Schema.Types.ObjectId },
                discountAmount: { type: Number },
                type: { type: String },
                productId: { type: String }
            }],
            is_listed: {
                type: Boolean,
                default: true
            },
            status: {
                type: String,
                required: true
            }

        }
    ],
    orderAmount: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    couponCode: {
        type: String
    },
    checkoutAmount: {
        type: Number
    },
    couponDiscount: {
        type: Number
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model('order', orderSchema)