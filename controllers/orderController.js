var mongoose = require('mongoose');
const orderModel = require('../models/orderModel')
const productModel=require('../models/productModel')

const loadOrderSuccess=async (req,res)=>{
    try {
        
        res.render('orderSuccess',{page: 'Order Placed', data:'', id: req.session.userId, message: '', cartCount: req.session.cartCount })
        
    } catch (error) {
        console.log(error);
    }
}


const loadOrders=async (req,res)=>{
    try {
        
        let userId=req.session.userId
        let orders=await orderModel.find({userId:{$eq:userId}}) // since one user has many orders we use find instead of findOne
        console.log(orders);
        
        res.render('orderSummery',{page: 'Orders', data:orders, id: req.session.userId, message: '', cartCount: req.session.cartCount })
        
    } catch (error) {
        console.log(error);
    }
}

const cancelOrder=async(req,res)=>{
    try {
        const orderId=req.query.id
        let orders=await orderModel.findOne({_id:orderId})
        console.log(orders.products);

        for(let product of orders.products){
            let updateProductQuantity=await productModel.updateOne({_id:product.productId},{$inc:{quantity:1}})
        }

        let cancelOrders=await orderModel.updateOne({_id:orderId},{$set:{status:'cancelled'}})
        res.redirect('/orders')
        // let cancelOrders=await orderModel.updateOne({_id:orderId},{$set:{status:'cancelled'}})
        // let updateProductQuantity=await productModel.updateOne({_id:productId},{$inc:{quantity:1}})
        // res.redirect('/orders')

    } catch (error) {
        console.log(error);
        
    }
}

module.exports={
    loadOrders,
    loadOrderSuccess,
    cancelOrder
}