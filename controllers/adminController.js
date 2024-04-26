
const userModel = require('../models/userModel')
const categoryModel = require('../models/categoryModel')
const productModel = require('../models/productModel')
const orderModel = require('../models/orderModel')
const path = require('path')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const randomString = require('randomstring')
const sharp = require('sharp')

dotenv.config()

const loadAdminLogin = async (req, res) => {
    try {
        if (!req.session.adminLogin) {
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
        if (req.session.adminLogin) {
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
        if (req.session.adminLogin) {
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
                    req.session.adminLogin = true
                    res.redirect('/admin/home')
                    console.log(req.session.adminLogin);
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

        const outputFile = `${req.file.destination}/${Date.now() + '-' + req.file.originalname}`

        const cropImage = await sharp(req.file.path).resize(200, 200).toFile(outputFile)

        console.log('Output Image', path.basename(outputFile));

        let resizedImage = path.basename(outputFile)

        const category = new categoryModel({
            name,
            description,
            image: resizedImage
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

        console.log('file', req.file);
        console.log('body', req.body);
        const name = req.body.name
        const description = req.body.description
        const image = req.file.filename
        const id = req.body.id
        const is_listed = req.body.verify

        const outputFile = `${req.file.destination}/${Date.now() + '-' + req.file.originalname}`

        const cropImage = await sharp(req.file.path).resize(200, 200).toFile(outputFile)

        console.log('Output Image', path.basename(outputFile));

        let resizedImage = path.basename(outputFile)

        const updateCategory = await categoryModel.findByIdAndUpdate({ _id: id }, { $set: { name: name, description: description, image: resizedImage, is_listed: is_listed } })
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

        const product = await productModel.find({
            _id: { $exists: true },
            $or: [
                { title: { $regex: `.*${search}.*`, $options: 'i' } },
                { tags: { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.size': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.color': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.material': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.type': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.description': { $regex: `.*${search}.*`, $options: 'i' } }
            ]
        })
            .skip(skip)
            .limit(limit)
            .exec()

        if (product) {
            console.log(product);
        } else {
            console.log('no data');
        }

        const count = await productModel.find({
            _id: { $exists: true },
            $or: [
                { title: { $regex: `.*${search}.*`, $options: 'i' } },
                { tags: { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.size': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.color': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.material': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.type': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'description.description': { $regex: `.*${search}.*`, $options: 'i' } }
            ]
        })
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
        console.log(req.body);

        var arrImages = []

        for (let i = 0; i < req.files.length; i++) {
            const outputFile = `${req.files[i].destination}/${Date.now() + '-' + req.files[i].originalname}`
            const cropImage = await sharp(req.files[i].path).resize(200, 200).toFile(outputFile)
            let resizedImage = path.basename(outputFile)
            // console.log('resizedImage', resizedImage);
            arrImages[i] = resizedImage
        }

        // for (let i = 0; i < req.files.length; i++) {
        //     arrImages[i] = req.files[i].filename
        // }

        // let pTags = []
        // let tag1 = req.body.tag1
        // let tag2 = req.body.tag2
        // let tag3 = req.body.tag3
        // let tag4 = req.body.tag4
        // let tag5 = req.body.tag5
        // let tag6 = req.body.tag6
        // pTags.push(tag1, tag2, tag3, tag4, tag5, tag6)

        // let desc=new Object()
        // desc.size=req.body.size
        // desc.color=req.body.color
        // desc.material=req.body.material
        // desc.type=req.body.type
        // desc.description=req.body.description


        let pSize = []
        pSize.push(req.body.size1, req.body.size2, req.body.size3, req.body.size4, req.body.size5, req.body.size6)

        let desc = new Object()
        desc = {
            size: pSize,
            color: req.body.color,
            material: req.body.material,
            type: req.body.type,
            description: req.body.description
        }


        const title = req.body.title
        const description = desc
        const actual_price = req.body.actualPrice
        const discount = req.body.discount
        const discounted_price = req.body.discountedPrice
        const quantity = req.body.quantity
        const ordered_quantity = req.body.orderedQuantity
        const rating = req.body.rating
        const featured = req.body.featured
        const category_id = req.body.categoryid
        const image = arrImages

        const product = new productModel({
            title,
            description,
            actual_price,
            discount,
            discounted_price,
            quantity,
            ordered_quantity,
            rating,
            featured,
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

// edit product

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

        console.log(req.files);
        var arrImages = []
        for (let i = 0; i < req.files.length; i++) {
            const outputFile = `${req.files[i].destination}/${Date.now() + '-' + req.files[i].originalname}`
            const cropImage = await sharp(req.files[i].path).resize(200, 200).toFile(outputFile)
            let resizedImage = path.basename(outputFile)
            // console.log('resizedImage', resizedImage);
            arrImages[i] = resizedImage
        }

        // for (let i = 0; i < req.files.length; i++){
        //     arrImages[i] = req.files[i].filename
        // }

        // console.log('arrayImages', arrImages);

        // let pTags = []
        // let tag1 = req.body.tag1
        // let tag2 = req.body.tag2
        // let tag3 = req.body.tag3
        // let tag4 = req.body.tag4
        // let tag5 = req.body.tag5
        // let tag6 = req.body.tag6
        // pTags.push(tag1, tag2, tag3, tag4, tag5, tag6)

        let pSize = []
        pSize.push(req.body.size1, req.body.size2, req.body.size3, req.body.size4, req.body.size5, req.body.size6)

        let desc = new Object()
        desc = {
            size: pSize,
            color: req.body.color,
            material: req.body.material,
            type: req.body.type,
            description: req.body.description
        }

        const title = req.body.title
        const description = desc
        const actual_price = req.body.actualPrice
        const discount = req.body.discount
        const discounted_price = req.body.discountedPrice
        const quantity = req.body.quantity
        const ordered_quantity = req.body.orderedQuantity
        const rating = req.body.rating
        const featured = req.body.featured
        const category_id = req.body.categoryid
        const image = arrImages

        const id = req.body.id
        const is_listed = req.body.verify


        const updateProduct = await productModel.findByIdAndUpdate({ _id: id }, {
            $set: {
                title: title,
                description: description,
                actual_price: actual_price,
                discount: discount,
                discounted_price: discounted_price,
                quantity: quantity,
                ordered_quantity: ordered_quantity,
                rating: rating, 
                featured: featured,
                category_id: category_id,
                image: image,
                is_listed: is_listed
            }
        })
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

// ordermanagement

const loadAdminOrderManagement = async (req, res) => {
    try {

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

        const orders = await orderModel.find({
            $or: [
                { products: { $regex: `.*${search}.*`, $options: 'i' } },
                { 'shippingAddress.building': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'shippingAddress.city': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'shippingAddress.state': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'shippingAddress.country': { $regex: `.*${search}.*`, $options: 'i' } },
                { 'shippingAddress.contactNumber': { $regex: `.*${search}.*`, $options: 'i' } },
                { paymentMethod: { $regex: `.*${search}.*`, $options: 'i' } }
            ]
        })
            .skip(skip)
            .limit(limit)
            .exec()
        console.log(orders);

        const count = await orderModel.find({ $or: [{ products: { $regex: `.*${search}.*`, $options: 'i' } }, { shippingAddress: { $regex: `.*${search}.*`, $options: 'i' } }, { paymentMethod: { $regex: `.*${search}.*`, $options: 'i' } }] })
            .countDocuments()

        res.render('adminOrderManagement', { data: orders, totalPages: Math.ceil(count / limit), currentPage: page, next: page + 1, previous: page - 1, search: search })

    } catch (error) {
        console.log(error.message);

    }
}


const loadEditOrder = async (req, res) => {
    try {
        const orderId = req.query.id
        console.log(orderId);
        let orders = await orderModel.findOne({ _id: orderId })

        // send orders and display in edit page and design edit orders ejs page 
        res.render('editOrder', { data: orders })


    } catch (error) {
        console.log(error);

    }
}

const editOrder = async (req, res) => {
    try {
        const status = req.body.status
        const orderId = req.body.id
        console.log(status);
        let orders = await orderModel.updateOne({ _id: orderId }, { $set: { status: status } })
        if (orders) {
            res.redirect('/admin/order')
        } else {
            console.log('could not update');
        }

    } catch (error) {
        console.log(error);

    }
}

const adminCancelOrder = async (req, res) => {
    try {
        const orderId = req.query.id

        let orders = await orderModel.findOne({ _id: orderId })

        for (let product of orders.products) {
            let updateProductQuantity = await productModel.updateOne({ _id: product.productId }, { $inc: { quantity: 1 } })
        }

        let orderCancelled = await orderModel.updateOne({ _id: orderId }, { $set: { status: 'cancelled' } })
        //check if update happened else display error in a message span 
        if (orderCancelled) {
            res.redirect('/admin/order')
        } else {
            console.log('could not update');
        }

    } catch (error) {
        console.log(error);

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
    unlistProduct,
    adminCancelOrder,
    loadEditOrder,
    editOrder
}