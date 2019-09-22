const express = require("express");
var uuid = require("uuid");

const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");

const graphQlSchema = require("./graphql/schema/index");
const graphQlResolvers = require("./graphql/resolvers/index");

const Customer = require("./models/customer");
const Order = require("./models/order");

const app = express();

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    //"Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  "/graphql",
  graphqlHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
  })
);

app.post("/createCustomers", function(req, res) {
  createCustomers(req, res);
});

app.post("/customerDetails", function(req, res) {
  customerDetails(req, res);
});

app.post("/insertOrder", function(req, res) {
  insertOrder(req, res);
});

app.post("/ordersByShopId", function(req, res) {
  console.log("ordersByShopId");
  getOrdersByShopId(req, res);
});

app.post("/updateOrderDetails", function(req, res) {
  console.log("updateOrderDetails");

  // orderid: orderItem.orderid,
  //       totalcost: orderItem.totalcost,
  //       products: orderItem.product,
  //       deliverystatus: status,

  updateOrderDetails(req, res);
});

app.post("/fetchOrderChartData", function(req, res) {
  console.log("fetchOrderChartData");
  fetchOrderChartData(req, res);
});

function fetchOrderChartData(req, res) {
  const orderSummaryQueryData = req.body;
  var dailySalesData = []
  var monthlySalesData = []
  var todayDate = new Date(Date.now());
  var endDate =  new Date(new Date().setDate(new Date().getDate()-60));

  console.log('startDate: '+todayDate+', endDate: '+endDate)    
// https://www.tutorialspoint.com/group-by-dates-in-mongodb#
  Order.aggregate([
    {$match : { "updatedatetime" : { "$gte": endDate} }},
    {$group:{
      _id:{
        $add:[{ $dayOfYear : new Date("$updatedatetime" )}],
      },
      totalSale:{
        $sum: "$totalcost"
      },
      f: {$min: "$updatedatetime"}
    }},
    { $sort : { _id : -1 } },
    { $project: { date: "$f", totalSale: 1, _id: 0} }
  
  ]).exec(function ( err, data ) {
    console.log( 'data: '+JSON.stringify(data )) 
    console.log( 'err: '+JSON.stringify(err )) 

});
  
}


function updateOrderDetails(req, res) {
  console.log("updateOrderDetails: " + JSON.stringify(req.body));
  const orderUpdateData = req.body;
  const status = orderUpdateData.status;
  console.log("status: " + status);
  if (status === "packed" || status === "ofd" || status === "completed") {
    Order.updateOne(
      { orderid: orderUpdateData.orderid },
      {
        $set: {
          totalcost: orderUpdateData.totalcost,
          products: orderUpdateData.products,
          deliverystatus: status,
          updatedatetime: new Date(Date.now())
        }
      },
      function(err, data) {
        if (err) {
          console.log(err);
          return;
        }

        console.log("data: " + data);
        if (data.length !== 0) {
          console.log("In delivery status: " + JSON.stringify(data));
          res.send(JSON.stringify(data));
          res.end();
          return;
        }
      }
    );
  } else if (
    status === "pending" ||
    status === "credit" ||
    status === "received"
  ) {
    Order.updateOne(
      { orderid: orderUpdateData.orderid },
      {
        $set: {
          totalcost: orderUpdateData.totalcost,
          products: orderUpdateData.products,
          paymentstatus: orderUpdateData.status,
          updatedatetime: new Date(Date.now())
        }
      },
      function(err, data) {
        if (err) {
          console.log(err);
          return;
        }

        console.log("data: " + data);
        if (data.length !== 0) {
          console.log("In payment status: " + JSON.stringify(data));
          res.send(JSON.stringify(data));
          res.end();
          return;
        }
      }
    );
  } else if (status === "cancelorder") {
    Order.updateOne(
      { orderid: orderUpdateData.orderid },
      { $set: { iscancel: "yes", updatedatetime: new Date(Date.now()) } },
      function(err, data) {
        if (err) {
          console.log(err);
          return;
        }

        console.log("data: " + data);
        if (data.length !== 0) {
          console.log("In payment status: " + JSON.stringify(data));
          res.send(JSON.stringify(data));
          res.end();
          return;
        }
      }
    );
  }
}

function getOrdersByShopId(req, res) {
  console.log("ordersByShopId 2: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  console.log("ordersByShopId 2: " + shopid);

  Order.find({ shopid: shopid }, function(err, data) {
    if (err) {
      console.log(err);
      return;
    }
    // console.log('data: '+ data)
    var totalCostOfNewOrder = 0;
    var totalNumberOfNewOrder = 0;
    var totalCostOfPendingOrder = 0;
    var totalNumberOfPendingOrder = 0;
    var totalCostOfCompletedOrder = 0;
    var totalNumberOfCompletedOrder = 0;
    if (data.length !== 0) {
      // console.log("customer is present: " + JSON.stringify(data));
      data.map(function(item) {
        // console.log("one item: " + JSON.stringify(item));
        // console.log("total cost: " + item.totalcost);
        if (item.deliverystatus === "new") {
          totalCostOfNewOrder =
            parseFloat(totalCostOfNewOrder) + parseFloat(item.totalcost);
          totalNumberOfNewOrder = totalNumberOfNewOrder + 1;
        }

        if (item.deliverystatus === "ofd" || item.deliverystatus === "packed") {
          totalCostOfPendingOrder =
            parseFloat(totalCostOfPendingOrder) + parseFloat(item.totalcost);
          totalNumberOfPendingOrder = totalNumberOfPendingOrder + 1;
        }

        if (item.deliverystatus === "completed" || item.paymentstatus === 'credit' || item.paymentstatus === 'received') {
          totalCostOfCompletedOrder =
            parseFloat(totalCostOfCompletedOrder) +
            parseFloat(item.totalcost);
          totalNumberOfCompletedOrder = totalNumberOfCompletedOrder + 1;
        }
      });
       var ordersummary = {
        totalcostofneworder: totalCostOfNewOrder,
        totalnumberofneworder: totalNumberOfNewOrder,
        totalcostofpendingorder: totalCostOfPendingOrder,
        totalnumberofpendingorder: totalNumberOfPendingOrder,
        totalcostofcompletedorder: totalCostOfCompletedOrder,
        totalnumberofcompletedorder: totalNumberOfCompletedOrder
      };

      //data.ordersummary = ordersummary;
      // people = {...people, city:{estate: 'Alabama'}};
      var dataStr = JSON.stringify(data);
      // var newRespObj = JSON.parse(newRespDataStr);
      // newRespObj['ordersummary'].push(ordersummary)
      var newRespData = [];
      newRespData = {...newRespData, ordersummary: ordersummary}
      newRespData = {...newRespData, orderdata: data}

      // var newRespData = {};
      // newRespData['ordersummary'].push(ordersummary);
      // newRespData['orderdata'].push(dataStr)


      console.log('response data:  '+ JSON.stringify(newRespData))
      res.send(JSON.stringify(newRespData));
      res.end();
      return;
    }
  });
}

function insertOrder(req, res) {
  console.log("insertOrder data: " + JSON.stringify(req.body));
  const orderData = req.body;
  console.log("orderData.products: " + orderData.products);
  for(var i = 0; i < 5;i++){
    const orderid = uuid.v4();

    const orderObj = {
      orderid: orderid,
      shopid: orderData.shopid,
      shopname: orderData.shopname,
      customerid: orderData.customerid,
      customername: orderData.customername,
      customermobile: orderData.customermobile,
      deliveryaddress: orderData.deliveryaddress,
      products: orderData.products,
      totalcost: orderData.totalcost,
      deliverystatus: orderData.deliverystatus,
      paymentstatus: orderData.paymentstatus,
      paymentmode: orderData.paymentmode,
      iscancel: orderData.iscancel,
      createdatetime: new Date(new Date().setDate(new Date().getDate()-i)), 
      updatedatetime: new Date(new Date().setDate(new Date().getDate()-i)), 
    };
    //var endDate =  new Date(new Date().setDate(new Date().getDate()-60));

    Order.collection.insertOne(orderObj, { ordered: false }, function(err, docs) {
      if (err) {
        console.log("Order documents not inserted to Collection");
        res.send(JSON.stringify("fail"));
        res.end();
        return console.error(err);
      } else {
        console.log("Order documents inserted to Collection");
        
      }
    });

  }

  res.send(JSON.stringify("success"));
  res.end();
  
}
function customerDetails(req, res) {
  const customermobileStr = JSON.stringify(req.body);
  const customerData = JSON.parse(customermobileStr);
  console.log(customerData);
  const customermobile = customerData.customerid;
  console.log(customermobile);
  Customer.findOne({ customermobile: customermobile }, function(err, data) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("data: " + data);
    if (data.length !== 0) {
      console.log("customer is present: " + data.customername);
      res.send(JSON.stringify(data));
      res.end();
      return;
    }
  });
}

function createCustomers(req, res) {
  // console.log(
  //   "createCustomers: post data: " + JSON.stringify(req.body)
  // );
  var customerDataArray = [];
  const customerDataStr = JSON.stringify(req.body);
  const customerData = JSON.parse(customerDataStr);
  var isRegistered = "no";
  console.log("contact size: " + customerData.length);
  for (var i = 0; i < customerData.length; i++) {
    const customerid = uuid.v4(); //new Date().getTime();
    const customername = customerData[i].name;
    var customermobile = customerData[i].mobile;
    try {
      if (customermobile !== null || customermobile !== undefined) {
        customermobile = customermobile.replace(/\s/g, "");
      }
      // check if customer is present then dont add to array
      // Customer.find({ customermobile: customermobile }, function(err, data) {
      //   if (err) {
      //     console.log(err);
      //     return;
      //   }
      //   console.log('data: '+ data)
      //   if (data.length !== 0) {
      //     console.log("customer is present: " + data[0].customername);
      //     return;
      //   }

      // });
      const obj = {
        _id: customermobile,
        customerid: customerid,
        customername: customername,
        customermobile: customermobile,
        deliveryaddress: null,
        shops: [],
        isRegistered: isRegistered
      };
      customerDataArray.push(obj);
    } catch (err) {
      console.log(err);
    }
  }
  Customer.collection.insertMany(
    customerDataArray,
    { ordered: false },
    function(err, docs) {
      if (err) {
        console.log("Multiple documents not inserted to Collection");
        res.send(JSON.stringify("fail"));
        res.end();
        return console.error(err);
      } else {
        console.log("Multiple documents inserted to Collection");
        res.send(JSON.stringify("success"));
        res.end();
      }
    }
  );
}

// mongoose
//   .connect(
//     `mongodb+srv://${process.env.MONGO_USER}:${
//       process.env.MONGO_PASSWORD
//     }@cluster0-ntrwp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
//   )
//   .then(() => {
//     app.listen(3000);
//   })
//   .catch(err => {
//     console.log(err);
//   });

// Connect to DB
mongoose
  .connect(
    "mongodb+srv://vichi:vichi123@cluster0-1ys3l.gcp.mongodb.net/test?retryWrites=true&w=majority"
  )
  .then(() => {
    // app.listen(6000 ,'0.0.0.0');
    app.listen(6040, "192.168.0.186", () => {
      console.log("server is listening on 9000 port");
    });

    console.log("MongoDB connected...server listening at 3000");
  })
  .catch(err => console.log(err));
