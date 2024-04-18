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
    products: {
        type: Object,
        required: true
    },
    orderAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
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