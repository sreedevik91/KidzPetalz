var mongoose = require('mongoose');
const cartModel=require('../models/cartModel')
const addressModel=require('../models/addressModel')
const orderModel = require('../models/orderModel')

const loadCheckout=async (req,res)=>{
    try {

        let userId=req.session.userId
      
        let cartTotalAmount = await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'cartProduct'
                }
            },
            {
                $project: {
                    product: 1, quantity: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$cartProduct.discounted_price'] } }
                }

            }
        ])

        let shippingAddress = await addressModel.aggregate([
            { $match: { userId: userId } },
            { $unwind: '$shippingAddress' },
            {
                $project: {
                   shippingAddress:1
                }
            }
        ])
        
    //    console.log(cartTotalAmount[0]);
    //    console.log(shippingAddress[0]);


        res.render('checkout',{page: 'Checkout', data:shippingAddress,cartTotalAmount:cartTotalAmount[0].total , id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {

        console.log(error.message);
        
    }
}


const placeOrder= async (req,res)=>{
    try {

        // console.log(req.body)
        let userId=req.body.userId
        let shippingAddressId=req.body.shippingAddress
        let paymentMethod=req.body.paymentMethod
        let status= req.body.paymentMethod==='cod' ? 'placed' : 'pending'

        // let cartItems = await cartModel.findOne({user: userId})
        let newShippingAddressId = new mongoose.Types.ObjectId(shippingAddressId)
        
        let order=await orderModel.findOne({userId})
        console.log(order);
        
        let newShippingAddress = await addressModel.aggregate([
            { $match: { userId: userId } },
            { $unwind: '$shippingAddress' },
            {
                $project: {
                   shippingAddress:1
                }
            },
            {
                $match:{'shippingAddress._id':newShippingAddressId}
            },
            {
                $project:{
                    shippingAddress:1,_id:0
                }
            }
        ])

        // console.log(newShippingAddress[0]);
        let shippingAddress=newShippingAddress[0].shippingAddress
        

        let totalAmount=await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity'
                }
            },  
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'cartProduct'
                }
            },
            {
                $project: {
                    product: 1, quantity: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$cartProduct.discounted_price'] } }
                }

            }
        ])

        // console.log(cartItems,totalAmount[0].total);
        let orderAmount=totalAmount[0].total

        let cartItems=await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity'
                }
            },  
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'cartProduct'
                }
            },
            {
                $project: {
                    _id:0,quantity:1,cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            }
        ])
        
        console.log(cartItems)
        let products=[]
        
        cartItems.forEach((item)=>{
            products.push({
                productId:item.cartProduct._id,
                title:item.cartProduct.title,
                image:item.cartProduct.image[0],
                price:item.cartProduct.discounted_price,
                quantity:item.quantity
            })
        })

        // let products=[]
        // cartItems.products.forEach((item)=>{
        //     products.push({
        //         item:item.productId,
        //         quantity:item.quantity
        //     })
        // })
        // console.log(products)

        const newOrder=new orderModel({
            userId,
            shippingAddress,
            paymentMethod,
            products,
            orderAmount,
            status
        })

        const orderNew=await newOrder.save()

        if(orderNew){
            // cartItems.products=[]
            // cartItems.quantity=0
            // await cartItems.save()
            await cartModel.deleteOne({user:userId})
            req.session.cartCount=0    
            res.json({status:status})
        }

    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports={
    loadCheckout,
    placeOrder
}