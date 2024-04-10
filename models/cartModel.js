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
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    ],
    quantity: {
        type: Number,
        default: 1
    },
    couponId: {
        type: String
    }

},
    {
        timestamps: true
    });

module.exports = mongoose.model('cart', cartSchema)
