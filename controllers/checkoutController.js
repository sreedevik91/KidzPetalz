var mongoose = require('mongoose');
const cartModel = require('../models/cartModel')
const addressModel = require('../models/addressModel')
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { hasUncaughtExceptionCaptureCallback } = require('process');

var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })


const loadCheckout = async (req, res) => {
    try {

        let userId = req.session.userId

        let cartTotalAmount = await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity',
                    offerAmount: '$products.offerAmount'
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
                    product: 1, quantity: 1, offerAmount: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            },
            {
                $match: {
                    'cartProduct.is_listed': true
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$offerAmount'] } }
                }

            }
        ])



        let shippingAddress = await addressModel.aggregate([
            { $match: { userId: userId } },
            { $unwind: '$shippingAddress' },
            {
                $project: {
                    shippingAddress: 1
                }
            }
        ])

        let cartProducts = await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity',
                    offerAmount: '$products.offerAmount'
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
                    product: 1, quantity: 1, offerAmount: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            },
            {
                $project: {
                    product: 1, quantity: 1, amount: '$offerAmount', name: '$cartProduct.title'  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            }
        ])

        //    console.log('cartTotalAmount: ',cartTotalAmount[0]);
        //    console.log(shippingAddress[0]);
        // console.log('cartProducts: ', cartProducts);

        let cart=await cartModel.find({user: userId })

        res.render('checkout', { page: 'Checkout', data: shippingAddress,cartId:cart[0]._id, cartTotalAmount: cartTotalAmount[0].total, products: cartProducts, id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {

        console.log(error.message);

    }
}


const placeOrder = async (req, res) => {
    try {

        console.log(req.body)
        let userId = req.body.userId
        let shippingAddressId = req.body.shippingAddress
        let paymentMethod = req.body.paymentMethod
        let status = req.body.paymentMethod === 'cod' ? 'placed' : 'pending'

        // let cartItems = await cartModel.findOne({user: userId})
        let newShippingAddressId = new mongoose.Types.ObjectId(shippingAddressId)

        let order = await orderModel.findOne({ userId })
        console.log(order);

        let newShippingAddress = await addressModel.aggregate([
            { $match: { userId: userId } },
            { $unwind: '$shippingAddress' },
            {
                $project: {
                    shippingAddress: 1
                }
            },
            {
                $match: { 'shippingAddress._id': newShippingAddressId }
            },
            {
                $project: {
                    shippingAddress: 1, _id: 0
                }
            }
        ])

        // console.log(newShippingAddress[0]);
        let shippingAddress = newShippingAddress[0].shippingAddress


        let totalAmount = await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity',
                    offerAmount: '$products.offerAmount'
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
                    product: 1, quantity: 1, offerAmount: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$offerAmount'] } }
                }

            }
        ])

        // console.log(cartItems,totalAmount[0].total);

        console.log('Cart Total: ', totalAmount[0]);

        let orderAmount = totalAmount[0].total

        let cartItems = await cartModel.aggregate([
            { $match: { user: userId } },
            { $unwind: '$products' },
            {
                $project: {
                    product: '$products.productId',
                    quantity: '$products.quantity',
                    offerAmount: '$products.offerAmount',
                    offersApplied:'$offersApplied'
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
                    _id: 0, quantity: 1, offerAmount: 1,offersApplied:1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                }
            }
        ])

        console.log(cartItems)
        let products = []

        let stockAvailable = true
        //-----------------------------------------------------------------------------------------------------------------
        // if the stock is to be checked before checkout use the commented code

        // let product=await productModel.findOne({_id:item.cartProduct._id})
        // if(product.quantity<item.quantity){
        //     res.json({quantity:'lessQuantity'})
        // }else{
        //-----------------------------------------------------------------------------------------------------------------

        cartItems.forEach(async (item) => {

            products.push({
                productId: item.cartProduct._id,
                title: item.cartProduct.title,
                image: item.cartProduct.image[0],
                price: item.offerAmount,
                quantity: item.quantity,
                is_listed: true,
                status: status
            })


        })

        //-----------------------------------------------------------------------------------------------------------------

        // let products=[]
        // cartItems.products.forEach((item)=>{
        //     products.push({
        //         item:item.productId,
        //         quantity:item.quantity
        //     })
        // })
        // console.log(products)
        //-----------------------------------------------------------------------------------------------------------------

        let offersApplied=cartItems[0].offersApplied
        console.log('offersApplied: ',offersApplied);
        console.log('couponCode',req.session.couponCode);
        console.log('checkoutAmount',req.session.checkoutAmount);
        const newOrder = new orderModel({
            userId,
            shippingAddress,
            paymentMethod,
            products,
            orderAmount,
            offersApplied,
            couponCode: req.session.couponCode,
            discountAmount:req.session.discountAmount,
            checkoutAmount:req.session.checkoutAmount || orderAmount
            
        })

        const orderNew = await newOrder.save()
        console.log('new Order', orderNew);
        if (orderNew) {
            // cartItems.products=[]
            // cartItems.quantity=0
            // await cartItems.save()
            await cartModel.deleteOne({ user: userId })
            orderNew.products.forEach(async (item) => {
                await productModel.updateOne({ _id: item.productId }, { $inc: { ordered_quantity: 1 } })
            })
            req.session.cartCount = 0
            if (paymentMethod === 'cod') {
                res.json({ cod: true })
            } else {
                let amount= req.session.checkoutAmount || orderAmount
                let checkoutAmount = amount * 100
                var options = {
                    amount: checkoutAmount,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: orderNew._id
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log('Razorpay Error: ', err);
                    } else {
                        console.log('Razorpay Order: ', order);
                        res.json(order)
                    }
                });

            }
        }

        //-----------------------------------------------------------------------------------------------------------------

        // }

        //-----------------------------------------------------------------------------------------------------------------

    } catch (error) {
        console.log(error.message);

    }
}

const verifyPayment = async (req, res) => {
    try {
        console.log('payment and order details: ', req.body);
        let secret = process.env.RAZORPAY_KEY_SECRET
        let hash = crypto.createHmac('sha256', secret)
            .update(req.body.order.id +'|'+ req.body.payment.razorpay_payment_id)
            .digest('hex')
        console.log('hash: ',hash);
        console.log('signature: ',req.body.payment.razorpay_signature);
            let orderId=req.body.order.receipt
        if (hash === req.body.payment.razorpay_signature) {

            try {
                let orders=  await orderModel.findOne({_id:orderId})

          for (let product of orders.products){
            product.status='placed'
          }

         await orders.save()

          res.json({paymentSuccess:true})
            } catch (error) {
                console.log(error.message);
            }
          
        }

    } catch (error) {
        console.log(error.message);

    }
}

module.exports = {
    loadCheckout,
    placeOrder,
    verifyPayment
}