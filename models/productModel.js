const mongoose = require('mongoose')

// const productSchema = mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   description: {
//     size: {
//       type: String
//     },
//     color: {
//       type: String
//     },
//     material: {
//       type: String
//     },
//     type: {
//       type: String
//     },
//     description: {
//       type: String
//     }
//   },
//   tags: {
//     type: Array,
//     required: true
//   },
//   price: {
//     type: Number,
//     required: true
//   },
//   discount: {
//     type: String,
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true
//   },
//   category_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'category'
//   },
//   image: {
//     type: Array,
//     required: true,
//     validate: [maxNumber, 'You can enter upto 5 images']
//   },
//   is_listed: {
//     type: Boolean,
//     default: true
//   }
// },
//   {
//     timestamps: true
//   })

const productSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  image: {
    type: Array,
    required: true,
    // validate: [maxNumber, 'You can enter upto 5 images']
  },
  is_listed: {
    type: Boolean,
    default: true
  }
},
  {
    timestamps: true
  })

// function maxNumber(val) {
//   return val.length <= 5
// }

module.exports = mongoose.model('product', productSchema)