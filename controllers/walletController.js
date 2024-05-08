const walletModel=require('../models/walletModel')
const userModel=require('../models/userModel')

const loadWallet= async(req,res)=>{
    try {
        const userId=req.session.userId
        let wallet=await walletModel.findOne({userId})

        if(wallet){
        res.render('wallet', { page: 'Wallet', data:wallet, id: req.session.userId, name: req.session.user.name, message: '', cartCount: req.session.cartCount })
        }else{
        res.render('wallet', { page: 'Wallet', data: '', id: req.session.userId, name: req.session.user.name, message: 'Your wallet is empty', cartCount: req.session.cartCount })
        }
    } catch (error) {
        console.log(error);
    }
}

const updateWallet= async(req,res)=>{
    try {
        const {walletId,walletAmount}=req.body
        const userId=req.session.userId
        console.log('walletId',walletId);

        let wallet=await walletModel.findOne({userId})
        console.log('wallet: ',wallet);

        if(wallet){
            wallet.amount+=parseInt(walletAmount)
            wallet.transactions.unshift({
                type:'credit',
                amount:parseInt(walletAmount),
                date:Date.now()
            })
            wallet.save()
            console.log('wallet amount added');
            res.redirect('/wallet')
        }else{
            let wallet= new walletModel({
                userId,
                amount:walletAmount,
                transactions:[{
                    type:'credit',
                    amount:parseInt(walletAmount),
                    date:Date.now()
                }]
            })
            wallet.save()
            console.log('wallet created');
            res.redirect('/wallet')
        }

    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadWallet,
    updateWallet
}