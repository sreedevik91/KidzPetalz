const express=require('express')
const adminRoute=express()
const router=express.Router()
const path=require('path')
const bodyparser=require('body-parser')
const adminController=require('../controllers/adminController')
const session=require('express-session')
const nocache=require('nocache');
const dotenv=require('dotenv')
const multer=require('multer')
const sharp = require('sharp');
const Cropper=require('cropperjs')


dotenv.config()

// adminRoute.use(bodyparser.json())
// adminRoute.use(bodyparser.urlencoded({extended:true}))
adminRoute.use(express.json({limit:'10mb'}))
adminRoute.use(express.urlencoded({extended:true}))
adminRoute.use(express.static('public'));
adminRoute.use(session({secret:process.env.KEY,cookie:{maxAge:600000},resave:false,saveUninitialized:false}))
adminRoute.use(nocache());
adminRoute.use(router)


adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')

const Storage1=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/categoryImages'),(error,success)=>{
            console.log(error.message);
        })
    },
    filename:function(req,file,cb){
    
        const name=Date.now()+'-'+file.originalname
        cb(null,name,(error,success)=>{
            console.log(error.message);
        })
    }
})

const upload = multer({storage:Storage1})

const Storage2=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/productImages'),(error,success)=>{
            console.log(error.message);
        })
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname
        cb(null,name,(error,success)=>{
            console.log(error.message);
        })
    }
})

const Upload = multer({storage:Storage2})


router.route('/')      // admin login routes
.get(adminController.loadAdminLogin)
.post(adminController.verifyAdmin)

router.get('/home',adminController.loadAdminHome)

router.get('/logout',adminController.adminLogout)

router.route('/forgotPassword')
.get(adminController.loadAdminForgotPassword)
.post(adminController.sendForgotPasswordMail)

router.route('/resetPassword')
.get(adminController.loadAdminResetPassword)
.post(adminController.resetAdminPassword)

router.get('/banner',adminController.loadAdminBannerManagement)

// user routes

router.get('/user',adminController.loadAdminUserManagement)

router.route('/addUser')
.get(adminController.loadAddUser)
.post(adminController.addUser)

router.route('/editUser')
.get(adminController.loadEditUser)
.post(adminController.editUser)

router.get('/verifyEmail',adminController.verifyUserEmail)

router.get('/blockUser',adminController.blockUser)
router.get('/unblockUser',adminController.unblockUser)

// category management

router.get('/category',adminController.loadAdminCategoryManagement)

router.route('/addCategory')
.get(adminController.loadAddCategory)
.post(upload.single('image'),adminController.addCategory)

router.route('/editCategory')
.get(adminController.loadEditCategory)
.post(upload.single('image'),adminController.editCategory)

router.get('/listCategory',adminController.listCategory)
router.get('/unlistCategory',adminController.unlistCategory)

// product management

router.get('/product',adminController.loadAdminProductManagement)

router.route('/addProduct')
.get(adminController.loadAddProduct)
.post(Upload.array('images',5),adminController.addProduct)

router.route('/editProduct')
.get(adminController.loadEditProduct)
.post(Upload.array('images',5),adminController.editProduct)

router.get('/listProduct',adminController.listProduct)
router.get('/unlistProduct',adminController.unlistProduct)

//order management

router.get('/order',adminController.loadAdminOrderManagement)

router.route('/editOrder')
.get(adminController.loadEditOrder)
.post(adminController.editOrder)

router.get('/cancelOrder',adminController.adminCancelOrder)
router.get('/orderDetails',adminController.loadOrderDetails)

//coupon management

router.get('/coupon',adminController.loadAdminCouponManagement)

router.route('/addCoupon')
.get(adminController.loadAddCoupon)
.post(adminController.addCoupon)

router.route('/editCoupon')
.get(adminController.loadEditCoupon)
.post(adminController.editCoupon)

router.get('/deleteCoupon',adminController.deleteCoupon)

// Category Offer management

router.get('/categoryOffer',adminController.loadAdminCategoryOfferManagement)

router.route('/addCategoryOffer')
.get(adminController.loadAddCategoryOffer)
.post(adminController.addCategoryOffer)

router.route('/editCategoryOffer')
.get(adminController.loadEditCategoryOffer)
.post(adminController.editCategoryOffer)

router.get('/deleteCategoryOffer',adminController.deleteCategoryOffer)

// Category Offer management

router.get('/productOffer',adminController.loadAdminProductOfferManagement)

router.route('/addProductOffer')
.get(adminController.loadAddProductOffer)
.post(adminController.addProductOffer)

router.route('/editProductOffer')
.get(adminController.loadEditProductOffer)
.post(adminController.editProductOffer)

router.get('/deleteProductOffer',adminController.deleteProductOffer)

// sales report

router.get('/sales',adminController.loadAdminSalesManagement)

router.get('/salesReport',adminController.generateSalesReport)
router.get('/salesReportPdf',adminController.generateSalesReportPdf)
router.get('/salesReportFiltered',adminController.salesReportFiltered)

// charts

router.get('/chartData',adminController.generateChartData)
router.get('/catChartData',adminController.generateCategoryChartData)
router.get('/payChartData',adminController.generatePaymentChartData)

router.get('/chartDataFiltered',adminController.generateChartDataFiltered)





router.get('*',adminController.loadAdminDefault) // keep this default route at the end of all the routes


module.exports=adminRoute
