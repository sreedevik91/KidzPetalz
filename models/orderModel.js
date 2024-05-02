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
                ref:'products',
                required: true
            },
            title:{
                type: String,
                required: true
            },
            image:{
                type: String,
                required: true
            },
            price:{
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            is_listed:{
                type:Boolean,
                default:true
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
    orderDate:{
        type:Date,
        default:Date.now()
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model('order', orderSchema)