var mongoose = require('mongoose');
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')

const loadOrderSuccess = async (req, res) => {
    try {

        res.render('orderSuccess', { page: 'Order Placed', data: '', id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {
        console.log(error);
    }
}


const loadOrders = async (req, res) => {
    try {

        let userId = req.session.userId
        // since one user has many orders we use find instead of findOne
        // let orders=await orderModel.find({userId:{$eq:userId}}) 
        // console.log(orders);

        let orders = await orderModel.aggregate([
            { $match: { userId: { $eq: userId } } },
            { $unwind: '$products' }
        ])

        // console.log(orders);

        res.render('orderSummery', { page: 'Orders', data: orders, id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {
        console.log(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.query.id
        const productId = req.query.productId
        // const {id,productId}=req.query
        console.log('orderId', orderId);
        console.log('productId', productId);

        //---------------if the cancelled order is to be removed from the list-----
        // let cancelOrder=await orderModel.updateOne({_id:orderId},{
        //     $pull:{
        //         products:{
        //             productId: productId
        //         }
        //     }
        // })

        // if(orders.products.length===0){
        // let cancelOrders=await orderModel.updateOne({_id:orderId},{$set:{status:'cancelled'}})
        // }

        //-----------------------------------------------------------------------------------------------

        let cancelOrder = await orderModel.updateOne({ _id: orderId, 'products.productId': productId }, {
            $set: {
                'products.$.is_listed': false,
                'products.$.status': 'cancelled'
            }

        })

        console.log('cancelOrder', cancelOrder);



        if (cancelOrder) {
            let orders = await orderModel.findOne({ _id: orderId })

            for (let product of orders.products) {
                if (product.is_listed === false) {
                    let updateProductQuantity = await productModel.updateOne({ _id: product.productId }, { $inc: { quantity: 1, ordered_quantity: -1 } })
                }
            }
            console.log('Order cancelled');
            res.redirect('/orders')
        } else {
            console.log('could not cancel');
        }

        //----------------------old code------------------------------------
        // let cancelOrders=await orderModel.updateOne({_id:orderId},{$set:{status:'cancelled'}})
        // let updateProductQuantity=await productModel.updateOne({_id:productId},{$inc:{quantity:1}})
        // res.redirect('/orders')

    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    loadOrders,
    loadOrderSuccess,
    cancelOrder
}