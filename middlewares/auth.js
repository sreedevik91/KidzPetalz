
const isLogin= async (req,res,next)=>{
    try {
        if(!req.session.login){
            res.redirect('/login')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout =async (req,res,next)=>{
    try {
        if(req.session.login){
            res.redirect('/home')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}



module.exports={
    isLogin,
    isLogout
}