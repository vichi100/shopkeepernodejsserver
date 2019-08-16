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
    city:{
        type: String,
    }
    ,
    alternatemobile:{
        type: String
    }

})

module.exports = mongoose.model('Shop', shopSchema);