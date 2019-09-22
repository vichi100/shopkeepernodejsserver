const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const productSchema = new mongoose.Schema({
    productid: {
        type: String,
        
    },
	productname: {
        type: String,
        
    },
    brand: {
        type: String,
        
    },
    category: {
        type: String,
        
    },
    description: {
        type: String,
        
    },
    weight: {
        type: String,
        
    },
    price: {
        type: Number,
        
    },
    searchtags: {
        type: String,
        
    },
    imageurl: {
        type: String,
        
    },
    
   
	
})

module.exports = mongoose.model('Product', productSchema) 