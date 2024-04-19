const mongoose=require('mongoose')

const addressSchema= mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    billingAddress:{
        name: {
            type: String,
            required: true
          },
        building: {
            type: String,
            required: true
          },
          city: {
            type: String,
            required: true
          },
          state: {
            type: String,
            required: true
          },
          country: {
            type: String,
            required: true
          },
          pbNumber: {
            type: Number,
            required: true
          },
          contactNumber:{
            type: Number,
            required: true
          }
    },
    shippingAddress:[
        {
            name: {
              type: String,
              required: true
              },
            building: {
                type: String,
                required: true
              },
              city: {
                type: String,
                required: true
              },
              state: {
                type: String,
                required: true
              },
              country: {
                type: String,
                required: true
              },
              pbNumber: {
                type: Number,
                required: true
              },
              contactNumber:{
                type: Number,
                required: true
              }
        }
    ]
},
{
    timestamps:true
})

module.exports=mongoose.model('address',addressSchema)