const productModel = require('../models/productModel')
const userModel = require('../models/userModel')

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

const loadFilteredProducts = async (req, res) => {
    try {

        // let sort = req.body.sort

        // console.log('sort', sort);
        console.log('filters: ', req.body.filterArray)
        console.log('query: ', req.body.query)

        // let sortQ = {}
        // if (sort!=undefined) {
        //     if (sort === 'low') {
        //         sortQ.discounted_price = 1
        //     }
        //     if (sort === 'high') {
        //         sortQ.discounted_price = -1
        //     }
        //     if (sort === 'asce') {
        //         sortQ.title = 1
        //     }
        //     if (sort === 'desce') {
        //         sortQ.title = -1
        //     }
        // }

        let searchQ = {}
        let sortQ = {}

        if (req.body.filterArray != undefined) {
            req.body.filterArray.forEach((keyword) => {

                if (keyword === 'all') {
                    sortQ={}
                }
                if (keyword === 'newArrival') {
                    sortQ.createdAt = -1
                }
                if (keyword === 'low') {
                    sortQ.price = 1
                }
                if (keyword === 'high') {
                    sortQ.price = -1
                }
                if (keyword === 'asce') {
                    sortQ.title = 1
                }
                if (keyword === 'desce') {
                    sortQ.title = -1
                }
                if (keyword === 'popular') {
                    sortQ.ordered_quantity = -1
                }
                if (keyword === 'rating') {
                    sortQ.rating = -1
                }
                if (keyword === 'featured') {
                    searchQ.featured = true
                }

            })
        }

        console.log('sort', sortQ);

        console.log('search',searchQ);

        let products = await productModel.find(searchQ).sort(sortQ)
        res.json(products)

        console.log(products);

    } catch (error) {
        console.log(error.message);

    }
}

const loadBoys = async (req, res) => {
    try {
        let categoryId = req.query.id
        const boys = await productModel.find({ category_id: categoryId })
        // console.log(boys);
        res.render('boys', { page: 'Boys', data: boys, id: req.session.userId, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const loadGirls = async (req, res) => {
    try {
        let categoryId = req.query.id
        const girls = await productModel.find({ category_id: categoryId })
        // console.log(girls);
        res.render('girls', { page: 'Girls', data: girls, id: req.session.userId, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await productModel.find({ _id: id })
        console.log(product[0].quantity);
        let quantity = product[0].quantity
        var text = ''
        if (quantity > 10) {
            text = 'In Stock'
        }
        else if (quantity <= 10 && quantity > 0) {
            // text = `Few Numbers Left`
            text = `Only ${quantity} Numbers Left`
        }
        else if (quantity <= 0) {
            text = 'Out of Stock'
        } else {
            text = ''
        }
        console.log('text: ' + text);
        res.render('product', { page: 'Product', data: product, message: text, id: id, cartCount: req.session.cartCount })
    } catch (error) {
        console.log(error.message);
    }
}

const searchProduct=async(req,res)=>{

    try {
        let query=req.body.search
        console.log(query);
        
        // let products=await productModel.find({is_listed:true,$or: [
        //     { title: { $regex: `.*${search}.*`, $options: 'i' } },
        //     { tags: { $regex: `.*${search}.*`, $options: 'i' } },
        //     { 'description.size': { $regex: `.*${search}.*`, $options: 'i' } },
        //     { 'description.color': { $regex: `.*${search}.*`, $options: 'i' } },
        //     { 'description.material': { $regex: `.*${search}.*`, $options: 'i' } },
        //     { 'description.type': { $regex: `.*${search}.*`, $options: 'i' } },
        //     { 'description.description': { $regex: `.*${search}.*`, $options: 'i' } }
        // ]})

        // `.*${query}.*`, $options: 'i' 
        let products=await productModel.find({title:{$regex: new RegExp(`.*${query}.*`,'i')}}).limit(10)
        // console.log(products);
        res.json({result:products});
    } catch (error) {
        console.log(error.message);

    }
}

const loadSearchedProductsPage=async(req,res)=>{
    try {
        let query=req.query.search;
        let products=await productModel.find({title:{$regex: new RegExp(`.*${query}.*`,'i')}}).limit(10)
        res.json(products)
    } catch (error) {
        console.log(error.message);
        
    }
}


module.exports={
    loadProducts,
    loadBoys,
    loadGirls,
    loadProduct,
    loadFilteredProducts,
    searchProduct,
    loadSearchedProductsPage
}