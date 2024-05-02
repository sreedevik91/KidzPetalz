var mongoose = require('mongoose');
const cartModel=require('../models/cartModel')
const addressModel=require('../models/addressModel')
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')

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
        
        let cartProducts = await cartModel.aggregate([
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
                $project: {
                    product: 1, quantity: 1, amount: '$cartProduct.discounted_price',name:'$cartProduct.title'  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            }
        ])

    //    console.log(cartTotalAmount[0]);
    //    console.log(shippingAddress[0]);
    console.log(cartProducts);


        res.render('checkout',{page: 'Checkout', data:shippingAddress,cartTotalAmount:cartTotalAmount[0].total,products:cartProducts, id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {

        console.log(error.message);
        
    }
}


const placeOrder= async (req,res)=>{
    try {

        console.log(req.body)
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

        let stockAvailable=true

        // if the stock is to be checked before checkout use the commented code

        // let product=await productModel.findOne({_id:item.cartProduct._id})
        // if(product.quantity<item.quantity){
        //     res.json({status:'lessQuantity'})
        // }else{
            cartItems.forEach(async (item)=>{
      
                products.push({
                    productId:item.cartProduct._id,
                    title:item.cartProduct.title,
                    image:item.cartProduct.image[0],
                    price:item.cartProduct.discounted_price,
                    quantity:item.quantity,
                    is_listed:true,
                    status:status
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
            orderAmount
        })

        const orderNew=await newOrder.save()
        console.log('new Order', orderNew);
        if(orderNew){
            // cartItems.products=[]
            // cartItems.quantity=0
            // await cartItems.save()
            await cartModel.deleteOne({user:userId})
            orderNew.products.forEach(async (item)=>{
            await productModel.updateOne({_id:item.productId},{$inc:{ordered_quantity:1}})
            })
            req.session.cartCount=0    
            res.json({status:status})
        }


        // }

       

    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports={
    loadCheckout,
    placeOrder
}