const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({
    orderid: {
        type: String,
        
    },
    shopid: {
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
    products: [],
    
    totalcost: {
        type: String,
        
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
        type:Date
    },
    iscancel:{
        type: String,
    }
})
module.exports = mongoose.model('Order', orderSchema) 