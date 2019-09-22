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
  // createCustomers(req, res);
  customersFromShop(req, res);
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
  var chartSalesData;
  var dailySalesData = [];
  var monthlySalesData = [];
  var todayDate = new Date(Date.now());
  var endDate = new Date(new Date().setDate(new Date().getDate() - 30));
  var dailyTopCustomer;
  var dailySalesData;

  console.log("startDate: " + todayDate + ", endDate: " + endDate);
  // https://www.tutorialspoint.com/group-by-dates-in-mongodb#
  //https://docs.huihoo.com/mongodb/3.4/reference/operator/aggregation/sum/index.html
  //https://docs.huihoo.com/mongodb/3.4/reference/operator/aggregation/sum/index.html

  Order.aggregate([
    { $match: { updatedatetime: { $gte: endDate }, shopid: "vichishop" } },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$updatedatetime" },
          month: { $month: "$updatedatetime" },
          year: { $year: "$updatedatetime" }
        },
        totalAmount: { $sum: "$totalcost" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.day": 1 } }
  ]).exec(function(err, data) {
    // console.log("data: " + JSON.stringify(data));
    // console.log("err: " + JSON.stringify(err));
    if (err) {
      console.log("fetchOrderChartData fail");
      res.send(JSON.stringify("fail"));
      res.end();
      return console.error(err);
    } else {
      // chartSalesData.push({
      //   'dailySalesData': data
      // })

      dailySalesData = data;
      // top 15 buyer of the day Query need to change
      Order.aggregate([
        { $match: { updatedatetime: { $gte: endDate }, shopid: "vichishop" } },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$updatedatetime" },
              month: { $month: "$updatedatetime" },
              year: { $year: "$updatedatetime" },
              customerid: "$customerid",
              customername: "$customername"
            },

            totalAmount: { $sum: "$totalcost" },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 15 }
      ]).exec(function(err, data) {
        // console.log("data: " + JSON.stringify(data));
        // console.log("err: " + JSON.stringify(err));
        if (err) {
          console.log("fetchOrderChartData fail");
          res.send(JSON.stringify("fail"));
          res.end();
          return console.error(err);
        } else {
          // chartSalesData.push({
          //   'dailyTopCustomer': data
          // })

          dailyTopCustomer = data;
          // top 15 buyer of the month
          Order.aggregate([
            {
              $match: { updatedatetime: { $gte: endDate }, shopid: "vichishop" }
            },
            {
              $group: {
                _id: {
                  month: { $month: "$updatedatetime" },
                  year: { $year: "$updatedatetime" },
                  customerid: "$customerid",
                  customername: "$customername"
                },

                totalAmount: { $sum: "$totalcost" },
                count: { $sum: 1 }
              }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 15 }
          ]).exec(function(err, data) {
            // console.log("data: " + JSON.stringify(data));
            // console.log("err: " + JSON.stringify(err));
            if (err) {
              console.log("fetchOrderChartData fail");
              res.send(JSON.stringify("fail"));
              res.end();
              return console.error(err);
            } else {
              // chartSalesData.push({
              //   'monthlyTopCustomer': data
              // })
              monthlyTopCustomer = data;
              chartSalesData = {
                monthlyTopCustomer: monthlyTopCustomer,
                dailyTopCustomer: dailyTopCustomer,
                dailySalesData: dailySalesData
              };
              res.send(JSON.stringify(chartSalesData));
              res.end();
              console.log(
                "Top Buyer Data Month: " + JSON.stringify(chartSalesData)
              );
              return;
            }
          });

          return;
        }
      });

      // res.send(JSON.stringify(data));
      // res.end();
      // return;
    }
  });

  // // top 15 buyer of the day

  // Order.aggregate(
  //   [
  //     {$match : { "updatedatetime" : { "$gte": endDate}, shopid: 'vichishop' }},
  //     {
  //       $group:
  //         {
  //           _id: { day: { $dayOfMonth: "$updatedatetime"}, month: {$month: "$updatedatetime"}, year: { $year: "$updatedatetime" }, customerid: '$customerid', customername: '$customername' },

  //           totalAmount: { $sum: "$totalcost"},
  //           count: { $sum: 1 }
  //         }
  //     },
  //     { $sort : { 'totalAmount' : -1, } },
  //     { $limit: 15 }

  //   ]
  // ).exec(function ( err, data ) {
  //       console.log( 'data: '+JSON.stringify(data ))
  //       console.log( 'err: '+JSON.stringify(err ))
  //       if (err) {
  //         console.log("Err: "+err);
  //         // res.send(JSON.stringify("fail"));
  //         // res.end();
  //         // return console.error(err);
  //       } else {
  //         // res.send(JSON.stringify(data));
  //         // res.end();
  //         // console.log('Top Buyer Data: '+JSON.stringify(data));
  //         return;
  //       }

  //   });

  //   // top 15 buyer of the month

  // Order.aggregate(
  //   [
  //     {$match : { "updatedatetime" : { "$gte": endDate}, shopid: 'vichishop' }},
  //     {
  //       $group:
  //         {
  //           _id: { month: {$month: "$updatedatetime"}, year: { $year: "$updatedatetime" }, customerid: '$customerid', customername: '$customername' },

  //           totalAmount: { $sum: "$totalcost"},
  //           count: { $sum: 1 }
  //         }
  //     },
  //     { $sort : { 'totalAmount' : -1, } },
  //     { $limit: 15 }

  //   ]
  // ).exec(function ( err, data ) {
  //       console.log( 'data: '+JSON.stringify(data ))
  //       console.log( 'err: '+JSON.stringify(err ))
  //       if (err) {
  //         console.log("Err: "+err);
  //         // res.send(JSON.stringify("fail"));
  //         // res.end();
  //         // return console.error(err);
  //       } else {
  //         // res.send(JSON.stringify(data));
  //         // res.end();
  //         console.log('Top Buyer Data Month: '+JSON.stringify(data));
  //         return;
  //       }

  //   });
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

        if (
          item.deliverystatus === "completed" ||
          item.paymentstatus === "credit" ||
          item.paymentstatus === "received"
        ) {
          totalCostOfCompletedOrder =
            parseFloat(totalCostOfCompletedOrder) + parseFloat(item.totalcost);
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
      newRespData = { ...newRespData, ordersummary: ordersummary };
      newRespData = { ...newRespData, orderdata: data };

      // var newRespData = {};
      // newRespData['ordersummary'].push(ordersummary);
      // newRespData['orderdata'].push(dataStr)

      console.log("response data:  " + JSON.stringify(newRespData));
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
  for (var i = 0; i < 5; i++) {
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
      createdatetime: new Date(new Date().setDate(new Date().getDate())),
      updatedatetime: new Date(new Date().setDate(new Date().getDate()))
    };
    //var endDate =  new Date(new Date().setDate(new Date().getDate()-60));

    Order.collection.insertOne(orderObj, { ordered: false }, function(
      err,
      docs
    ) {
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

function customersFromShop(req, res) {
  // 1) first get the list of customer from db for that perticular shop
  // 2) now get minus of the two customer list from db and shop mobile
  // 3) insert diffrence in db
  // 4) show onner will insert name in customernamebyshop and will see this name
  // 5) customer will eneter his name in customername column

  // https://stackoverflow.com/questions/25285232/bulk-upsert-in-mongodb-using-mongoose
  
  var bulk = Customer.collection.initializeOrderedBulkOp();
  var counter = 0;
  const customerDataStr = JSON.stringify(req.body);
  const customerData = JSON.parse(customerDataStr);
  var isRegistered = "no";

  for (var i = 0; i < customerData.length; i++) {
    const customerid = uuid.v4(); //new Date().getTime();
    const customername = customerData[i].name;
    var customermobile = customerData[i].mobile;
    try {
      if (customermobile !== null || customermobile !== undefined) {
        customermobile = customermobile.replace(/\s/g, "");
      }
    } catch (err) {
      console.log(err);
    }

    bulk
      .find({ _id: customermobile })
      .upsert()
      .update({
        $setOnInsert: {
          _id: customermobile,
          customerid: customerid,
          customername: null,
          customernamebyshop: customername,
          customermobile: customermobile,
          deliveryaddress: null,
          createdatetime: new Date(Date.now()),
          isRegisteredByShop: 'yes',
          isRegisteredByCustomer: 'no'
        },

        $set: {  updatedatetime: new Date(Date.now()) },
        $addToSet: { shops: "1234" }
      });
    counter++;

    // if (counter % 1000 == 0)
    //   bulk.execute(function(err, result) {
    //     bulk = Customer.collection.initializeOrderedBulkOp();
    //   });

    // if (counter % 1000 != 0)
    //   bulk.execute(function(err, result) {
    //     // maybe do something with result
    //   });
  }

  bulk.execute(function(err, result) {
    // maybe do something with result
    console.log("insert done err: " + err);
    console.log("insert done result: " + err);
    if (err === null) {
      Customer.find({ shops: "1234" }, function(err, data) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify("fail"));
          res.end();
          return;
        }
        console.log('data: '+ data)
        if (data.length !== 0) {
          res.send(JSON.stringify(data));
          res.end();
          console.log("customer is present: " + JSON.stringify(data));
          return;
        }else{
    
        }
    
      });
    }
  });
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
      res.send(JSON.stringify("fail"));
      res.end();
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
        return console.error(
          "Error in create customer: " + JSON.stringify(err.writeErrors[0])
        );
      } else {
        console.log("Multiple documents inserted to Collection");
        console.log("Multiple documents inserted to Collection: " + docs);
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
    app.listen(6050, "192.168.0.186", () => {
      console.log("server is listening on 9000 port");
    });

    console.log("MongoDB connected...server listening at 3000");
  })
  .catch(err => console.log(err));
