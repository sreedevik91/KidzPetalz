const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    size: {
      type: String
    },
    color: {
      type: String
    },
    material: {
      type: String
    },
    type: {
      type: String
    },
    description: {
      type: String
    }
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  ordered_quantity: {
    type: Number,
    default:0
  },
  rating: {
    type: Number,
    default:0
  },
  featured: {
    type: Boolean,
    default:false
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  image: {
    type: Array,
    required: true
    // validate: [maxNumber, 'You can enter upto 5 images']
  },
  is_listed: {
    type: Boolean,
    default: true
  },
  is_wishListed: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true
  })


// function maxNumber(val) {
//   return val.length <= 5
// }

module.exports = mongoose.model('product', productSchema)