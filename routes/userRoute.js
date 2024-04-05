const express=require('express')
const userRoute=express()
const router=express.Router()
const path=require('path')
const bodyparser=require('body-parser')
const userController=require('../controllers/userController')
const session=require('express-session')
const nocache=require('nocache');
const dotenv=require('dotenv')
const passport=require('passport')
require('../controllers/passport')


dotenv.config()

userRoute.use(bodyparser.json())
userRoute.use(bodyparser.urlencoded({extended:true}))
userRoute.use(express.static('public'));
userRoute.use(session({secret:process.env.KEY,cookie:{maxAge:600000},resave:false,saveUninitialized:false}))
userRoute.use(nocache());
userRoute.use(passport.initialize());
userRoute.use(passport.session());

userRoute.set('view engine','ejs')
userRoute.set('views','./views/user')

// Initiates the Google Login flow
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback URL for handling the Google Login response
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  // Successful authentication, redirect to the home page
  req.session.login=true
  res.redirect('/home');
});


router.route('/signup')
    .get(userController.loadRegistration)
    .post(userController.insertUser)

router.route('/login')
.get(userController.loadLogin)
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
.get(userController.loadResetPasswordEmail)
.post(userController.updateNewPassword)

router.get('/',userController.loadHome)

router.get('/home',userController.loadUserHome)


router.get('/products',userController.loadProducts)


router.get('/boys',userController.loadBoys)


router.get('/girls',userController.loadGirls)

router.get('/product',userController.loadProduct)

router.get('/logout',userController.logout)

// router.get('*',userController.loadError)

userRoute.use(router)

module.exports=userRoute