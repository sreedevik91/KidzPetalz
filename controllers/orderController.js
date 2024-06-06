var mongoose = require('mongoose');
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const walletModel=require('../models/walletModel')
const addressModel=require('../models/addressModel')

const pdf = require('pdf-creator-node');
var fs = require("fs");
var ejs = require("ejs");
const path = require('path');



const loadOrderSuccess = async (req, res) => {
    try {

        res.render('orderSuccess', { page: 'Order Placed', data: '', id: req.session.userId, message: '', cartCount: req.session.cartCount })

    } catch (error) {
        console.log(error);
    }
}

const loadOrderFailure = async (req, res) => {
    try {

        res.render('orderFailure', { page: 'Order Pending', data: '', id: req.session.userId, message: '', cartCount: req.session.cartCount })

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
//---------------------------------try pagination/ or bootstrap pagination---------------------------------------------
        // let page = parseInt(req.query.page)
        // // let sort = req.query.sort
        // let limit = 5
        // let skip=0;

        // if (page <= 1) {
        //     skip = 0
        // } else {
        //     skip = parseInt(page - 1) * limit
        // }
        // console.log('skip: ',Number(skip));
        // let orders = await orderModel.aggregate([
        //     { $match: { userId: { $eq: userId } } },
        //     { $unwind: '$products' }
        // ])
        // .sort({updatedAt:-1})
        // .skip(Number(skip))
        // .limit(limit)
        // .exec()

        // let count = await orderModel.aggregate([
        //     { $match: { userId: { $eq: userId } } },
        //     { $unwind: '$products' }
        // ]).countDocuments()

        // console.log('orders: ', orders);

        // res.render('orderSummery', { page: 'Orders', data: orders, id: req.session.userId, message: '', cartCount: req.session.cartCount,totalPages: Math.ceil(count / limit), currentPage: page, next: page + 1, previous: page - 1  })
//------------------------------------------------------------------------------

        let orders = await orderModel.aggregate([
            { $match: { userId: { $eq: userId } } },
            { $unwind: '$products' }
        ]).sort({orderDate:-1})
        // console.log('orders: ', orders);
        res.render('orderSummery', { page: 'Orders', data: orders, id: req.session.userId, message: '', cartCount: req.session.cartCount})


    } catch (error) {
        console.log(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
       
        const{orderId,productId,amount,quantity}=req.query
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
        orderToBeCancelled.orderAmount-=(parseInt(amount)*quantity)
        // (orderToBeCancelled.orderAmount <=0) ? 0 : orderToBeCancelled.orderAmount
        orderToBeCancelled.checkoutAmount-=(parseInt(amount)*quantity)
        // (orderToBeCancelled.checkoutAmount <=0) ? 0 : orderToBeCancelled.checkoutAmount
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

            let cancelledProduct=orders.products.filter((p)=>{
               return p.productId===productId
            })
            
            // console.log('cancelledProduct: ',cancelledProduct);
            if(cancelledProduct.status==='placed'){
                let wallet=await walletModel.findOne({userId:req.session.userId})
                if(wallet){
                    wallet.amount+=(parseInt(amount)*quantity)
                    wallet.transactions.unshift({
                        type:'credit',
                        amount:(parseInt(amount)*quantity),
                        date:Date.now()
                    })
                    wallet.save()
                   console.log('wallet amount updated' );
                }else{
                    let wallet= new walletModel({
                        userId,
                        amount:(parseInt(amount)*quantity),
                        transactions:[{
                            type:'credit',
                            amount:(parseInt(amount)*quantity),
                            date:Date.now()
                        }]
                    })
                    wallet.save()
                    console.log('wallet created and updated');
                    res.redirect('/wallet')
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
        //-------------------------------------------------------------------

    } catch (error) {
        console.log(error);

    }
}

const generateInvoice=async(req,res)=>{
    try {
    
        const {orderId,productId}=req.query
        const userId=req.session.userId
        console.log(orderId,productId);

        let orderedProduct=await orderModel.aggregate([
            {$match:{_id:new mongoose.Types.ObjectId(orderId)}},
            {$unwind:'$products'},
            {$match:{'products.productId':productId}},
            {$project:{
                product:'$products',
                shippingAddress:'$shippingAddress',
                price:'$products.price',
                orderDate:'$orderDate',
                offersApplied:'$products.offersApplied'
            }},
            {$unwind:'$offersApplied'},           
            {$addFields:{
                discountAmount:{$multiply:['$product.quantity','$offersApplied.discountAmount']},
                totalPrice:{$multiply:['$product.quantity','$price']}
            }},
            {$group:{_id:'$product.productId',productName:{$first:'$product.title'},unitPrice:{$first:'$price'},productId:{$first:'$product.productId'},price:{$first:'$totalPrice'},quantity:{$first:'$product.quantity'},totalDiscountAmount:{$sum:'$discountAmount'},orderDate:{$first:'$orderDate'},shippingAddress:{$first:'$shippingAddress'}}}  // $first will add value as key value pair

        ])

        let userAddress=await addressModel.findOne({userId})

        let billingAddress=userAddress.billingAddress

        console.log('billingAddress: ',billingAddress);

        let product=orderedProduct[0]
        console.log('orderedProduct: ',product);

        const template=fs.readFileSync('./views/templates/invoice.ejs','utf-8')
        // console.log(template);

        // const renderedHtml = ejs.render(template, { data:{
        //     product:product,
        //     billingAddress:billingAddress
        // }});

        console.log('template read');
        const options={
            format:'A4',
            orientation:'portrait',
            border:'10 mm',
            header: {
                height: '10mm',
            },
            footer: {
                height: '10mm',
            },
            type: 'pdf'
        }

        let data={
            product:product,
            billingAddress:billingAddress
        }

        const renderedHtml = ejs.render(template,data)

        const document={
            html:renderedHtml,
            data:data,
            // path:'public/invoice/sampleInvoice.pdf'
            path:`public/invoice/${productId}.pdf`
        }

       const invoice= await pdf.create(document,options)

    
    //  const document={
    //         html:renderedHtml,
    //         data:data,
    //         path:'public/invoice/sampleInvoice.pdf'
    //     }
    //    const invoice= await pdf.create(document,options)

    //    invoice.toFile('public/invoice/sampleInvoice.pdf')

       console.log('pdf created');

    //    console.log('response:',invoice);


        res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'attachment; filename="sampleInvoice.pdf"');
        res.setHeader('Content-Disposition', `attachment; filename='${productId}.pdf'`);

      
        console.log(invoice.filename);

        res.download(invoice.filename)

    } catch (error) {

     console.log(error.message)   
    }
}

const loadOrderDetails= async(req,res)=>{
    try {
        const {orderId,productId}=req.query
        // console.log(orderId,productId);

        // const orderedProduct=await orderModel.findOne({_id:orderId})

        // const product = orderedProduct.products.filter((product)=>{
        //     return product.productId===productId
        // })

        // const product=await productModel.findOne({_id:productId})
        // const unitPrice=product.price

        let orderedProduct=await orderModel.aggregate([
            {$match:{_id:new mongoose.Types.ObjectId(orderId)}},
            {$unwind:'$products'},
            {$match:{'products.productId':productId}},
        ])

        let ordProduct= orderedProduct[0]

        // ordProduct.unitPrice=unitPrice
        // ordProduct.save()

        console.log('orderedProduct: ', ordProduct);

        res.render('orderDetails', { page: 'Order Details', data: ordProduct, id: req.session.userId, message: '', cartCount: req.session.cartCount })


    } catch (error) {
     console.log(error.message)   
        
    }
}

module.exports = {
    loadOrders,
    loadOrderSuccess,
    cancelOrder,
    generateInvoice,
    loadOrderDetails,
    loadOrderFailure
}