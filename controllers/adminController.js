
const userModel = require('../models/userModel')
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const randomString = require('randomstring')

dotenv.config()

const loadAdminLogin = async (req, res) => {
    try {
        if (!req.session.login) {
            res.render('adminLogin', { form: "Admin Login", message: '' })
        } else {
            res.redirect('/admin/home')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadAdminHome = async (req, res) => {
    try {
        if (req.session.login) {
            res.render('adminHome')
        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);

    }
}

const loadAdminDefault = async (req, res) => {
    try {
        if (req.session.login) {
            res.redirect('/admin/home')
        } else {
            res.render('adminLogin', { form: "Admin Login", message: '' })
        }
    } catch (error) {
        console.log(error.message);

    }
}

const loadAdminForgotPassword = async (req, res) => {
    try {
        res.render('adminForgotPassword', { form: "Admin Forgot Password", message: '', text: '' })
    } catch (error) {
        console.log(error.message);

    }
}

const verifyAdmin = async (req, res) => {
    try {

        const email = req.body.email
        const password = req.body.password
        const admin = await userModel.findOne({ email })
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password)
            if (passwordMatch) {
                if (admin.is_admin === true) {
                    req.session.login = true
                    res.redirect('/admin/home')
                    console.log(req.session.login);
                } else {
                    res.render('adminLogin', { form: "Admin Login", message: 'Admin not found' })
                }
            } else {
                res.render('adminLogin', { form: "Admin Login", message: 'Incorrect email or password' })

            }
        } else {
            res.render('adminLogin', { form: "Admin Login", message: 'Incorrect email or password' })

        }

    } catch (error) {
        console.log(error.message);

    }
}

const resetPasswordMail = async (email, name, id) => {
    try {

        const transporter = nodemailer.createTransport({
            host: process.env.SEND_MAIL_HOST,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_APP_USERNAME,
                pass: process.env.SMTP_APP_PASSWORD
            }
        })
        const mailOptions = {
            from: process.env.SMTP_APP_USERNAME,
            to: email,
            subject: 'Reset Password',
            html: `<div>
                    //     <p> Hi ${name}</p>
                    //     <p>Please <a href="http://localhost:3333/admin/resetPassword?token=${id}">click</a> to reset your password</p>
                    //     </div>`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`email has been sent : ${info.response}`);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

const sendForgotPasswordMail = async (req, res) => {
    try {
        const email = req.body.email
        const admin = userModel.findOne({ email })
        if (admin) {
            const id = admin._id
            const name = admin.name
            resetPasswordMail(email, name, id)
            res.render('adminForgotPassword', { form: "Reset Password", message: 'A link has been sent to your email to reset password', text: '' })

        } else {
            res.render('adminForgotPassword', { form: "Forgot Password", message: 'Incorrect email', text: '' })

        }
    } catch (error) {
        console.log(error.message);

    }
}

const loadAdminResetPassword = async (req, res) => {
    try {
        const id = req.query.id
        res.render('adminResetPassword', { form: "Forgot Password", message: '', text: '', id: id })
    } catch (error) {
        console.log(error.message);

    }
}

const resetAdminPassword = async (req, res) => {
    try {

        const password = req.body.password
        const user_id = req.body.id
        const hashedPassword = await bcrypt.hash(password, 10)
        const updateAdmin = userModel.updateOne({ _id: user_id }, { $set: { password: hashedPassword } })
        if (updateAdmin) {
            res.render('adminLogin', { form: "Admin LogIn", message: 'Password Updated. Please login', text: '' })
        } else {
            res.render('adminResetpassword', { message: 'Password Update failed. Try again', token: token })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadAdminOrderManagement = async (req, res) => {
    try {

        const users = await userModel.find({ is_admin: false })
        res.render('adminOrderManagement', { data: users })

    } catch (error) {
        console.log(error.message);

    }
}


const loadAdminCouponManagement = async (req, res) => {
    try {

        const users = await userModel.find({ is_admin: false })
        res.render('adminCouponManagement', { data: users })

    } catch (error) {
        console.log(error.message);

    }
}


const loadAdminOfferManagement = async (req, res) => {
    try {

        const users = await userModel.find({ is_admin: false })
        res.render('adminOfferManagement', { data: users })

    } catch (error) {
        console.log(error.message);

    }
}


const loadAdminBannerManagement = async (req, res) => {
    try {

        const users = await userModel.find({ is_admin: false })
        res.render('adminBannerManagement', { data: users })

    } catch (error) {
        console.log(error.message);

    }
}


const loadAdminSalesManagement = async (req, res) => {
    try {

        const users = await userModel.find({ is_admin: false })
        res.render('adminSalesManagement', { data: users })

    } catch (error) {
        console.log(error.message);

    }
}

// user management

const loadAdminUserManagement = async (req, res) => {
    try {

        // const users = await userModel.find({$and:[ {is_admin: false},{is_blocked:false}]})

        //search user in user management

        let search = ''
        if (req.query.search) {
            search = req.query.search
        }

        let page = parseInt(req.query.page)
        let sort = req.query.sort
        let limit = 5
        let skip;

        if (page <= 1) {
            skip = 0
        } else {
            skip = (page - 1) * limit
        }

        const users = await userModel.find({ is_admin: false, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { email: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .skip(skip)
            .limit(limit)
            .exec()
        console.log(users);

        const count = await userModel.find({ is_admin: false, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { email: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .countDocuments()

        res.render('adminUserManagement', { data: users, totalPages: Math.ceil(count / limit), currentPage: page, next: page + 1, previous: page - 1, search: search })

    } catch (error) {
        console.log(error.message);

    }
}

// add user

const loadAddUser = async (req, res) => {
    try {

        res.render('addUser', { message: '' })

    } catch (error) {
        console.log(error.message);

    }
}

const sendVerifyUserEmail = async (name, email, password, user_id) => {
    try {

        const transporter = nodemailer.createTransport({
            host: process.env.SEND_MAIL_HOST,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_APP_USERNAME,
                pass: process.env.SMTP_APP_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.SMTP_APP_USERNAME,
            to: email,
            subject: 'Verify your account',
            html: `<div>
                    //     <p> Hi ${name}</p>
                    //     <p>Please <a href="http://localhost:3333/admin/verifyEmail?id=${user_id}">click</a> to verify your email</p>
                            <br> <br>
                            <p>Login details:</p>
                            <p>Username: ${email}</p>
                            <p>Password: ${password}</p>
                    //     </div>`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`email has been sent : ${info.response}`);
            }
        })
    } catch (error) {

    }
}

const addUser = async (req, res) => {
    try {

        const name = req.body.name
        const email = req.body.email
        const mobile = req.body.mobile
        const password = randomString.generate(8)
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new userModel({
            name,
            email,
            mobile,
            password: password
        })

        const newUser = await user.save()

        if (newUser) {
            sendVerifyUserEmail(newUser.name, newUser.email, newUser.password, newUser._id)
            res.redirect('/admin/user')
        } else {
            res.render('addUser', { message: 'Add user failed' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const verifyUserEmail = async (req, res) => {     //verify email by user through mail sent by admin
    try {

        const id = req.query.id
        const updateUser = await userModel.updateOne({ _id: id }, { $set: { is_verified: true } })
        if (updateUser) {
            res.render('verifyEmailNewUser', { message: 'Email varified. Please proceed to login' })
        } else {
            res.render('verifyEmailNewUser', { message: 'Email varification failed. Please try again' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

// edit user

const loadEditUser = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id);
        const user = await userModel.findOne({ _id: id })
        console.log(user);
        if (user) {
            res.render('editUser', { data: user, message: '' })
        } else {
            res.render('editUser', { message: 'Something went wrong' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

const editUser = async (req, res) => {
    try {
        const name = req.body.name
        const email = req.body.email
        const mobile = req.body.mobile
        const id = req.body.id
        const verified = req.body.verify
        console.log(verified);

        const updateUser = await userModel.findByIdAndUpdate({ _id: id }, { $set: { name: name, email: email, mobile: mobile, is_verified: verified } })
        if (updateUser) {
            res.redirect('/admin/user')
        } else {
            res.render('editUser', { message: 'Updation Failed' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

// block and unblock user

const blockUser = async (req, res) => {
    try {

        const id = req.query.id
        const blockUser = await userModel.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } })
        if (blockUser) {
            res.redirect('/admin/user')
        }

    } catch (error) {
        console.log(error.message);
    }
}


const unblockUser = async (req, res) => {
    try {

        const id = req.query.id
        const unblockUser = await userModel.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: false } })
        if (unblockUser) {
            res.redirect('/admin/user')
        }

    } catch (error) {
        console.log(error.message);
    }
}

// category management

const loadAdminCategoryManagement = async (req, res) => {
    try {

        //search user in category management

        let search = ''
        if (req.query.search) {
            search = req.query.search
        }

        let page = parseInt(req.query.page)
        let sort = req.query.sort
        let limit = 5
        let skip;

        if (page <= 1) {
            skip = 0
        } else {
            skip = (page - 1) * limit
        }

        const category = await categoryModel.find({ _id: { $exists: true }, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { description: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .skip(skip)
            .limit(limit)
            .exec()
        console.log(category);

        const count = await categoryModel.find({ _id: { $exists: true }, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { description: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .countDocuments()

        res.render('adminCategoryManagement', { data: category, totalPages: Math.ceil(count / limit), currentPage: page, next: page + 1, previous: page - 1, search: search })

    } catch (error) {
        console.log(error.message);

    }
}

// add category

const loadAddCategory = async (req, res) => {
    try {

        res.render('addCategory', { message: '' })

    } catch (error) {
        console.log(error.message);

    }
}

const addCategory = async (req, res) => {
    try {
        const name = req.body.name
        const description = req.body.description
        const image = req.file.filename

        const category = new categoryModel({
            name,
            description,
            image
        })

        const newCategory = await category.save()

        if (newCategory) {
            res.redirect('/admin/category')
        } else {
            res.render('addCategory', { message: 'Add category failed' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

// edit category

const loadEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id);
        const category = await categoryModel.findOne({ _id: id })
        console.log(category);
        if (category) {
            res.render('editCategory', { data: category, message: '' })
        } else {
            res.render('editCategory', { message: 'Something went wrong' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

const editCategory = async (req, res) => {
    try {
        const name = req.body.name
        const description = req.body.description
        const image = req.file.filename
        const id = req.body.id
        const is_listed = req.body.verify


        const updateCategory = await categoryModel.findByIdAndUpdate({ _id: id }, { $set: { name: name, description: description, image: image, is_listed: is_listed } })
        if (updateCategory) {
            res.redirect('/admin/category')
        } else {
            res.render('editCategory', { message: 'Updation Failed' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

// list and unlist category

const listCategory = async (req, res) => {
    try {

        const id = req.query.id
        const listCategory = await categoryModel.findByIdAndUpdate({ _id: id }, { $set: { is_listed: true } })
        if (listCategory) {
            res.redirect('/admin/category')
        }

    } catch (error) {
        console.log(error.message);
    }
}


const unlistCategory = async (req, res) => {
    try {

        const id = req.query.id
        const unlistCategory = await categoryModel.findByIdAndUpdate({ _id: id }, { $set: { is_listed: false } })
        if (unlistCategory) {
            res.redirect('/admin/category')
        }

    } catch (error) {
        console.log(error.message);
    }
}


// product management


const loadAdminProductManagement = async (req, res) => {
    try {

        //search user in product management

        let search = ''
        if (req.query.search) {
            search = req.query.search
        }

        let page = parseInt(req.query.page)
        let sort = req.query.sort
        let limit = 5
        let skip;

        if (page <= 1) {
            skip = 0
        } else {
            skip = (page - 1) * limit
        }

        const product = await productModel.find({ _id: { $exists: true }, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { description: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .skip(skip)
            .limit(limit)
            .exec()
        console.log(product);

        const count = await productModel.find({ _id: { $exists: true }, $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }, { description: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .countDocuments()

        res.render('adminProductManagement', { data: product, totalPages: Math.ceil(count / limit), currentPage: page, next: page + 1, previous: page - 1, search: search })

    } catch (error) {
        console.log(error.message);

    }
}

// add product

const loadAddProduct = async (req, res) => {
    try {

        res.render('addProduct', { message: '' })

    } catch (error) {
        console.log(error.message);

    }
}

const addProduct = async (req, res) => {
    try {

        console.log(req.files.filename);

        var arrImages = []
        for (let i = 0; i < req.files.length; i++) {
            arrImages[i] = req.files[i].filename
        }

        // let pTags=[]
        // pTags.push(req.body.tags)

        // let desc=new Object()
        // desc.size=req.body.size
        // desc.color=req.body.color
        // desc.material=req.body.material
        // desc.type=req.body.type
        // desc.description=req.body.description
       


        const title = req.body.title
        const description = req.body.description
        const tags = req.body.tags
        const price = req.body.price
        const discount = req.body.discount
        const quantity = req.body.quantity
        const category_id = req.body.categoryid
        const image = arrImages

        const product = new productModel({
            title,
            description,
            tags,
            price,
            discount,
            quantity,
            category_id,
            image
        })

        const newProduct = await product.save()

        if (newProduct) {
            res.redirect('/admin/product')
        } else {
            res.render('addProduct', { message: 'Add product failed' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

// edit category

const loadEditProduct = async (req, res) => {
    try {

        const id = req.query.id
        console.log(id);
        const product = await productModel.findOne({ _id: id })
        console.log(product);
        if (product) {
            res.render('editProduct', { data: product, message: '' })
        } else {
            res.render('editProduct', { message: 'Something went wrong' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

const editProduct = async (req, res) => {
    try {

        var arrImages = []
        for (let i = 0; i < req.files.length; i++) {
            arrImages[i] = req.files[i].filename
        }

        const title = req.body.title
        const description = req.body.description
        const price = req.body.price
        const discount = req.body.discount
        const quantity = req.body.quantity
        const category_id = req.body.categoryid
        const images = arrImages

        const id = req.body.id
        const is_listed = req.body.verify


        const updateProduct = await productModel.findByIdAndUpdate({ _id: id }, { $set: { title: title, description: description, price: price, discount: discount, quantity: quantity, category_id: category_id, images: images, is_listed: is_listed } })
        if (updateProduct) {
            res.redirect('/admin/product')
        } else {
            res.render('editProduct', { message: 'Updation Failed' })
        }

    } catch (error) {
        console.log(error.message);

    }
}

// list and unlist category

const listProduct = async (req, res) => {
    try {

        const id = req.query.id
        const listProduct = await productModel.findByIdAndUpdate({ _id: id }, { $set: { is_listed: true } })
        if (listProduct) {
            res.redirect('/admin/product')
        }

    } catch (error) {
        console.log(error.message);
    }
}


const unlistProduct = async (req, res) => {
    try {

        const id = req.query.id
        const unlistProduct = await productModel.findByIdAndUpdate({ _id: id }, { $set: { is_listed: false } })
        if (unlistProduct) {
            res.redirect('/admin/product')
        }

    } catch (error) {
        console.log(error.message);
    }
}





module.exports = {
    loadAdminHome,
    loadAdminLogin,
    adminLogout,
    loadAdminDefault,
    verifyAdmin,
    loadAdminForgotPassword,
    loadAdminResetPassword,
    resetAdminPassword,
    sendForgotPasswordMail,
    loadAdminUserManagement,
    loadAdminProductManagement,
    loadAdminOrderManagement,
    loadAdminCategoryManagement,
    loadAdminCouponManagement,
    loadAdminOfferManagement,
    loadAdminBannerManagement,
    loadAdminSalesManagement,
    loadAddUser,
    addUser,
    verifyUserEmail,
    loadEditUser,
    editUser,
    blockUser,
    unblockUser,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    listCategory,
    unlistCategory,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    listProduct,
    unlistProduct
}