const mongoose = require("mongoose");


const annualSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String,
    removed:{ type: [String], default: [] },
    permaRemoveYear:{ type: Number, default: -1 }
})


module.exports = mongoose.model("annuallies",annualSchema)