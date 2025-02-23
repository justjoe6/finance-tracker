const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    picurl:String
})

module.exports = mongoose.model("users",userSchema)
