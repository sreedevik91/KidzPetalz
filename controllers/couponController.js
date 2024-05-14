const couponModel=require('../models/couponModel')
const productModel=require('../models/productModel')
const cartModel=require('../models/cartModel')
var mongoose = require('mongoose');



const loadCoupon=async(req,res)=>{
    try {
        let coupon=await couponModel.find({valid_till:{$gte:Date.now()}})

        if(coupon){
            res.render('coupons', { page: 'Coupon', data:coupon, id: req.session.userId, name: req.session.user.name, message: '', cartCount: req.session.cartCount })
            }else{
            res.render('coupons', { page: 'Coupon', data: '', id: req.session.userId, name: req.session.user.name, message: 'No valid coupons available', cartCount: req.session.cartCount })
            }
    } catch (error) {
        console.log(error.message);
        
    }
}

const applyCoupon=async(req,res)=>{
    try {
        const {cartId,couponCode,cartTotalAmount}=req.query
        console.log(req.query);
        console.log(cartId,'|',couponCode ,'|', cartTotalAmount);
        const cart=await cartModel.findOne({_id:cartId})
        const coupon= await couponModel.findOne({code:couponCode})
        // console.log('cart:',cart);
        console.log('validTill:',coupon.valid_till);

        if(coupon && cartTotalAmount>=coupon.minPurchase && coupon.valid_till>= Date.now()){

            let checkoutAmount=cartTotalAmount-coupon.discountAmount
            req.session.couponCode=couponCode
            req.session.discountAmount=coupon.discountAmount
            req.session.checkoutAmount=checkoutAmount

            res.json({valid:true,amount:checkoutAmount,discount:coupon.discountAmount})

        }else{
            res.json({valid:false})
        }

    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    loadCoupon,
    applyCoupon
}