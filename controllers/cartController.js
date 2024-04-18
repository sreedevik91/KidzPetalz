var mongoose = require('mongoose');
const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');



const loadCart = async (req, res) => {
    try {
        let user = req.session.userId
        // console.log(new mongoose.Types.ObjectId(user));

        // let cart =await cartModel.findOne({user:user})
        // console.log(cart);
        //------------------------------------------------
        // when use match make sure both the id's are of same type, ie, $match one string and one objectId would return null.
        // here usrId saved in session is string so in the cart schema save user as type string not as objectId
        //use below codes to create objectId
        // var mongoose = require('mongoose'); 
        // var id = new mongoose.Types.ObjectId('4edd40c86762e0fb12000003');
        //------------------------------------------------
        const cart = await cartModel.findOne({ user })
       
        if (cart) {
            req.session.cartCount = cart.quantity
            let cartItems = await cartModel.aggregate([
                { $match: { user: user } },
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
                    $addFields: { totalAmount: { $multiply: ['$quantity', '$cartProduct.discounted_price'] } }
                }

                // {
                //     $lookup: {

                //         from: 'products',
                //         let: {
                //             prodArray: '$products'
                //         },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {
                //                         $in: [
                //                             '$_id', '$$prodArray.productId'
                //                         ]
                //                     }

                //                 }
                //             }
                //         ],
                //         as: 'cartProducts'
                //     }
                // }

            ])

            let cartTotalAmount = await cartModel.aggregate([
                { $match: { user: user } },
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
            // console.log(cartItems,cartTotalAmount);
            // console.log('cartItems products: '+ cartItems[0].cartProducts[0].title);

            res.render('cart', { page: 'Cart', data: cartItems, cartTotalAmount:cartTotalAmount[0].total, id: req.session.userId, message: '', cartCount: req.session.cartCount })
        } else {
            req.session.cartCount=parseInt(0)
            res.render('cart', { page: 'Cart', data: [], id: req.session.userId, message: 'Your cart is empty', cartCount: req.session.cartCount })
        }


    } catch (error) {

        console.log(error.message);

    }
}

const addToCart = async (req, res) => {

    try {

        const user = req.session.userId
        const product = req.query.productId

        // console.log(product);
        const cart = await cartModel.findOne({ user })
        if (cart) {
            const isProduct = await cartModel.aggregate([
                {
                    $project: {
                        index: {
                            $indexOfArray: ['$products.productId', new mongoose.Types.ObjectId(product)] // while using aggregation 
                        }
                    }
                }
            ])

            console.log(`isProduct:${isProduct[0].index}`);
            let cartUpdated
            if (isProduct[0].index != -1) {

                cartUpdated = await cartModel.updateOne({ user, 'products.productId': product },
                    {

                        $inc: { 'products.$.quantity': 1, quantity: 1 }
                    })
                if (cartUpdated) {
                    console.log('cart updated');
                    let cart = await cartModel.findOne({ user })
                    req.session.cartCount = cart.quantity
                    res.json({ update: true })
                } else {
                    console.log('could not update cart');
                }
            } else {
                cartUpdated = await cartModel.updateOne({ user },
                    {
                        $push: { products: { productId: product } },
                        $inc: { quantity: 1 }
                    })
            }

            if (cartUpdated) {
                console.log('cart updated');
                let cart = await cartModel.findOne({ user })
                req.session.cartCount = cart.quantity
                res.json({ update: true })
            } else {
                console.log('could not update cart');
            }
        } else {
            const cartData = new cartModel({
                user,
                products: [{ productId: product }]

            })

            const cart = await cartData.save()
            if (cart) {
                console.log(`added to cart: ${cart}`);
                req.session.cartCount = cart.quantity
                res.json({ update: true })
            } else {
                console.log('add to cart failed');
            }
        }

    } catch (error) {
        console.log(error.message);

    }
}

const changeProductQuantity = async (req, res) => {

    try {

        const { cartId, productId, count, quantity } = req.body
        // console.log(quantity,cartId,count);
        if (quantity == 1 && count == -1) {
            console.log('entered 1st');
            let pullItem = await cartModel.updateOne({ _id: cartId },
                {
                    $pull: {
                        products: {
                            productId: productId
                        }
                    },
                    $inc: { quantity: -1 }
                })

            console.log(`pullItem: ${pullItem[0]}`);

            if (pullItem) {
                let cart = await cartModel.findOne({ _id: cartId })
                req.session.cartCount = cart.quantity
                res.json({ itemRemoved: true })
            }
        } else if (quantity == 10 && count == 1) {
            res.json({ maxLimit: true })
            console.log('entered 2nd');

        } else {
            console.log('entered 3rd');

            // cartUpdatedTotal = await cartModel.updateOne({ _id: cartId },
            //     {
            //         $inc: { quantity: count }
            //     })

            cartUpdated = await cartModel.updateOne({ _id: cartId, 'products.productId': productId },
                {

                    $inc: { 'products.$.quantity': count, quantity: count }
                })


        }

        if (cartUpdated) {
            let cart = await cartModel.findOne({ _id: cartId })
            req.session.cartCount = cart.quantity
            res.json('quantity updated')
        }
    } catch (error) {
        console.log(error.message);

    }

}

const removeCartProduct = async (req, res) => {
    try {

        const { cartId, productId } = req.body
        console.log(cartId, productId);

        let pullItem = await cartModel.updateOne({ _id: cartId },
            {
                $pull: {
                    products: {
                        productId: productId
                    }
                },
                $inc: { quantity: -1 }
            })
        console.log(pullItem);

        if (pullItem) {
            let cart = await cartModel.findOne({ _id: cartId })
            if(cart.quantity<=0){
            await cartModel.deleteOne({ _id: cartId})
            req.session.cartCount = 0
            res.json('Cart Cleared')
            }else{
                req.session.cartCount = cart.quantity
                res.json('Product Removed')
            }

        }

    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    loadCart,
    addToCart,
    changeProductQuantity,
    removeCartProduct
}