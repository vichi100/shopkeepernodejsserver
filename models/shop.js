const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const shopSchema = new Schema({

    shopid:{
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
    shopcategory:{
        type: String,
    },

    latlong:{
        type: String
    },
    pincode:{
        type: String
    },

    city:{
        type: String,
    }
    ,
    alternatemobile:{
        type: String
    },
    expotoken:{
        type: String
    },
    createdatetime:{
        type: Date
    },
    updatedatetime:{
        type:Date,
        
    },

})

module.exports = mongoose.model('Shop', shopSchema);