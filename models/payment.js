const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const paymentSchema = new mongoose.Schema({
    paymentid: {
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
    customerid: {
        type: String,
        
    },
    customername: {
        type: String,
        
    },
    customermobile: {
        type: String,
        
    },

    deliveryaddress: {
        type: String,
        
    },
    creditordersamount:{
        type: Number,
    },
    
    receiveamount: {
        type: Number,
        
    },
    previousbalanceamount:{
        type: Number,
    },
    balanceafterreceivingpayment: {
        type: Number,
        
    },
    paymentsbyorderid:[],

    haschangedorderstatus:{
        type: String,
    },

    createdatetime:{
        type: Date
    },
    updatedatetime:{
        type:Date,
        
    },
})
module.exports = mongoose.model('Payment', paymentSchema) 