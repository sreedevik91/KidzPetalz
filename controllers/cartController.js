var mongoose = require('mongoose');
const cartModel = require('../models/cartModel')




const loadCart = async (req, res) => {
    try {
        let user = req.session.userId
        console.log(new mongoose.Types.ObjectId(user));
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
            let cartItems = await cartModel.aggregate([
                { $match: { user: user } },
                {
                    $lookup: {

                        from: 'products',
                        let: {
                            prodArray: '$products'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: [
                                            '$_id', '$$prodArray'
                                        ]
                                    }

                                }
                            }
                        ],
                        as: 'cartProducts'
                    }
                }

            ])

            console.log(cartItems[0].cartProducts);

            res.render('cart', { page: 'Cart', data: cartItems[0].cartProducts, id: req.session.userId, message: '' })
        } else {
            res.render('cart', { page: 'Cart', data:[], id: req.session.userId, message: 'Your cart is empty' })
        }


    } catch (error) {

        console.log(error.message);

    }
}

const addToCart = async (req, res) => {

    try {

        const user = req.session.userId
        const product = req.body.productId
        console.log(product);
        const cart = await cartModel.findOne({ user })
        if (cart) {
            const cartUpdated = await cartModel.updateOne({ user },
                {
                    $push: { products: product },
                    $inc: { quantity: 1 }
                })
            if (cartUpdated) {
                console.log('cart updated');
            } else {
                console.log('could not update cart');
            }
        } else {
            const cartData = new cartModel({
                user,
                products: [product]

            })

            const cart = await cartData.save()
            if (cart) {
                console.log(`added to cart: ${cart}`);
            } else {
                console.log('add to cart failed');
            }
        }

    } catch (error) {
        console.log(error.message);

    }
}

module.exports = {
    loadCart,
    addToCart
}