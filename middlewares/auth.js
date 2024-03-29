
const isLogin= async (req,res,next)=>{
    try {
        if(!req.session.login){
            res.redirect('/user')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}


const isLogout =async (req,res,next)=>{
    try {
        if(req.session.login){
            res.redirect('user/home')
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