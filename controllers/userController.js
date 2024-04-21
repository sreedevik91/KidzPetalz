const userModel = require('../models/userModel')
const addressModel = require('../models/addressModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const otpGenerator = require('otp-generator')
const otpModel = require('../models/otpModel')
const randomString = require('randomstring')
const passport = require('passport')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')



dotenv.config()

const securePassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        return hashedPassword

    } catch (error) {
        console.log(error.message);
    }
}

const loadRegistration = async (req, res) => {
    try {

        res.render('registration', { form: "SignUp", message: '' })
        // if (req.session.login) {
        //     res.redirect('/home')
        // } else {
        //     res.render('registration', { form: "SignUp", message: '' })
        // }
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('userlogin', { form: "LogIn", message: '', text: '' })
        // if (!req.session.login) {
        //     res.render('userlogin', { form: "LogIn", message: '', text: '' })
        // } else {
        //     res.redirect('/home')
        // }

    } catch (error) {
        console.log(error.message);
    }
}

// const generateOtp=async ()=>{
//     const otp= otpGenerator.generate(4,{lowerCaseAlphabets:false,upperCaseAlphabets: false, specialChars: false})
//     return otp
// }

const sendVerificationMail = async (name, email, user_id) => {
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

        //to send mail verification link

        // const mailOptions={
        //     from:process.env.SMTP_APP_USERNAME,
        //     to:email,
        //     subject:'Verification Mail',
        //     html:`<div>
        //     <p> Hi ${name}</p>
        //     <p> Please click to <a href="http://localhost:3333/verify?id=${user_id}">verify</a> your email</p>
        //     </div>`
        // }

        const expiration = Date.now() + 60000
        const otp = otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })

        const saveOtp = await otpModel.findOneAndUpdate({ user_id: user_id }, { email: email, otp: otp, expiration: expiration }, { upsert: true, new: true, setDefaultsOnInsert: true })

        if (saveOtp) {
            console.log('otp saved');
        } else {
            console.log('error')
        }
        // to send otp for verification

        const mailOptions = {
            from: process.env.SMTP_APP_USERNAME,
            to: email,
            subject: 'OTP Verification Mail',
            html: `<div>
                    //     <p> Hi ${name}</p>
                    //     <p>Your OTP for verification is ${saveOtp.otp}</p>
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

const resendOtp = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id);
        const user = await userModel.findOne({ _id: id })
        console.log(user);
        sendVerificationMail(user.name, user.email, user._id)
        res.render('submitOtp', { form: 'Submit OTP', id: user._id, message: '' })

    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {
    try {
        const password = await securePassword(req.body.password)
        const email = req.body.email
        const isUserExisting = await userModel.findOne({ email })
        if (isUserExisting) {
            res.render('registration', { form: 'SignUp', message: 'Email already exists. ' })

            // res.render('404',{message:'Email already exists.'})
        } else {
            const userData = new userModel({
                name: req.body.name,
                email,
                mobile: req.body.mobile,
                username: req.body.username,
                password: password
            })

            const result = await userData.save()

            if (result) {
                sendVerificationMail(result.name, result.email, result._id)
                // var message=await timer(60)
                // console.log(message);
                res.render('submitOtp', { form: 'Submit OTP', id: result._id, message: '' })
            } else {
                res.render('verifyEmail', { form: 'Verify Email', message: 'Incorrect email. Please enter registered email. ' })
            }
        }

    }
    catch (error) {
        res.send(error.message)
    }
}

const verifyUser = async (req, res) => {
    try {
        const enteredOtp = req.body.otp
        console.log(enteredOtp);
        const id = req.query.id
        console.log(id);
        if (!enteredOtp) {
            res.render('submitOtp', { form: 'Submit OTP', id: id, message: 'Provide OTP sent to email' })
        }
        const savedOtp = await otpModel.findOne({ user_id: id })
        console.log(savedOtp.otp);
        if (savedOtp) {
            // if (savedOtp.expiration < Date.now()) {
            //     const user = await userModel.findOne({ _id: id })
            //     sendVerificationMail(user.name, user.email, user._id)
            //     res.render('submitOtp', {form:'Submit OTP', id: user._id, message: `OTP expired. Please enter new OTP sent to email` })
            // }else
            if (savedOtp.otp === enteredOtp) {
                const updateInfo = await userModel.updateOne({ _id: id }, { $set: { is_verified: true } })
                if (updateInfo) {
                    res.render('userlogin', { form: "LogIn", message: '', text: '' })
                } else {
                    res.render('404', { message: 'user email not updated.' })
                    console.log('user email not updated');
                }
            } else {
                res.render('submitOtp', { form: 'Submit OTP', id: id, message: 'Enter valid otp' })
                console.log('enter valid otp');
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyEmail = async (req, res) => {
    try {
        email = req.body.email
        name = req.body.name
        console.log(email, name);
        const user = await userModel.findOne({ email })
        console.log(user.name);
        if (user) {
            sendVerificationMail(name, email, user._id)
            res.render('submitOtp', { form: 'Submit OTP', id: user._id, message: '' }) // send OTP timer message to submit Otp page
        } else {
            res.render('registrationSuccess', { message: 'registration failed' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (user) {
            if (user.is_verified === true) {
                let passwordMatch = await bcrypt.compare(password, user.password)
                if (passwordMatch) {
                    req.session.login = true
                    req.session.user = user
                    req.session.userId = user._id
                    let cart = await cartModel.findOne({ user: req.session.userId })
                    // console.log(cart);
                    let cartCount
                    if (cart) {
                        cartCount = cart.quantity
                        // or this also could be used:- cartCount=cart.products.length
                        req.session.cartCount = cartCount
                    } else {
                        cartCount = 0
                        req.session.cartCount = cartCount
                    }
                    res.redirect('/home')
                } else {
                    res.render('userlogin', { form: "LogIn", message: 'Invalid email or password', text: '' })
                }
            } else {
                res.render('userlogin', { form: "LogIn", text: `<p>Email not verified.<a href="/verifyEmail">Click</a> to verify.<p>`, name: user.name, email: user.email, id: user._id, message: '' })
            }
        } else {
            res.render('userlogin', { form: "LogIn", message: 'User not found.Invalid email or password', text: '' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadVerifyEmail = async (req, res) => {
    try {
        res.render('verifyEmail', { form: 'Verify Email', message: '' })
    } catch (error) {
        console.log(error.message);
    }
}

const loadBlock = async (req, res) => {
    try {
        res.render('404', { message: 'Access to this URL is blocked for the user' })
    } catch (error) {
        console.log(error.message);
        res.render('404', { message: error.message })

    }
}

const loadHome = async (req, res) => {
    try {
        res.render('home', { login: false, id: '' })
        // if (req.session.login) {
        //     res.redirect('home')
        // } else {
        //     res.render('home', { login: false,userId:'' })
        // }

    } catch (error) {
        console.log(error.message);
    }
}

const loadUserHome = async (req, res) => {

    try {
        res.render('home', { login: true, id: req.session.userId, cartCount: req.session.cartCount })
        // if (req.session.login) {
        //     res.render('home', { login: true,userId:req.session.userId })
        // } else {
        //     res.redirect('/')
        // }
    } catch (error) {
        console.log(error.message);
    }
}
const loadProducts = async (req, res) => {
    try {
      
        const products = await productModel.find({ _id: { $exists: true }, is_listed: true })
        if (products) {
            res.render('allproducts', { page: 'Products', data: products, id: req.session.userId, cartCount: req.session.cartCount })
        } else {
            res.render('404', { message: 'Page Not Found !' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadFilteredProducts=async(req,res)=>{
    try {
       
        let filterArray=req.body.filterArray
        let sort=req.body.sort
        console.log(filterArray);
        console.log(sort);

        let products=[]
      
        //     if(filterArray.desc=='-1'){
        //         let product=await productModel.find({_id: { $exists: true }, is_listed: true}).sort({discounted_price:-1})
        //         products.push(...product)
        //     }
        //     if(filterArray.asce=='-1'){
        //         let product=await productModel.find({_id: { $exists: true }, is_listed: true}).sort({discounted_price:1})
        //         products.push(...product)

        //     }
        //     if(filterArray.popular=='popular'){
        //         let product=await productModel.find({is_listed: true,tags:{$elemMatch:{ $regex: `.*popular.*`, $options: 'i' }}})
        //         products.push(...product)
        //     }
       

        // console.log('products: /n'+products);
        
        // res.render('allproducts', { page: 'Products', data: products, id: req.session.userId, cartCount: req.session.cartCount })


    } catch (error) {
        console.log(error.message);
        
    }
}

const loadBoys = async (req, res) => {
    try {
        res.render('boys', { page: 'Boys', id: req.session.userId, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const loadGirls = async (req, res) => {
    try {

        res.render('girls', { page: 'Girls', id: req.session.userId, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await productModel.find({ _id: id })
        console.log(product[0].quantity);
        let quantity=product[0].quantity
        var text=''
        if(quantity>10){
            text='In Stock'
        }
        else if(quantity<=10 && quantity>0){
            text='Few Numbers Left'
        }
        else if(quantity<=0){
            text='Out of Stock'
        }else{
            text=''
        }
        console.log('text: '+ text);
        res.render('product', { page: 'Product', data: product,message:text, id: id, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        console.log(error.message);

    }
}

const loadForgotPasswordEmail = async (req, res) => {
    try {
        res.render('forgotpassword', { form: "Forgot Password", message: '', text: '' })
    } catch (error) {
        console.log(error.message);
    }
}

const sendForgotPasswordEmail = async (name, email, token) => {
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
                    //     <p>Please <a href="http://localhost:3333/resetPassword?token=${token}">click</a> to reset your password</p>
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

const verifyForgotPasswordEmail = async (req, res) => {
    try {
        const email = req.body.email
        console.log(email);
        const user = await userModel.findOne({ email })
        const name = user.name
        console.log(user);
        if (user) {
            if (user.is_verified) {
                const token = randomString.generate()
                const userupdated = await userModel.updateOne({ _id: user._id }, { $set: { token: token } })
                console.log('userupdated');
                sendForgotPasswordEmail(name, email, token) // or can send userid as well to send mail
                res.render('forgotpassword', { form: "Reset Password", message: 'A link has been sent to your email to reset password', text: '' })
            } else {
                res.render('forgotpassword', { form: "Reset Password", message: '', text: '<p>Email not verified.<a href="/verifyEmail">Click</a> to verify.<p>' })
            }
        } else {
            res.render('forgotpassword', { form: "Reset Password", message: 'User not found', text: '' })
        }

    } catch (error) {
        console.log(error.message);
        res.render('forgotpassword', { form: "Reset Password", message: 'Email is incorrect', text: '' })
    }
}

const loadResetPassword = async (req, res) => {
    try {
        const token = req.query.token
        res.render('resetpassword', { form: "Reset Password", message: '', text: '', token: token })
    } catch (error) {
        console.log(error.message);
    }
}

const updateNewPassword = async (req, res) => {
    try {

        const passwordReceived = req.body.password
        const password = await securePassword(passwordReceived)
        const token = req.body.token
        const updateUser = await userModel.updateOne({ token }, { $set: { password: password } })
        if (updateUser) {
            res.render('userlogin', { form: "LogIn", message: 'Password Updated. Please login', text: '' })
        } else {
            res.render('resetpassword', { form: 'Reset Password', message: 'Password Update failed. Try again', token: token })
        }

    } catch (error) {
        console.log(error.message);
    }
}

// Change Password

const loadChangePassword = async (req, res) => {
    try {
        const userId = req.query.id
        console.log(`userId: ${userId}`);
        res.render('changepassword', { form: "Change Password", message: '', text: '', id: userId })
    } catch (error) {
        console.log(error.message);
    }
}

const changePassword = async (req, res) => {

    try {

        const userId = req.body.id
        console.log(userId);
        const currentPassword = req.body.cPassword
        console.log(`db currentPassword:${currentPassword}`);
        const newPassword = req.body.newPassword
        let password = await securePassword(newPassword)
        const user = await userModel.findOne({ _id: userId })
        console.log(user);
        console.log(`db password:${user.password}`);
        let passwordMatch = await bcrypt.compare(currentPassword, user.password)
        console.log(passwordMatch);

        if (passwordMatch) {
            let updateUser = await userModel.updateOne({ _id: userId }, { $set: { password: password } })
            if (updateUser) {
                res.redirect('/login')
            } else {
                res.render('changepassword', { form: "Change Password", message: 'Password updation failed', text: '', id: userId })
            }
        } else {
            res.render('changepassword', { form: "Change Password", message: 'Current password is invalid', text: '', id: userId })

        }

    } catch (error) {
        console.log(error.message);

    }
}

// load user profile

const loadProfile = async (req, res) => {
    try {

        let userId = req.session.userId

        let user = await userModel.findOne({ _id: userId })
        // console.log(user);

        let address = await addressModel.findOne({ userId: userId })
        // console.log(address);
        if (address) {
            res.render('userProfile', { page: 'Profile', userData: user, addressData: address, id: req.session.userId, name: req.session.user.name, cartCount: req.session.cartCount })

        } else {
            res.render('userProfile', { page: 'Profile', userData: user, addressData: '', id: req.session.userId, name: req.session.user.name, cartCount: req.session.cartCount })

        }

    } catch (error) {
        console.log(error.message);

    }
}

//load address

const loadAddAddress = async (req, res) => {
    try {
        res.render('addAddress', { form: "Add Address", id: req.session.userId, message: '', text: '' })

    } catch (error) {
        console.log(error.message);
    }
}

// add address

const addAddress = async (req, res) => {
    try {

        let userId = req.session.userId
        console.log(userId);
        console.log(req.body);
        let addressData = await addressModel.findOne({ userId })
        console.log(addressData);

        if (addressData._id) {
            if (req.body.type == 'Shipping Address') {

                let shippingAddress = {

                    name: req.body.name,
                    building: req.body.building,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    pbNumber: req.body.pbNumber,
                    contactNumber: req.body.mobile
                }

                let updateAddress = await addressModel.updateOne({ userId }, { $push: { shippingAddress: shippingAddress } })

                if (updateAddress) {
                    console.log('shipping address updated');
                    res.redirect('/userProfile')
                }

            } else {

                let billingAddress = {

                    name: req.body.name,
                    building: req.body.building,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    pbNumber: req.body.pbNumber,
                    contactNumber: req.body.mobile
                }

                let updateAddress = await addressModel.updateOne({ userId }, { $set: { billingAddress: billingAddress } })

                if (updateAddress) {
                    console.log('billing address updated');
                    res.redirect('/userProfile')

                }
            }
        } else {

            const newAddress = new addressModel({
                userId: req.body.userId,
                billingAddress: {
                    name: req.body.name,
                    building: req.body.building,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    pbNumber: req.body.pbNumber,
                    contactNumber: req.body.mobile
                },
                shippingAddress: [
                    {
                        name: req.body.name,
                        building: req.body.building,
                        city: req.body.city,
                        state: req.body.state,
                        country: req.body.country,
                        pbNumber: req.body.pbNumber,
                        contactNumber: req.body.mobile
                    }
                ]
            })

            const address = await newAddress.save()

            if (address) {
                console.log('address added');
                res.redirect('/userProfile')
            }
        }


    } catch (error) {
        console.log(error.message);

    }
}

// load update address

const loadUpdateAddress = async (req, res) => {
    try {

        let userId = req.session.userId
        const address = await addressModel.findOne({ userId })

        res.render('updateAddress', { form: "Update Address", data: address, id: req.session.userId, message: '', text: '' })

    } catch (error) {
        console.log(error.message);
    }
}

// update address

const updateAddress = async (req, res) => {
    try {
        let userId = req.query.id

        if (req.body.type == 'Shipping Address') {

            let shippingAddress = {

                building: req.body.building,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                pbNumber: req.body.pbNumber,
                contactNumber: req.body.mobile
            }

            let updateAddress = await addressModel.updateOne({ userId }, { $push: { shippingAddress: shippingAddress } })
            if (updateAddress) {
                console.log('shipping address updated');
                res.redirect('/userProfile')

            }

        } else {

            let billingAddress = {
                building: req.body.building,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                pbNumber: req.body.pbNumber,
                contactNumber: req.body.mobile
            }

            let updateAddress = await addressModel.updateOne({ userId }, { $set: { billingAddress: billingAddress } })

            if (updateAddress) {
                console.log('billing address updated');
                res.redirect('/userProfile')

            }
        }

    } catch (error) {
        console.log(error.message);

    }
}

// load update profile

const loadUpdateProfile = async (req, res) => {
    try {
        let userId = req.session.userId
        let user = await userModel.findOne({ _id: userId })

        res.render('updateProfile', { form: "Update Profile", data: user, id: req.session.userId, message: '', text: '' })

    } catch (error) {
        console.log(error.message);
    }
}

// update address

const updateProfile = async (req, res) => {
    try {

        let userId = req.session.userId
        let name = req.body.name
        let email = req.body.email
        let mobile = req.body.mobile


        let updateUser = await userModel.updateOne({ _id: userId }, { $set: { name: name, email: email, mobile: mobile } })


        // console.log(user);
        if (updateUser) {
            console.log('user profile updated');
            res.redirect('/userProfile')
        }

    } catch (error) {
        console.log(error.message);

    }
}

const deleteAddress=async (req,res)=>{

    try {
        let shippingAddressId=req.query.id
        console.log(shippingAddressId);
        let userId=req.session.userId
        let deleteAddress=await addressModel.updateOne({userId},{$pull:{shippingAddress:{_id:shippingAddressId}}})
        if(deleteAddress){
            res.json('address deleted')
        }
    } catch (error) {
        console.log(error.message);
        
    }
}

// const goBackLogin404=async(req,res)=>{
//     try {
//         res.redirect('/login')
//     } catch (error) {
//         console.log(error.message);

//     }
// }

module.exports = {
    insertUser,
    loadRegistration,
    verifyUser,
    loadHome,
    loadUserHome,
    loadProducts,
    loadBoys,
    loadGirls,
    loadProduct,
    loadFilteredProducts,
    loadLogin,
    verifyLogin,
    sendVerificationMail,
    loadVerifyEmail,
    verifyEmail,
    resendOtp,
    logout,
    loadForgotPasswordEmail,
    verifyForgotPasswordEmail,
    loadResetPassword,
    loadBlock,
    updateNewPassword,
    loadChangePassword,
    changePassword,
    loadProfile,
    loadAddAddress,
    addAddress,
    loadUpdateAddress,
    updateAddress,
    loadUpdateProfile,
    updateProfile,
    deleteAddress
    // goBackLogin404
}


