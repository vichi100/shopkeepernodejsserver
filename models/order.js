const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({
    orderid: {
        type: String,
        
    },
    shopid: {
        type: String,
        
    },
    shopname:{
        type: String,
    },
    shopmobile:{
        type: String,
    },
    shopaddress:{
        type: String,
       
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

    customeraddress: {
        type: String,
        
    },
    voiceorderurl:{
        type: String,
        
    },

    products: [],
    
    totalcost: {
        type: Number,
        
    },
    partialpaymentamount:{
        type: Number
    },
    
    deliverystatus: {
        type: String,
        
    },
    paymentstatus: {
        type: String,
        
    },
    
    paymentmode: {
        type: String,
         
    },
    createdatetime:{
        type: Date
    },
    updatedatetime:{
        type:Date,
        
    },
    iscancel:{
        type: String,
    },
    createdby:{
        type:String
    }
})
module.exports = mongoose.model('Order', orderSchema) 