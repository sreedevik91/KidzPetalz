const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const otpGenerator = require('otp-generator')
const otpModel = require('../models/otpModel')
const randomString = require('randomstring')
const passport=require('passport')



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
        if (req.session.login) {
            res.redirect('/home')
        } else {
            res.render('registration', { form: "SignUp" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        if (!req.session.login) {
            res.render('userlogin', { form: "LogIn", message: '', text: '' })
        } else {
            res.redirect('/home')
        }

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


const insertUser = async (req, res) => {
    try {
        const password = await securePassword(req.body.password)
        const email = req.body.email
        const isUserExisting = await userModel.findOne({ email })
        if (isUserExisting) {
            res.send('email already exists')
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
                res.render('submitOtp', { id: result._id, message: '' }) // send OTP timer message to submit Otp page
            } else {
                res.render('registrationSuccess', { message: 'registration failed' })
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
            res.send('Provide OTP sent to email')
        }
        const savedOtp = await otpModel.findOne({ user_id: id })
        console.log(savedOtp.otp);
        if (savedOtp) {
            if (savedOtp.expiration < Date.now()) {
                const user = await userModel.findOne({ _id: id })
                console.log(user_id);
                sendVerificationMail(user.name, user.email, user._id)
                res.render('submitOtp', { id: user._id, message: `OTP expired. Please enter new OTP sent to email` })
            }
            else if (savedOtp.otp === enteredOtp) {
                const updateInfo = await userModel.updateOne({ _id: id }, { $set: { is_verified: true } })
                if (updateInfo) {
                    res.render('userlogin', { form: "LogIn", message: '', text: '' })
                } else {
                    console.log('user email not updated');
                }
            } else {
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
            res.render('submitOtp', { id: user._id, message: '' }) // send OTP timer message to submit Otp page
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
        console.log(user)
        if (user) {
            if (user.is_verified === true) {
                var passwordMatch = await bcrypt.compare(password, user.password)
                console.log(passwordMatch);
                if (passwordMatch) {
                    req.session.login = true
                    req.session.userData = user
                    res.redirect('/user/home')
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
        res.render('verifyEmail')
    } catch (error) {
        console.log(error.message);
    }
}

const loadHome = async (req, res) => {
    try {
        if (req.session.login) {
            res.redirect('user/home')
        } else {
            res.render('home', { login: false })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadUserHome = async (req, res) => {

    try {
        if (req.session.login) {
            res.render('home', { login: true })
        } else {
            res.redirect('/user')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadProducts = async (req, res) => {
    try {
        res.render('allproducts', { page: 'Products' })
    } catch (error) {
        console.log(error.message);
    }
}

const loadBoys = async (req, res) => {
    try {
        res.render('boys', { page: 'Boys' })
    } catch (error) {
        console.log(error.message);
    }
}

const loadGirls = async (req, res) => {
    try {
        res.render('girls', { page: 'Girls' })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async (req, res) => {
    try {
        res.render('product', { page: 'Product' })
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/user')
    } catch (error) {
        console.log(error.message);

    }
}

const loadForgotPasswordEmail = async (req, res) => {
    try {
        res.render('forgotpassword', { form: "Forgot Password",message: '',text:'' })
    } catch (error) {
        console.log(error.message);
    }
}

const sendForgotPasswordEmail = async (name, email,token) => {
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
        const user =await userModel.findOne({ email })
        const name=user.name
        console.log(user);
        if (user) {
            if (user.is_verified) {
                const token = randomString.generate()
                const userupdated=await userModel.updateOne({_id:user._id},{$set:{token:token}})
                console.log('userupdated');
                sendForgotPasswordEmail(name,email,token) // or can send userid as well to send mail
                res.render('forgotpassword', { form: "Reset Password", message: 'A link has been sent to your email to reset password',text:'' })
            } else {
                res.render('forgotpassword', { form: "Reset Password", message: '' , text:'<p>Email not verified.<a href="/verifyEmail">Click</a> to verify.<p>'})
            }
        } else {
            res.render('forgotpassword', { form: "Reset Password", message: 'User not found',text:''})
        }

    } catch (error) {
        console.log(error.message);
        res.render('forgotpassword', { form: "Reset Password", message: 'Email is incorrect',text:'' })
    }
}

const loadResetPasswordEmail = async (req, res) => {
    try {
        const token=req.query.token
        res.render('resetpassword', { form: "Reset Password",message: '',text:'' ,token:token})
    } catch (error) {
        console.log(error.message);
    }
}

const updateNewPassword = async (req, res) => {
    try {

        const passwordReceived = req.body.password
        const password= await securePassword(passwordReceived)
        const token=req.body.token
        const updateUser= await userModel.updateOne({token},{$set:{password:password}})
        if(updateUser){
            res.render('userlogin', { form: "LogIn", message: 'Password Updated. Please login', text: '' })
        }else{
            res.render('resetpassword', {message:'Password Update failed. Try again',token:token})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}



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
    loadLogin,
    verifyLogin,
    sendVerificationMail,
    loadVerifyEmail,
    verifyEmail,
    logout,
    loadForgotPasswordEmail,
    verifyForgotPasswordEmail,
    loadResetPasswordEmail,
    updateNewPassword
}


