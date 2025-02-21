const mongoose = require("mongoose")

const monthSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String,
    removed:{ type: [[String]], default: [] },
    permaRemoveYear:{ type: Number, default: -1 },
    permaRemoveMonth:{ type: Number, default: -1 }
})

module.exports = mongoose.model("monthlies",monthSchema)