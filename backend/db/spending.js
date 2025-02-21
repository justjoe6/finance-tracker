const mongoose = require("mongoose")

let spendingSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String
})

module.exports = mongoose.model("spendings",spendingSchema)