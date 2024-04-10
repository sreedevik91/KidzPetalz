const express = require('express')
const userRoute = express()
const router = express.Router()
const path = require('path')
const bodyparser = require('body-parser')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
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

router.get('/products', blocked.isBlocked,userController.loadProducts)

router.get('/boys',blocked.isBlocked, userController.loadBoys)

router.get('/girls',blocked.isBlocked, userController.loadGirls)

router.get('/product',blocked.isBlocked, userController.loadProduct)

router.get('/cart',blocked.isBlocked, cartController.loadCart)

router.post('/addToCart', cartController.addToCart)

router.get('/logout',auth.isLogin ,userController.logout)

// router.get('*',userController.loadError)

userRoute.use(router)

module.exports = userRoute

