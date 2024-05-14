const express = require('express')
const userRoute = express()
const router = express.Router()
const path = require('path')
const bodyparser = require('body-parser')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const checkoutController = require('../controllers/checkoutController')
const orderController = require('../controllers/orderController')
const productController = require('../controllers/productController')
const walletController = require('../controllers/walletController')
const wishlistController = require('../controllers/wishlistController')
const couponController = require('../controllers/couponController')
const session = require('express-session')
const nocache = require('nocache');
const dotenv = require('dotenv')
const passport = require('passport')
require('../controllers/passport')
const auth = require('../middlewares/auth')
const blocked = require('../middlewares/block')
const Razorpay = require('razorpay');


dotenv.config()

userRoute.use(bodyparser.json())
userRoute.use(bodyparser.urlencoded({ extended: true }))
userRoute.use(express.static('public'));
userRoute.use(session({ secret: process.env.KEY, cookie: { maxAge: 600000 }, resave: false, saveUninitialized: false }))
userRoute.use(nocache());
userRoute.use(passport.initialize());
userRoute.use(passport.session());


userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/user')

// Initiates the Google Login flow
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback URL for handling the Google Login response
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  try {
    // Successful authentication, redirect to the home page

    // req.session.user = user || googleUser || result
    // req.session.userId = user._id || googleUser._id || result._id

    const user = req.user
    console.log(user.name);
    req.session.login = true
    req.session.user = user
    console.log('user login: ', req.session.login);
    res.redirect('/home');
  } catch (error) {
    console.log('Google auth error: ', error.message);
  }
});

router.route('/signup')
  .get(auth.isLogout, userController.loadRegistration)
  .post(userController.insertUser)

router.route('/login')
  .get(auth.isLogout, userController.loadLogin)
  .post(userController.verifyLogin)

router.route('/submitOtp')
  .post(userController.verifyUser)

router.route('/resendOtp')
  .get(userController.resendOtp)

router.route('/verifyEmail')
  .get(userController.loadVerifyEmail)
  .post(userController.verifyEmail)

router.route('/forgotPassword')
  .get(userController.loadForgotPasswordEmail)
  .post(userController.verifyForgotPasswordEmail)

router.route('/resetPassword')
  .get(userController.loadResetPassword)
  .post(userController.updateNewPassword)

router.route('/changePassword')
  .get(userController.loadChangePassword)
  .post(userController.changePassword)

router.get('/', auth.isLogout, userController.loadHome)

router.get('/home', auth.isLogin, blocked.isBlocked, userController.loadUserHome)

router.route('/products')
  .get(auth.isLogin, blocked.isBlocked, productController.loadProducts)
  .post(auth.isLogin, blocked.isBlocked, productController.loadFilteredProducts)

router.get('/product', auth.isLogin, blocked.isBlocked, productController.loadProduct)

router.get('/boys', auth.isLogin, blocked.isBlocked, productController.loadBoys)

router.get('/girls', auth.isLogin, blocked.isBlocked, productController.loadGirls)

router.post('/search', auth.isLogin, blocked.isBlocked, productController.searchProduct)

router.get('/searchedProducts', auth.isLogin, blocked.isBlocked, productController.loadSearchedProductsPage)

router.get('/cart', auth.isLogin, blocked.isBlocked, cartController.loadCart)

router.get('/addToCart', auth.isLogin, cartController.addToCart)

router.post('/changeProductQuantity', cartController.changeProductQuantity)

router.post('/removeCartProduct', cartController.removeCartProduct)

router.get('/checkout', auth.isLogin, checkoutController.loadCheckout)

router.get('/orders', auth.isLogin, orderController.loadOrders)

router.get('/orderSuccess', auth.isLogin, orderController.loadOrderSuccess)

router.get('/cancelOrder', auth.isLogin, orderController.cancelOrder)

router.get('/userProfile', auth.isLogin, userController.loadProfile)

router.route('/addAddress')
  .get(auth.isLogin, userController.loadAddAddress)
  .post(userController.addAddress)

router.route('/updateAddress')
  .get(auth.isLogin, userController.loadUpdateAddress)
  .post(userController.updateAddress)

router.get('/deleteAddress', userController.deleteAddress)

router.route('/updateProfile')
  .get(auth.isLogin, userController.loadUpdateProfile)
  .post(userController.updateProfile)

router.route('/wallet')
  .get(auth.isLogin, walletController.loadWallet)
  .post(walletController.updateWallet)

router.get('/wishlist', auth.isLogin, wishlistController.loadWishlist)
router.get('/updateWishlist', auth.isLogin, wishlistController.updateWishlist)
router.get('/removeWishlist', auth.isLogin, wishlistController.removeWishlist)

router.get('/coupons', auth.isLogin, couponController.loadCoupon)
router.get('/applyCoupon', couponController.applyCoupon)

router.post('/placeOrder', checkoutController.placeOrder)

router.post('/verifyPayment', checkoutController.verifyPayment)

router.get('/logout', auth.isLogin, userController.logout)

router.get('/blocked', userController.loadBlock)

// router.get('/goBackLogin',auth.isLogout,userController.goBackLogin404)

// router.get('*',userController.loadError)

userRoute.use(router)

module.exports = userRoute

