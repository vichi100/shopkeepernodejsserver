const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    customerid:{
        type: String,
      required: true
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
    deliveryaddress:{
        type: String,
    },
    shops:[
        {
            type: Schema.Types.ObjectId,
            ref: 'Shop'
          }
    ],
    isRegistered:{
        type: String
    }

    
  });

  module.exports = mongoose.model('Customer', customerSchema);