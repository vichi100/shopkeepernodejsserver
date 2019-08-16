const bcrypt = require('bcryptjs');
var uuid = require("uuid");
const Event = require('../../models/event');
const User = require('../../models/user');
const Customer = require('../../models/customer');
const Shop = require('../../models/shop');
const Product = require('../../models/product');
const Order = require('../../models/order');

/*
1) get all orders of one shop by using shopid
2) get all orders of one customer by using customerid
3) get customer detail on one customer by using customerid
3) get all product

*/

const events = async eventIds => {
  try {
    const events = await Event.find({ _id: { $in: eventIds } });//  find by mutiple ids
    events.map(event => {
      return {
        ...event._doc,
        _id: event.id,
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, event.creator)
      };
    });
    return events;
  } catch (err) {
    throw err;
  }
};

const user = async userId => {
  try {
    const user = await User.findById(userId);
    return {
      ...user._doc,
      _id: user.id,
      createdEvents: events.bind(this, user._doc.createdEvents)
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {

  customerDetails: async (customerid) =>{
    try{
      const customer = await Customer.find({ _id: customerid });
      console.log(customer)
      return customer
    }catch(err){
      console.log(err)
    }

  },

  products: async () => {
    try {
      const products = await Product.find()
      console.log(products)
      return products
    } catch (err) {
      throw err;
    }
  },

  events: async () => {
    try {
      const events = await Event.find();
      return events.map(event => {
        return {
          ...event._doc,
          _id: event.id,
          date: new Date(event._doc.date).toISOString(),
          creator: user.bind(this, event._doc.creator)
        };
      });
    } catch (err) {
      throw err;
    }
  },

  shops : async () => {
    try {
      console.log('in shops')
      const shops = await Shop.find();//  find by mutiple ids
      
      return shops;
    } catch (err) {
      throw err;
    }
  },
  createEvent: async args => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: '5c0fbd06c816781c518e4f3e'
    });
    let createdEvent;
    try {
      const result = await event.save();
      createdEvent = {
        ...result._doc,
        _id: result._doc._id.toString(),
        date: new Date(event._doc.date).toISOString(),
        creator: user.bind(this, result._doc.creator)
      };
      const creator = await User.findById('5c0fbd06c816781c518e4f3e');

      if (!creator) {
        throw new Error('User not found.');
      } 
      creator.createdEvents.push(event);
      await creator.save();

      return createdEvent;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
  createUser: async args => {
    try {
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser) {
        throw new Error('User exists already.');
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword
      });

      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id };
    } catch (err) {
      throw err;
    }
  },

  createCustomer: async args =>{
    try{
      // check if customer already exist
      const existCustomer = await Customer.findOne({customermobile: args.customerInput.customermobile})
      if(existCustomer){
        throw new Error('Customer exists already.');
      }

      let customerid = new Date().getTime()
      const customer = new Customer({
        customerid: customerid,
        customername: args.customerInput.customername,
        customernamebyshop: args.customerInput.customernamebyshop,
        customermobile: args.customerInput.customermobile,
        deliveryaddress: args.customerInput.deliveryaddress,
      })

      const result = await customer.save();
      return { ...result._doc,  _id: result.id };

    }catch(err){
      throw err
    }

  },

  createShop: async args =>{
    try{
      //check if shop already exist. if shop already exist only owner of mob can modify the shop details.
      // console.log('Shop Mobile'+args.shopInput.shopmobile)
      // const existShop = await Shop.findOne({shopmobile: args.shopInput.shopmobile})
      // if(existShop){
      //   throw new Error('Shop exists already.');
      // }
      console.log('new shop req')
      let shopid = new Date().getTime();
      const shop = new Shop({
        shopid: shopid,
        shopname:args.shopInput.shopname,
        shopaddress: args.shopInput.shopaddress,
        shopmobile: args.shopInput.shopmobile,
        alternatemobile: args.shopInput.alternatemobile,
        city: args.shopInput.city
      })

      const result  = await shop.save();
      return { ...result._doc,  _id: result.id };

    }catch(err){
      throw err
    }

  },

  createOrder: async args =>{
    try{
      
      console.log('new oredr req: '+JSON.stringify(args.orderInput))
      let orderid = uuid.v4();;
      const order = new Order({ 
        orderid: orderid,
        shopid: args.orderInput.shopid,
        customerid: args.orderInput.customerid,
        customername: args.orderInput.customername,
        customermobile: args.orderInput.customermobile,
        deliveryaddress: args.orderInput.deliveryaddress,
        totalcost: args.orderInput.totalcost,
        dilevirystatus: args.orderInput.dilevirystatus,
        paymentstatus: args.orderInput.paymentstatus,
        paymentmode: args.orderInput.paymentmode,
      })

      const result  = await order.save();
      return { ...result._doc,  _id: result.id };

    }catch(err){
      console.log(err)
      throw err
      
    }

  }
};
