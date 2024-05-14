var mongoose = require('mongoose');
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const walletModel=require('../models/walletModel')

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
        ]).sort({updatedAt:-1})

        // console.log(orders);

        res.render('orderSummery', { page: 'Orders', data: orders, id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {
        console.log(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
       
        const{orderId,productId,amount}=req.query
        console.log('orderId', orderId);
        console.log('productId', productId);
        console.log('amount', amount);

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

        let orderToBeCancelled=await orderModel.findOne({ _id: orderId, 'products.productId': productId })
        orderToBeCancelled.orderAmount-=parseInt(amount)
        orderToBeCancelled.save()   

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

            let wallet=await walletModel.findOne({userId:req.session.userId})
            if(wallet){
                wallet.amount+=parseInt(amount)
                wallet.transactions.unshift({
                    type:'credit',
                    amount:parseInt(amount),
                    date:Date.now()
                })
                wallet.save()
               console.log('wallet amount updated' );
            }else{
                let wallet= new walletModel({
                    userId,
                    amount:parseInt(amount),
                    transactions:[{
                        type:'credit',
                        amount:parseInt(amount),
                        date:Date.now()
                    }]
                })
                wallet.save()
                console.log('wallet created and updated');
                res.redirect('/wallet')
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