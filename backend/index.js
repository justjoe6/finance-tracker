const express = require("express");
require("./db/config.js");
const User = require("./db/user");
const Spending = require("./db/spending.js")
const app = express();
const cors = require("cors")

app.use(express.json())
app.use(cors())

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


app.listen(5000);