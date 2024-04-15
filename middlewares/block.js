
module.exports.isBlocked= async (req,res,next)=>{
    try {
        if(req.session.user.is_blocked){
            // res.render('404', {message:'Access to this URL is blocked for the user'})
            res.redirect('/blocked')
            req.session.destroy()

        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }
}


