var mongoose = require('mongoose');
const wishlistModel = require('../models/wishlistModel');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');


const loadWishlist = async (req, res) => {
    try {
        let userId = req.session.userId

        let wishlist = await wishlistModel.findOne({ userId })

        if (wishlist) {
            let wishlistItems = await wishlistModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                { $unwind: '$products' },
                {
                    $project: {
                        product: '$products.productId',
                        quantity: '$quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'wishlistItem'

                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$wishlistItem', 0] }, quantity: '$quantity'
                    }
                },
                {
                    $project: {
                        productId: '$product._id', name: '$product.title', price: '$product.discounted_price', quantity: 1, image: '$product.image'
                    }
                }

            ])
            console.log('wishlistItems: ', wishlistItems);
            res.render('wishlist', { page: 'Wishlist', data: wishlistItems, quantity: wishlist.quantity, id: req.session.userId, message: '', cartCount: req.session.cartCount })

        } else {
            res.render('wishlist', { page: 'Wishlist', data: '', id: req.session.userId, message: 'Your wishlist is empty', cartCount: req.session.cartCount })

        }

    } catch (error) {
        console.log(error.message);
    }
}


const updateWishlist = async (req, res) => {
    try {
        const { productId } = req.query
        const userId = req.session.userId
        let product = await productModel.findOne({ _id: productId })
        let stock = product.quantity

        if (stock <= 0) {
            product.quantity = 0
            await product.save()
            res.json({ outOfStock: true })
        } else {
            let wishlist = await wishlistModel.findOne({ userId })
            if (wishlist) {
                let isProduct = await wishlistModel.aggregate([
                    {
                        $project: {
                            index: {
                                $indexOfArray: ['$products.productId', new mongoose.Types.ObjectId(productId)]
                            }
                        }
                    }
                ])

                if (isProduct[0].index != -1) {
                    let index = isProduct[0].index
                    wishlist.products.splice(index, 1)
                    wishlist.quantity -= 1
                    if (wishlist.quantity < 0) {
                        wishlist.quantity = 0
                    }
                    await wishlist.save()
                    product.is_wishListed = false
                    await product.save()
                    res.json({ productExists: true})
                    console.log('product exists');
                } else {
                    wishlist.products.push({ productId })
                    wishlist.quantity += 1
                    await wishlist.save()
                    product.is_wishListed = true
                    await product.save()
                    res.json({ productExists: false})
                    console.log('product does not exists');

                }

            } else {
                let wishlist = new wishlistModel({
                    userId,
                    products: [{ productId: productId }]
                })
                await wishlist.save()
                product.is_wishListed = true
                await product.save()
                res.json({ wishlistCreated: true})
                console.log('wishlist created');

            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


const removeWishlist = async (req, res) => {
    try {
        const { productId } = req.query
        console.log('productId: ',productId);
        const userId = req.session.userId
        console.log('userId: ',userId);
      
        let wishlist = await wishlistModel.findOne({ userId })

        let wishlistUpdate=await wishlistModel.updateOne({userId:userId,'products.productId': productId},{
            $pull:{products:{productId}},
            $inc:{quantity:-1}
        })
        console.log('wishlistUpdate: ',wishlistUpdate);
      
        if (wishlist.quantity < 0) {
            wishlist.quantity = 0
        }
        await wishlist.save()

        let product = await productModel.updateOne({ _id: productId },{
            $set:{is_wishListed:false}
        })

        console.log('product: ',product);

        res.json({ wishlistRemoved: true})

    } catch (error) {
        console.log(error.message);

    }
}




module.exports = {
    loadWishlist,
    updateWishlist,
    removeWishlist
}