const express=require('express')
const app = express()

// app.use(express.urlencoded({extended:true}))
// app.use(express.json())

app.get('/',(req,res)=>{
    res.send('Welcome')
   console.log(req); // will print the whole request
})

// app.get('/:name',(req,res)=>{  //sending a param and dispalying it in the response
//     console.log(req.params);
// var name = req.params.name
// res.send(`hi ${name}`)
// })

app.get('/user',(req,res)=>{   // add query value at the end of url using ? and join multiple values with & operator eg: /user?name=sreedevi&age=32
    var name=req.query.name
    var data=JSON.stringify(req.query)
    res.send(`<h1>Hi ${name}</h1> <p><h3> The query parameters are</h3> <p> ${data}</p></p>`)
})

app.get('/Id/:id/Name/:name',(req,res)=>{     // sending multiple params and dispalying it as a json object in the response  eg:/user/:name/:id
    var q=req.query.id
    res.send({
        Id:req.params.id,
        Name:req.params.name
    }) 
})

app.listen(5000,()=>{
    console.log('Server started...');
})
