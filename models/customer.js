const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    
    customerid:{
        type: String,
      required: true
    },

    expotoken:{
        type: String,
    },

    customername:{
        type: String,
      required: true
    },
    customernamebyshop:{
        type: String,

    },
    customermobile:{
        type: String,
        required: true
    },
    customeraddresslineone:{
        type: String,
    },
    customeraddresslinetwo:{
        type: String,
    },
    city:{
        type: String,
    },
    landmark:{
        type: String,
    },
    latlong:{
        type: String
    },
    pincode:{
        type: String
    },
    
    shops:[
        {
            type: String,
          }
    ],

    createdatetime:{
        type: Date
    },
    updatedatetime:{
        type:Date,
        
    },
    
    isRegisteredByShop:{
        type: String
    },
    isRegisteredByCustomer:{
        type:String
    }

    
  });

  module.exports = mongoose.model('Customer', customerSchema);