const express = require('express')
const userRoute = express()
const router = express.Router()
const path = require('path')
const bodyparser = require('body-parser')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const checkoutController = require('../controllers/checkoutController')
const orderController = require('../controllers/orderController')
const session = require('express-session')
const nocache = require('nocache');
const dotenv = require('dotenv')
const passport = require('passport')
require('../controllers/passport')
const auth=require('../middlewares/auth')
const blocked=require('../middlewares/block')

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
  // Successful authentication, redirect to the home page
  req.session.login = true
  res.redirect('/home');
});

router.route('/signup')
  .get(auth.isLogout, userController.loadRegistration)
  .post(userController.insertUser)

router.route('/login')
  .get(auth.isLogout,userController.loadLogin)
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

router.get('/',auth.isLogout,userController.loadHome)

router.get('/home',auth.isLogin,blocked.isBlocked,userController.loadUserHome)

router.get('/products',auth.isLogin, blocked.isBlocked,userController.loadProducts)

router.post('/products',auth.isLogin, blocked.isBlocked,userController.loadFilteredProducts)

router.get('/boys',auth.isLogin,blocked.isBlocked, userController.loadBoys)

router.get('/girls',auth.isLogin,blocked.isBlocked, userController.loadGirls)

router.get('/product',auth.isLogin,blocked.isBlocked, userController.loadProduct)

router.get('/cart',auth.isLogin,blocked.isBlocked, cartController.loadCart)

router.get('/addToCart',auth.isLogin, cartController.addToCart)

router.post('/changeProductQuantity',cartController.changeProductQuantity)

router.post('/removeCartProduct',cartController.removeCartProduct)

router.get('/checkout',auth.isLogin, checkoutController.loadCheckout)

router.get('/orders',auth.isLogin, orderController.loadOrders)

router.get('/orderSuccess',auth.isLogin, orderController.loadOrderSuccess)

router.get('/userProfile',auth.isLogin, userController.loadProfile)

router.route('/addAddress')
  .get(auth.isLogin,userController.loadAddAddress)
  .post(userController.addAddress)

router.route('/updateAddress')
  .get(auth.isLogin,userController.loadUpdateAddress)
  .post(userController.updateAddress)

router.route('/updateProfile')
  .get(auth.isLogin,userController.loadUpdateProfile)
  .post(userController.updateProfile)
  
router.get('/deleteAddress', userController.deleteAddress)

router.post('/placeOrder', checkoutController.placeOrder)

router.get('/logout',auth.isLogin ,userController.logout)

router.get('/blocked',userController.loadBlock)

// router.get('/goBackLogin',auth.isLogout,userController.goBackLogin404)

// router.get('*',userController.loadError)

userRoute.use(router)

module.exports = userRoute

