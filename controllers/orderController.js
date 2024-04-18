const orderModel = require('../models/orderModel')

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
        let orders=await orderModel.find({userId:{$eq:userId}})
        console.log(orders);
        
        
        res.render('orderSummery',{page: 'Orders', data:orders, id: req.session.userId, message: '', cartCount: req.session.cartCount })
        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadOrders,
    loadOrderSuccess
}