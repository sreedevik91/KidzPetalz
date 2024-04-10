module.exports.isBlocked= async (req,res,next)=>{
    try {
        if(req.session.user.is_blocked){
            res.render('404', {message:'Access to this URL is blocked for the user'})
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


