const express = require("express");
require("./db/config.js");
const User = require("./db/user");
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


app.listen(5000);