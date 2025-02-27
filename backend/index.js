const express = require("express");
require("./db/config.js");
const User = require("./db/user");
const Spending = require("./db/spending.js")
const SpendingMonthly = require("./db/monthly.js")
const SpendingAnnually = require("./db/annually.js")
const AWS = require('aws-sdk');
const multer = require('multer');
const keyID = process.env.KEYID
const secAcc = process.env.SECACC
const region = process.env.REGION

const app = express();
const cors = require("cors")

app.use(express.json())
app.use(cors())

AWS.config.update({
    accessKeyId: keyID,
    secretAccessKey: secAcc,
    region: region
})

const s3 = new AWS.S3()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const uploadToS3 = (file) => {
    const params = {
        Bucket: 'financetrackerprofileimages', 
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype
    }
    return s3.upload(params).promise()
}

app.delete("/user/:id", async (req,rsp)=>{
    let id = req.params.id
    try{
        let spendResult = await Spending.deleteMany({userId:id})
        let monthResult = await SpendingMonthly.deleteMany({userId:id})
        let annualResult = await SpendingAnnually.deleteMany({userId:id})
        let userResult = await User.deleteOne({_id:id})
        rsp.send({spendResult,monthResult,annualResult,userResult,success:true})
    }catch(err){
        rsp.send({msg:"Unable to process request",success:false})
    }

    
})


app.put("/upload/:id", upload.single("image"), async (req,res)=>{
    if (!req.file) {
        return res.send("No file uploaded")
    }

    const uploadResult = await uploadToS3(req.file)
    const picurl = uploadResult.Location
    let result = await User.updateOne({_id:req.params.id},{
        $set:{picurl}
    })


    res.send({
        message: "Image uploaded successfully",
        imageUrl: picurl
    })
})


app.post("/signup", async (req,rsp)=>{
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject()
    delete result.password
    rsp.send(result)
})

app.post("/login",async (req,rsp)=>{
    let user = await User.findOne(req.body).select("-password")
    if(!user){
        rsp.send({"Result":"No User Found"})
        return
    }

    rsp.send(user)
})

app.post("/add-spend",async (req,rsp)=>{
    let spending = new Spending(req.body)
    result = await spending.save()
    rsp.send(result.toObject())
})

app.post("/add-monthly",async (req,rsp)=>{
    let monthlySpend = new SpendingMonthly(req.body)
    result = await monthlySpend.save()
    console.log(result)
    rsp.send(result.toObject())
})

app.post("/add-annually",async (req,rsp)=>{
    let annualSpend = new SpendingAnnually(req.body)
    result = await annualSpend.save()
    rsp.send(result.toObject())
})

app.get("/spendings/:year/:month/:id", async (req,rsp)=>{

    let result = await Spending.find({
        year: req.params.year,       
        month: req.params.month,     
        userId: req.params.id   
      })    
      rsp.send(result)
})
app.get("/monthlyspendings/:id/:month/:year", async (req,rsp)=>{
    let result = await SpendingMonthly.find({userId:req.params.id, removed: { $not: {
        $elemMatch: { $eq: [[req.params.month, req.params.year]] } 
    } }})
    const filteredResult = result.filter((doc) => {
        return (doc.year <= parseInt(req.params.year) && doc.month <= parseInt(req.params.month) && (doc.permaRemoveMonth===-1 || (doc.permaRemoveMonth!==-1 && parseInt(req.params.year) <= doc.permaRemoveYear && parseInt(req.params.month) < doc.permaRemoveMonth)))
    });
    rsp.send(filteredResult)
})
app.get("/monthlyspendings/:id", async (req,rsp)=>{
    let result = await SpendingMonthly.find({userId:req.params.id,permaRemoveMonth:-1,permaRemoveYear:-1})
    rsp.send(result)
})
app.get("/annualspendings/:id/:year", async (req,rsp)=>{
    let result = await SpendingAnnually.find({userId:req.params.id,removed: { $nin: [req.params.year] }})
    const filteredResult = result.filter((doc) => {
        return (doc.year <= parseInt(req.params.year) && (doc.permaRemoveYear===1 || (doc.permaRemoveYear !== -1 && parseInt(req.params.year) < doc.permaRemoveYear)) )
    });
    rsp.send(filteredResult)
})

app.delete("/deletespending/:id",async (req,rsp)=>{
    let id = req.params.id
    let result = await Spending.deleteOne({_id:id})
    rsp.send(result)
})

app.put("/updatemonthly/:id/:month/:year",async (req,rsp)=>{
    let result = await SpendingMonthly.updateOne({_id:req.params.id},{
        $push:{removed:[[req.params.month,req.params.year]]}
    })
    rsp.send(result)
})
app.put("/updateannual/:id/:year",async (req,rsp)=>{
    let result = await SpendingAnnually.updateOne({_id:req.params.id},{
        $push:{removed:[req.params.year]}
    })
    rsp.send(result)
})

app.put("/deletesmonthlypending/:id/:month/:year",async (req,rsp)=>{
    let id = req.params.id
    let permaRemoveMonth = parseInt(req.params.month)
    let permaRemoveYear = parseInt(req.params.year)
    let result = await SpendingMonthly.updateOne({_id:id},{
        $set:{permaRemoveMonth,permaRemoveYear}
    })
    rsp.send(result)
})

app.get("/annualspendings/:id", async (req,rsp)=>{
    let result = await SpendingAnnually.find({userId:req.params.id,permaRemoveYear:-1})
    rsp.send(result)
})

app.put("/deleteannualspending/:id/:year",async (req,rsp)=>{
    let id = req.params.id
    let permaRemoveYear = parseInt(req.params.year)
    let result = await SpendingAnnually.updateOne({_id:id},{
        $set : {permaRemoveYear}
    })
    rsp.send(result)
})

app.put("/updatepassword/:id",async (req,rsp)=>{
    let result = await User.updateOne({_id:req.params.id},{
        $set:req.body
    })
    if(!result){
        rsp.send({result:"Error updating password"})
        return
    }
    rsp.send({result:"Updated password"})
})
app.put("/updateusername/:id",async (req,rsp)=>{
    let result = await User.updateOne({_id:req.params.id},{
        $set:req.body
    })
    if(!result){
        rsp.send({result:"Error updating username"})
        return
    }
    rsp.send({result:"Updated username"})
})

app.listen(5000);
