var mongoose = require('mongoose');
const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const categoryOfferModel = require('../models/categoryOfferModel');
const productOfferModel = require('../models/productOfferModel');
const referralOfferModel = require('../models/referralOfferModel');

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
                        quantity: '$products.quantity',
                        offerAmount: '$products.offerAmount',
                        unitPrice: '$products.unitPrice',
                        offersApplied: '$products.offersApplied'
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
                        product: 1, quantity: 1, offerAmount: 1, unitPrice: 1, offersApplied: 1, cartProduct: { $arrayElemAt: ['$cartProduct', 0] }  // this is to get the product object from the cartProduct array,['$cartProduct',0] this will take cartProduct array's 0 index element, cartProduct array will be having only one product according to the mentioned product ID
                    }
                },
                {
                    $addFields: { totalAmount: { $multiply: ['$quantity', '$offerAmount'] } }
                }

            ])

            let cartTotalAmount = await cartModel.aggregate([
                { $match: { user: user } },
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
                        total: { $sum: { $multiply: ['$quantity', '$offerAmount'] } },

                    }

                }
            ])
            for (let item of cartItems) {
                let discountAmount = 0
                for (let offer of item.offersApplied) {
                    discountAmount += parseFloat(offer.discountAmount)
                }
                item.discount = Number(discountAmount)
            }


            let totalDiscount = 0
            let totalPrice = 0
            for (let item of cartItems) {
                totalDiscount += parseFloat(item.discount) * item.quantity
                totalPrice += parseFloat(item.unitPrice) * item.quantity
            }

            // console.log('cartItems products: '+ cartItems[0].cartProducts[0].title);
            let cartTotal = (cartTotalAmount[0].total)

            console.log('cartItems:', cartItems);
            console.log('cartTotalAmount:', cartTotal);
            console.log('totalDiscount:', totalDiscount);
            console.log('totalPrice:', totalPrice);

            res.render('cart', { page: 'Cart', data: cartItems, cartTotalAmount: cartTotal, totalDiscount, totalPrice, id: req.session.userId, message: '', cartCount: req.session.cartCount })
        } else {
            req.session.cartCount = parseInt(0)
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

        console.log('product to cart:', product);

        const products = await productModel.findOne({ _id: product })
        console.log('products: ', products);
        let stock = products.quantity
        console.log('stock: ', stock);

        const cart = await cartModel.findOne({ user })
        console.log('cart:',cart);

        // console.log('productOffers: ', cart.products.offersApplied);

        if (stock <= 0) {
            // let productUpdated = await productModel.updateOne({ _id: product }, { $set:{quantity:0} })
            products.quantity = 0
            await products.save()
            res.json('Product is out of stock')

        } else {

            if (cart) {
                
                let isProduct = await cartModel.aggregate([
                    {$match:{user:user}},
                    {
                        $project: {
                            index: {
                                $indexOfArray: ['$products.productId', new mongoose.Types.ObjectId(product)] // while using aggregation 
                            }
                        }
                    }
                ])

                // let isProduct = await cartModel.aggregate([
                //     {$unwind:'$products'},
                //     {
                //         $match: {'products.productId':new mongoose.Types.ObjectId(product)}
                //     }
                // ])

                // console.log(`isProduct:${isProduct[0].index}`);
                console.log('isProduct: ',isProduct);
            
                if (isProduct[0].index != -1) {
                    let cartUpdated
                    let productUpdated
                    cartUpdated = await cartModel.updateOne({ user, 'products.productId': product },
                        {

                            $inc: { 'products.$.quantity': 1, quantity: 1 }
                        })

                    productUpdated = await productModel.updateOne({ _id: product }, { $inc: { quantity: -1 } })
                    console.log('cartUpdated:', cartUpdated);

                    if (cartUpdated) {
                        console.log('cart number updated');
                        let cart = await cartModel.findOne({ user })
                        req.session.cartCount = cart.quantity
                        res.json({ update: true })
                    } else {
                        console.log('could not update cart');
                    }
                } else {

                    let cartUpdated
                    let productUpdated

                    let finalAmount = products.price
                    let appliedOffers = []

                    let categoryId = products.category_id
                    let catId = categoryId.toString()
                    console.log('categoryId: ', catId);
                    let isCatOffer = await categoryOfferModel.aggregate([
                        {
                            $project: {
                                index: {
                                    $indexOfArray: ['$categories', catId]
                                }
                            }
                        }
                    ])

                    console.log('isCatOffer: ', isCatOffer[0].index);


                    if (isCatOffer[0].index != -1) {
                        let categoryOffer = await categoryOfferModel.findOne({ categories: { $in: [catId] } })
                        console.log('categoryOffer: ', categoryOffer);
                        if (categoryOffer.valid_till >= Date.now()) {
                            let discountAmount = (finalAmount * (categoryOffer.offerPercentage)) / 100
                            finalAmount -= discountAmount
                            appliedOffers.push({ name: categoryOffer.name, type: 'categoryOffer', productId: product, discountAmount: discountAmount, offerId: categoryOffer._id })
                        } else {

                        }
                    }

                    let isProdOffer = await productOfferModel.aggregate([
                        {
                            $project: {
                                index: {
                                    $indexOfArray: ['$products', product]
                                }
                            }
                        }
                    ])

                    console.log('isProdOffer: ', isProdOffer[0].index);

                    if (isProdOffer[0].index != -1) {
                        let productOffer = await productOfferModel.findOne({ products: { $in: [product] } })
                        console.log('productOffer: ', productOffer);
                        if (productOffer.valid_till >= Date.now()) {

                            let discountAmount = (finalAmount * (productOffer.offerPercentage)) / 100
                            finalAmount -= discountAmount
                            appliedOffers.push({ name: productOffer.name, type: 'productOffer', productId: product, discountAmount: discountAmount, offerId: productOffer._id })

                        } else {

                        }

                    }

                    console.log('finalAmount: ', finalAmount);

                    cartUpdated = await cartModel.updateOne({ user },
                        {
                            $push: { products: { productId: product, offerAmount: finalAmount, offersApplied: appliedOffers, unitPrice: products.price } },
                            $inc: { quantity: 1 },
                            // $set: { offersApplied: concatedOfferArrays }
                        })
                    productUpdated = await productModel.updateOne({ _id: product }, { $inc: { quantity: -1 } })

                    if (cartUpdated) {
                        console.log('cart item pushed');
                        let cart = await cartModel.findOne({ user })
                        req.session.cartCount = cart.quantity
                        res.json({ update: true })
                    } else {
                        console.log('could not update cart');
                    }
                }



            } else {

                let appliedOffers = []
                let finalAmount = products.price

                let categoryId = products.category_id
                let catId = categoryId.toString()
                let isCatOffer = await categoryOfferModel.aggregate([
                    {
                        $project: {
                            index: {
                                $indexOfArray: ['$categories', catId]
                            }
                        }
                    }
                ])

                console.log('isCatOffer:', isCatOffer[0].index);


                if (isCatOffer[0].index != -1) {
                    let categoryOffer = await categoryOfferModel.findOne({ categories: { $in: [catId] } })
                    console.log('categoryOffer: ', categoryOffer);
                    if (categoryOffer.valid_till >= Date.now()) {

                        let discountAmount = (finalAmount * (categoryOffer.offerPercentage)) / 100
                        finalAmount -= discountAmount
                        appliedOffers.push({ name: categoryOffer.name, type: 'categoryOffer', productId: product, discountAmount: discountAmount, offerId: categoryOffer._id })

                    } else {

                    }
                }



                let isProdOffer = await productOfferModel.aggregate([
                    {
                        $project: {
                            index: {
                                $indexOfArray: ['$products', product]
                            }
                        }
                    }
                ])

                console.log('isProdOffer:', isProdOffer[0].index);


                if (isProdOffer[0].index != -1) {
                    let productOffer = await productOfferModel.findOne({ products: { $in: [product] } })
                    console.log('productOffer: ', productOffer);
                    if (productOffer.valid_till >= Date.now()) {

                        let discountAmount = (finalAmount * (productOffer.offerPercentage)) / 100
                        finalAmount -= discountAmount
                        appliedOffers.push({ name: productOffer.name, type: 'productOffer', productId: product, discountAmount: discountAmount, offerId: productOffer._id })

                    } else {

                    }

                }


                console.log('finalAmount: ', finalAmount);
                console.log('appliedOffers: ', appliedOffers);


                const cartData = new cartModel({
                    user,
                    products: [{ productId: product, offerAmount: finalAmount, offersApplied: appliedOffers, unitPrice: products.price }],

                })

                const cart = await cartData.save()

                if (cart) {

                    let productUpdated = await productModel.updateOne({ _id: product }, { $inc: { quantity: -1 } })
                    console.log(`added to cart: ${cart}`);
                    req.session.cartCount = cart.quantity
                    res.json({ update: true })
                } else {
                    console.log('add to cart failed');
                }
            }

        }

    } catch (error) {
        console.log(error.message);

    }
}

const changeProductQuantity = async (req, res) => {

    try {

        const { cartId, productId, count, quantity } = req.body
        // console.log('count',count);
        // console.log('cartId',cartId);
        // console.log('quantity',quantity);
        // console.log('productId',productId);
        const products = await productModel.findOne({ _id: productId })
        let stock = products.quantity
        console.log('stock', stock);
        if (stock < count) {
            res.json({ lessStock: true })
        }
        if (stock <= 0) {
            let productUpdated = await productModel.updateOne({ _id: productId }, { $set: { quantity: 0 } })

            res.json({ outOfStock: true })
        }

        if (quantity == 1 && count == -1) {
            console.log('entered 1st');
            console.log('cartId:', cartId);
            let pullItem = await cartModel.updateOne({ _id: cartId },
                {
                    $pull: {
                        products: {
                            productId: productId
                        }
                    },
                    $inc: { quantity: -1 }
                })

            console.log(`pullItem: ${pullItem}`);

            if (pullItem) {
                let productUpdated = await productModel.updateOne({ _id: productId }, { $inc: { quantity: 1 } })
                let cart = await cartModel.findOne({ _id: cartId })
                if (cart.quantity <= 0) {
                    await cartModel.deleteOne({ _id: cartId })
                    req.session.cartCount = 0
                    res.json({ itemRemoved: true })
                } else {
                    req.session.cartCount = cart.quantity
                    res.json({ itemRemoved: true })
                }

            }
        } else if (quantity == 10 && count == 1) {
            res.json({ maxLimit: true })
            console.log('entered 2nd');

        } else {
            console.log('entered 3rd');


            let cartUpdated = await cartModel.updateOne({ _id: cartId, 'products.productId': productId },
                {

                    $inc: { 'products.$.quantity': count, quantity: count }
                })

            if (cartUpdated) {
                if (count == 1) {
                    let productUpdated = await productModel.updateOne({ _id: productId }, { $inc: { quantity: -1 } })
                } else {
                    let productUpdated = await productModel.updateOne({ _id: productId }, { $inc: { quantity: 1 } })
                }
                let cart = await cartModel.findOne({ _id: cartId })
                req.session.cartCount = cart.quantity
                res.json('quantity updated')
            }
        }


    } catch (error) {
        console.log(error.message);

    }

}

const removeCartProduct = async (req, res) => {
    try {

        const { cartId, productId } = req.body
        console.log(cartId, productId);

        let cartCount = await cartModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(cartId) } },
            { $unwind: '$products' },
            { $match: { 'products.productId': new mongoose.Types.ObjectId(productId) } },
            {
                $project: {
                    quantity: '$products.quantity', _id: 0
                }
            }
        ])
        console.log('cartCount: ', cartCount[0].quantity);
        let count = cartCount[0].quantity

        let pullItem = await cartModel.updateOne({ _id: cartId },
            {
                $pull: {
                    products: {
                        productId: productId
                    }
                },
                $inc: { quantity: -count }
            })
        console.log(pullItem);

        if (pullItem) {
            let productUpdated = await productModel.updateOne({ _id: productId }, { $inc: { quantity: 1 } })
            let cart = await cartModel.findOne({ _id: cartId })
            if (cart.quantity <= 0) {
                await cartModel.deleteOne({ _id: cartId })
                req.session.cartCount = 0
                res.json('Cart Cleared')
            } else {
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