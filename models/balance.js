const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const balanceSchema = new mongoose.Schema({
    
    shopid: {
        type: String,
        
    },
    shopname:{
        type: String,
    },
    shopmobile:{
        type:String
    },
    customerid: {
        type: String,
        
    },
    customername: {
        type: String,
        
    },
    customermobile: {
        type: String,
        
    },
    balanceamount:{
        type: Number,
    },
    nonadjustedamount:{
        type: Number,
    },
    updatedatetime:{
        type:Date,
        
    },
})
module.exports = mongoose.model('Balance', balanceSchema) 