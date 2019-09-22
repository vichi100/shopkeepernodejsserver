const express = require("express");
var uuid = require("uuid");

const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");

const graphQlSchema = require("./graphql/schema/index");
const graphQlResolvers = require("./graphql/resolvers/index");

const Customer = require("./models/customer");
const Order = require("./models/order");
const Shop = require("./models/shop");
const Payment = require("./models/payment");
const Balance = require("./models/balance");

var moment = require("moment");

var request = require("request");

// Twilio configuration -start
var accountSid = "ACbc43a7a2a3c4fe6cf3eedea6b74399aa"; // Your Account SID from www.twilio.com/console
var authToken = "827902493885adc9b335e38f4507a85a"; // Your Auth Token from www.twilio.com/console

var twilio = require("twilio");
var client = new twilio(accountSid, authToken);

// Twilio configuration -end

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
  updateOrderDetails(req, res);
});

app.post("/fetchOrderChartData", function(req, res) {
  console.log("fetchOrderChartData");
  fetchOrderChartData(req, res);
});

app.post("/fetchCustomerOrderDetails", function(req, res) {
  console.log("fetchCustomerOrderDetails");
  fetchCustomerOrderDetails(req, res);
});

app.post("/fetchDataByDateRange", function(req, res) {
  console.log("fetchDataByDateRange");
  fetchDataByDateRange(req, res);
});

app.post("/fetchShopDetails", function(req, res) {
  console.log("fetchShopDetails");
  fetchShopDetails(req, res);
});

app.post("/updateShopDetails", function(req, res) {
  console.log("updateShopDetails");
  updateShopDetails(req, res);
});

app.post("/addOrUpdateCustomerAddress", function(req, res) {
  console.log("addOrUpdateCustomerAddress");
  addOrUpdateCustomerAddress(req, res);
});

app.post("/updateShopExpoToken", function(req, res) {
  console.log("updateShopExpoToken");
  updateShopExpoToken(req, res);
});

app.post("/registerShop", function(req, res) {
  console.log("registerShop");
  registerShop(req, res);
});

app.post("/creditOrdersByShopId", function(req, res) {
  console.log("creditOrdersByShopId");
  getCreditOrdersByShopId(req, res);
});

app.post("/fetchPaymentDetails", function(req, res) {
  console.log("fetchPaymentDetails");
  fetchPaymentDetails(req, res);
});

app.post("/insertPaymentDetails", function(req, res) {
  console.log("insertPaymentDetails");
  insertPaymentDetails(req, res);
});

function insertPaymentDetails(req, res) {
  console.log("insertPaymentDetails: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  const shopname = req.body.shopname;
  const shopmobile = req.body.shopmobile;
  const customerid = req.body.customerid;
  const customername = req.body.customername;
  const customermobile = req.body.customermobile;
  const deliveryaddress = req.body.deliveryaddress;
  const creditordersamount = req.body.creditordersamount;
  const previousbalanceamount = req.body.previousbalanceamount;
  const receiveamount = req.body.receiveamount;
  const balanceamountafterreceivingpayment =
    req.body.balanceamountafterreceivingpayment;

  var paymentid = new Date().getTime();
  var createdatetime = new Date(Date.now());
  var updatedatetime = new Date(Date.now());

  Payment.collection.insertOne(
    {
      paymentid: paymentid,
      shopid: shopid,
      shopname: shopname,
      shopmobile: shopmobile,
      customerid: customerid,
      customername: customername,
      customermobile: customermobile,
      deliveryaddress: deliveryaddress,
      creditordersamount: creditordersamount,
      previousbalanceamount: previousbalanceamount,
      receiveamount: receiveamount,
      balanceafterreceivingpayment: balanceamountafterreceivingpayment,
      createdatetime: createdatetime,
      updatedatetime: updatedatetime
    },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        updateOrInsertBalanceAfterReceivingPayment(
          shopid,
          shopmobile,
          shopname,
          customerid,
          customername,
          customermobile,
          balanceamountafterreceivingpayment,
          updatedatetime,
          receiveamount
        );
        console.log("insertPaymentDetails" + JSON.stringify(data));
        res.send(JSON.stringify({ paymentid: paymentid }));
        res.end();
        return;
      }
    }
  );
}

function updateOrInsertBalanceAfterReceivingPayment(
  shopid,
  shopmobile,
  shopname,
  customerid,
  customername,
  customermobile,
  balanceamountafterreceivingpayment,
  updatedatetime,
  receiveamount
) {
  
  Order.find(
    { shopid: shopid, customerid: customerid, paymentstatus: "credit" },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        console.log("fetchPaymentDetails: " + JSON.stringify(data));
        var receiveamountX = Number(receiveamount) ;
        data.map(function(creditOrder) {
          var creditOrderAmount = Number(creditOrder.totalcost);
          var orderid = creditOrder.orderid;
          if (receiveamountX >= creditOrderAmount) {
            Order.updateOne(
              {
                shopid: shopid,
                customerid: customerid,
                orderid: orderid
              },
              {
                $set: {
                  paymentstatus: "received",
                  updatedatetime: updatedatetime
                }
              },
              function(err, data) {
                if (err) {
                  console.log(err);
                  return;
                } else {
                  console.log("registerShop" + JSON.stringify(data));
                  receiveamountX = Number(receiveamountX) - Number(creditOrderAmount);
                  Balance.updateOne(
                    { shopid: shopid, customerid: customerid },
                    {
                      $set: {
                        shopname: shopname,
                        shopmobile: shopmobile,
                        customername: customername,
                        customermobile: customermobile,
                        balanceamount: balanceamountafterreceivingpayment,
                        nonadjustedamount: receiveamountX,
                        updatedatetime: updatedatetime
                      }
                    },
                    { upsert: true },
                    function(err, data) {
                      if (err) {
                        console.log(err);
                        // res.send(JSON.stringify("fail"));
                        // res.end();
                        return;
                      } else {
                        console.log("insertPaymentDetails" + JSON.stringify(data));
                        //close credit orders from order document.
                        return;
                      }
                    }
                  );
                }
              }
            );
            
          }
        });

        if (receiveamountX > 0){
          Balance.updateOne(
            { shopid: shopid, customerid: customerid },
            {
              $set: {
                shopname: shopname,
                shopmobile: shopmobile,
                customername: customername,
                customermobile: customermobile,
                balanceamount: balanceamountafterreceivingpayment,
                nonadjustedamount: receiveamountX,
                updatedatetime: updatedatetime
              }
            },
            { upsert: true },
            function(err, data) {
              if (err) {
                console.log(err);
                // res.send(JSON.stringify("fail"));
                // res.end();
                return;
              } else {
                console.log("insertPaymentDetails" + JSON.stringify(data));
                //close credit orders from order document.
                return;
              }
            }
          );
        }
        return;
      }
    }
  );


  
}

function updateOrInsertBalanceAfterReceivingPaymentX(
  shopid,
  shopmobile,
  shopname,
  customerid,
  customername,
  customermobile,
  balanceamountafterreceivingpayment,
  updatedatetime,
  receiveamount
) {
  // var updatedatetime = new Date(Date.now());
  Balance.update(
    { shopid: shopid, customerid: customerid },
    {
      $set: {
        shopname: shopname,
        shopmobile: shopmobile,
        customername: customername,
        customermobile: customermobile,
        balanceamount: balanceamountafterreceivingpayment,
        updatedatetime: updatedatetime
      }
    },
    { upsert: true },
    function(err, data) {
      if (err) {
        console.log(err);
        // res.send(JSON.stringify("fail"));
        // res.end();
        return;
      } else {
        console.log("insertPaymentDetails" + JSON.stringify(data));
        //close credit orders from order document.
        Order.find(
          { shopid: shopid, customerid: customerid, paymentstatus: "credit" },
          function(err, data) {
            if (err) {
              console.log(err);
              res.send(JSON.stringify("fail"));
              res.end();
              return;
            } else {
              console.log("fetchPaymentDetails: " + JSON.stringify(data));
              var receiveamountX = receiveamount;
              data.map(function(creditOrder) {
                var creditOrderAmount = Number(creditOrder.totalcost);
                var orderid = creditOrder.orderid;
                if (Number(receiveamountX) >= creditOrderAmount) {
                  Order.updateOne(
                    {
                      shopid: shopid,
                      customerid: customerid,
                      orderid: orderid
                    },
                    {
                      $set: {
                        paymentstatus: "received",
                        updatedatetime: updatedatetime
                      }
                    },
                    function(err, data) {
                      if (err) {
                        console.log(err);

                        return;
                      } else {
                        console.log("registerShop" + JSON.stringify(data));

                        return;
                      }
                    }
                  );
                  receiveamountX =
                    Number(receiveamountX) - Number(creditOrderAmount);
                }
              });

              res.send(JSON.stringify(data));
              res.end();
              return;
            }
          }
        );

        return;
      }
    }
  );
}

function fetchPaymentDetails(req, res) {
  console.log("fetchPaymentDetails: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  const customerid = req.body.customerid;

  // Payment.find({ shopid: shopid, customerid: customerid}, function(err, data) {
  Payment.find(function(err, data) {
    if (err) {
      console.log(err);
      res.send(JSON.stringify("fail"));
      res.end();
      return;
    } else {
      console.log("fetchPaymentDetails: " + JSON.stringify(data));
      res.send(JSON.stringify(data));
      res.end();
      return;
    }
  }).sort({ $natural: -1 });
}

function getCreditOrdersByShopId(req, res) {
  console.log("getCreditOrdersByShopId 2: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  console.log("getCreditOrdersByShopId 2: " + shopid);
  var startDate = new Date(new Date().setDate(new Date().getDate() - 180));

  Order.aggregate([
    {
      $match: {
        paymentstatus: "credit",
        updatedatetime: { $gte: startDate }
        // shopid: shopid // *** UNCOMMENT IN PROD
      }
    },
    {
      $group: {
        _id: {
          customerid: "$customerid",
          customername: "$customername",
          customermobile: "$customermobile",
          deliveryaddress: "$deliveryaddress",
          paymentstatus: "$paymentstatus"
        },
        totalAmount: { $sum: "$totalcost" },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: 1 } }
  ]).exec(function(err, data) {
    if (err) {
      console.log("getCreditOrdersByShopId fail");
      res.send(JSON.stringify("fail"));
      res.end();
      return console.error(err);
    } else {
      var creditOrders = data;
      console.log("creditOrders: " + JSON.stringify(creditOrders));
      // find previous balance based on customerid and shopid
      Balance.find({ shopid: shopid }, function(err, data) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify("fail"));
          res.end();
          return;
        } else {
          var balanceamountdata = data;
          var newRespData = new Array();

          creditOrders.map(function(creditOrderItem) {
            var customeridFromcreditOrderItem = creditOrderItem._id.customerid;
            var nonadjustedamount = 0;
            balanceamountdata.map(function(balanceamountdataItem) {
              var customeridFrombalanceamountdataItem = balanceamountdataItem.customerid;
              if (customeridFromcreditOrderItem === customeridFrombalanceamountdataItem) {
                nonadjustedamount = balanceamountdataItem.nonadjustedamount;
              } else {
                nonadjustedamount = 0;
              }
            });
            // console.log(creditOrderItem._id.customername)
            creditOrderItem["nonadjustedamount"] = nonadjustedamount;
            // console.log('creditOrderItem: '+JSON.stringify(creditOrderItem));
            newRespData.push(creditOrderItem);
            // console.log('newRespData: '+JSON.stringify(newRespData))
          });

          // var newRespData = [];
          // newRespData = { ...newRespData, ordersummary: ordersummary };
          // newRespData = { ...newRespData, orderdata: data };

          console.log(
            "getCreditOrdersByShopId newRespData : " +
              JSON.stringify(newRespData)
          );
          res.send(JSON.stringify(newRespData));
          res.end();
          return;
        }
      });
    }
  });
}

function registerShop(req, res) {
  console.log("registerShop: " + JSON.stringify(req.body));

  var shopname = req.body.shopname;
  var shopaddress = req.body.shopaddress;
  var shopmobile = req.body.shopmobile;
  var alternatemobile = req.body.alternatemobile;
  var expotoken = req.body.expotoken;
  var city = req.body.city;

  var shopid = new Date().getTime();
  var createdatetime = new Date(Date.now());
  var updatedatetime = new Date(Date.now());

  Shop.collection.insertOne(
    {
      shopid: shopid,
      shopname: shopname,
      shopaddress: shopaddress,
      shopmobile: shopmobile,
      alternatemobile: alternatemobile,
      city: city,
      expotoken: expotoken,
      createdatetime: createdatetime,
      updatedatetime: updatedatetime
    },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      }
      if (data.length !== 0) {
        console.log("registerShop " + JSON.stringify(data));
        res.send(JSON.stringify({ shopid: shopid }));
        res.end();
        return;
      } else {
        console.log("registerShop" + JSON.stringify(data));
        res.send(JSON.stringify({ shopid: shopid }));
        res.end();
        return;
      }
    }
  );
}

function updateShopExpoToken(req, res) {
  console.log("updateShopExpoToken: " + JSON.stringify(req.body));

  // var shopname = req.body.shopname;
  // var shopaddress = req.body.shopaddress;
  var shopmobile = req.body.shopmobile;
  // var alternatemobile = req.body.alternatemobile;
  var expotoken = req.body.expotoken;
  // var shopid = new Date().getTime();
  // var createdatetime = new Date(Date.now());
  var updatedatetime = new Date(Date.now());
  Shop.updateOne(
    { shopmobile: shopmobile },
    // {$setOnInsert: {shopid: shopid, shopname: shopname, shopaddress: shopaddress, shopmobile: shopmobile, alternatemobile: alternatemobile, createdatetime: createdatetime, }},
    { $set: { expotoken: expotoken, updatedatetime: updatedatetime } },
    // {upsert: true},
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      }
      if (data.length !== 0) {
        console.log("registerShop " + JSON.stringify(data));
        res.send(JSON.stringify(data));
        res.end();
        return;
      } else {
        console.log("registerShop" + JSON.stringify(data));
        res.send(JSON.stringify(data));
        res.end();
        return;
      }
    }
  );
}

function addOrUpdateCustomerAddress(req, res) {
  console.log("addOrUpdateCustomerAddress: " + JSON.stringify(req.body));
  var customerid = req.body.customerid;
  var customeraddresslineone = req.body.customeraddresslineone;
  var customeraddresslinetwo = req.body.customeraddresslinetwo;
  var landmark = req.body.landmark;
  var city = req.body.city;
  try {
    Customer.updateOne(
      { customerid: customerid },
      {
        $set: {
          customeraddresslineone: customeraddresslineone,
          customeraddresslinetwo: customeraddresslinetwo,
          landmark: landmark,
          city: city
        }
      },
      function(err, data) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify("fail"));
          res.end();
          return;
        }
        if (data.length !== 0) {
          console.log(
            "customer for update is present: " + JSON.stringify(data)
          );
          res.send(JSON.stringify(data));
          res.end();
          return;
        } else {
          console.log(
            "customer for update is present: " + JSON.stringify(data)
          );
          res.send(JSON.stringify(data));
          res.end();
          return;
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.send(JSON.stringify("fail"));
    res.end();
  }
}

function updateShopDetails(req, res) {
  console.log("fetchShopDetails: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  const shopname = req.body.shopname;
  const shopaddress = req.body.shopaddress;
  const alternatemobile = req.body.alternatemobile;
  const city = req.body.city;
  try {
    Shop.updateOne(
      { shopid: shopid },
      {
        $set: {
          shopname: shopname,
          shopaddress: shopaddress,
          alternatemobile: alternatemobile,
          city: city
        }
      },
      function(err, data) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify("fail"));
          res.end();
          return;
        }
        if (data.length !== 0) {
          console.log("shop is present: " + JSON.stringify(data));
          res.send(JSON.stringify(data));
          res.end();
          return;
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.send(JSON.stringify("fail"));
    res.end();
  }
}

function fetchShopDetails(req, res) {
  console.log("fetchShopDetails: " + JSON.stringify(req.body));
  const shopmobile = req.body.shopmobile;

  Shop.find({ shopmobile: shopmobile }, function(err, data) {
    if (err) {
      console.log(err);
      res.send(JSON.stringify("fail"));
      res.end();
      return;
    } else {
      console.log("fetchShopDetails: " + JSON.stringify(data));
      res.send(JSON.stringify(data));
      res.end();
      return;
    }
  });
}

function stringToDate(_date, _format, _delimiter) {
  var formatLowerCase = _format.toLowerCase();
  var formatItems = formatLowerCase.split(_delimiter);
  var dateItems = _date.split(_delimiter);
  var monthIndex = formatItems.indexOf("mm");
  var dayIndex = formatItems.indexOf("dd");
  var yearIndex = formatItems.indexOf("yyyy");
  var month = parseInt(dateItems[monthIndex]);
  month -= 1;
  var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);
  return formatedDate;
}

function fetchDataByDateRange(req, res) {
  console.log("fetchDataByDateRange: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  console.log("fetchDataByDateRange shopid: " + shopid);
  // const shopid = req.body.shopid;
  const toDateStr = req.body.todate;
  const fromDateStr = req.body.fromdate;
  console.log("fromDate: " + fromDateStr + ", toDate: " + toDateStr);

  var fromDate = stringToDate(fromDateStr, "dd-mm-yyyy", "-");
  var toDate = stringToDate(toDateStr, "dd-mm-yyyy", "-");
  console.log("fromDate:  " + fromDate);
  console.log("toDate:  " + toDate);

  try {
    Order.find(
      { shopid: shopid, updatedatetime: { $gte: fromDate, $lte: toDate } },
      function(err, data) {
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
        console.log("fetchDataByDateRange data: " + JSON.stringify(data));
        if (data.length !== 0) {
          console.log("fetchDataByDateRange data: " + JSON.stringify(data));
          data.map(function(item) {
            // console.log("one item: " + JSON.stringify(item));
            // console.log("total cost: " + item.totalcost);
            if (item.deliverystatus === "new") {
              totalCostOfNewOrder =
                parseFloat(totalCostOfNewOrder) + parseFloat(item.totalcost);
              totalNumberOfNewOrder = totalNumberOfNewOrder + 1;
            }

            if (
              item.deliverystatus === "ofd" ||
              item.deliverystatus === "packed"
            ) {
              totalCostOfPendingOrder =
                parseFloat(totalCostOfPendingOrder) +
                parseFloat(item.totalcost);
              totalNumberOfPendingOrder = totalNumberOfPendingOrder + 1;
            }

            if (
              item.deliverystatus === "completed" ||
              item.paymentstatus === "credit" ||
              item.paymentstatus === "received"
            ) {
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
          newRespData = { ...newRespData, ordersummary: ordersummary };
          newRespData = { ...newRespData, orderdata: data };

          // var newRespData = {};
          // newRespData['ordersummary'].push(ordersummary);
          // newRespData['orderdata'].push(dataStr)

          console.log("response data:  " + JSON.stringify(newRespData));
          res.send(JSON.stringify(newRespData));
          res.end();
          return;
        } else {
          var newRespData = [];
          res.send(JSON.stringify(newRespData));
          res.end();
        }
      }
    );
  } catch (err) {
    console.log("Error in fetchDataByDateRange: " + err);
  }
}

function fetchCustomerOrderDetails(req, res) {
  console.log(
    "fetchCustomerOrderDetails req.body: " + JSON.stringify(req.body)
  );
  const customerDetails = req.body;
  console.log("fetchCustomerOrderDetails: " + customerDetails);
  const customerid = customerDetails.customerid;
  const shopid = customerDetails.shopid;
  const customermobile = customerDetails.customermobile;
  console.log("fetchCustomerOrderDetails shopid : " + shopid);

  Order.find({ customerid: customerid, shopid: shopid }, function(err, data) {
    if (err) {
      console.log(err);
      res.send(JSON.stringify("fail"));
      res.end();
      return;
    }
    console.log("data: " + data);
    var totalCostOfOrders = 0;
    var totalNumberOfOrders = 0;
    var totalCostOfPendingAmount = 0;
    var totalCostOfReceivedAmount = 0;

    if (data.length !== 0) {
      console.log("customer is present: " + data.customername);
      data.map(function(item) {
        if (
          item.deliverystatus === "completed" ||
          item.deliverystatus === "new" ||
          item.deliverystatus === "packed" ||
          item.deliverystatus === "ofd"
        ) {
          totalCostOfOrders =
            parseInt(totalCostOfOrders) + parseInt(item.totalcost);
          totalNumberOfOrders = totalNumberOfOrders + 1;
        }
        if (
          item.paymentstatus === "credit" ||
          item.paymentstatus === "pending"
        ) {
          totalCostOfPendingAmount =
            parseInt(totalCostOfPendingAmount) + parseInt(item.totalcost);
        }

        if (item.paymentstatus === "received") {
          totalCostOfReceivedAmount =
            parseInt(totalCostOfReceivedAmount) + parseInt(item.totalcost);
        }
      });

      var customerOrdersummary = {
        totalCostOfOrders: totalCostOfOrders,
        totalNumberOfOrders: totalNumberOfOrders,
        totalCostOfPendingAmount: totalCostOfPendingAmount,
        totalCostOfReceivedAmount: totalCostOfReceivedAmount
      };

      //data.ordersummary = ordersummary;
      // people = {...people, city:{estate: 'Alabama'}};
      var dataStr = JSON.stringify(data);
      // var newRespObj = JSON.parse(newRespDataStr);
      // newRespObj['ordersummary'].push(ordersummary)
      var newRespData = [];
      newRespData = {
        ...newRespData,
        customerordersummary: customerOrdersummary
      };
      newRespData = { ...newRespData, customerorderdata: data };
      res.send(JSON.stringify(newRespData));
      res.end();
      return;
    }
  });
}

function fetchOrderChartData(req, res) {
  console.log("fetchOrderChartData req.body: " + JSON.stringify(req.body));
  const orderSummaryQueryData = req.body;
  const shopid = req.body.shopid;
  var chartSalesData;
  var dailySalesData = [];
  var monthlySalesData = [];
  var moneyMatters;
  var todayDate = new Date(Date.now());
  var monthEndDate = new Date(new Date().setDate(new Date().getDate() - 30));
  var yestetDay = new Date(new Date().setDate(new Date().getDate() - 1));
  var yearEndDate = new Date(new Date().setDate(new Date().getDate() - 365));
  var dailyTopCustomer;
  var monthlyTopCustomer;

  // console.log("startDate: " + todayDate + ", endDate: " + endDate);
  // https://www.tutorialspoint.com/group-by-dates-in-mongodb#
  //https://docs.huihoo.com/mongodb/3.4/reference/operator/aggregation/sum/index.html
  //https://docs.huihoo.com/mongodb/3.4/reference/operator/aggregation/sum/index.html

  // today sales chart
  Order.aggregate([
    { $match: { updatedatetime: { $gte: yestetDay }, shopid: shopid } },
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
      dailySalesData = data;
      // top 15 buyer of the day Query
      Order.aggregate([
        { $match: { updatedatetime: { $gte: yestetDay }, shopid: shopid } },
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
              $match: { updatedatetime: { $gte: monthEndDate }, shopid: shopid }
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
              monthlyTopCustomer = data;

              Order.aggregate([
                {
                  $match: {
                    updatedatetime: { $gte: yearEndDate },
                    shopid: shopid
                  }
                },
                {
                  $group: {
                    _id: {
                      month: { $month: "$updatedatetime" },
                      year: { $year: "$updatedatetime" }
                    },
                    totalAmount: { $sum: "$totalcost" },
                    count: { $sum: 1 }
                  }
                },
                { $sort: { "_id.day": 1 } }
              ]).exec(function(err, data) {
                if (err) {
                  console.log("fetchOrderChartData fail");
                  res.send(JSON.stringify("fail"));
                  res.end();
                  return console.error(err);
                } else {
                  monthlySalesData = data;

                  // money matters: sum of credit, received and new orders
                  Order.aggregate([
                    {
                      $match: {
                        updatedatetime: { $gte: yearEndDate }
                        // shopid: shopid
                      }
                    },
                    {
                      $group: {
                        _id: "$paymentstatus",
                        totalAmount: { $sum: "$totalcost" },
                        count: { $sum: 1 }
                      }
                    },
                    { $sort: { "_id.day": 1 } }
                  ]).exec(function(err, data) {
                    if (err) {
                      console.log("fetchOrderChartData fail");
                      res.send(JSON.stringify("fail"));
                      res.end();
                      return console.error(err);
                    } else {
                      moneyMatters = data; // pai chart data
                      console.log(
                        "moneyMatters: " + JSON.stringify(moneyMatters)
                      );
                      chartSalesData = {
                        monthlyTopCustomer: monthlyTopCustomer,
                        dailyTopCustomer: dailyTopCustomer,
                        dailySalesData: dailySalesData,
                        monthlySalesData: monthlySalesData,
                        moneyMattersPieData: moneyMatters
                      };
                      res.send(JSON.stringify(chartSalesData));
                      res.end();
                      console.log(
                        "Top Buyer Data Month: " +
                          JSON.stringify(chartSalesData)
                      );
                      return;
                    }
                  });
                }
              });
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
  var startDate = new Date(new Date().setDate(new Date().getDate() - 1));
  var endDate = new Date(new Date().setDate(new Date().getDate() + 1));
  Order.find(
    { shopid: shopid, updatedatetime: { $gte: startDate, $lte: endDate } },
    function(err, data) {
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

          if (
            item.deliverystatus === "ofd" ||
            item.deliverystatus === "packed"
          ) {
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
        newRespData = { ...newRespData, ordersummary: ordersummary };
        newRespData = { ...newRespData, orderdata: data };

        // var newRespData = {};
        // newRespData['ordersummary'].push(ordersummary);
        // newRespData['orderdata'].push(dataStr)

        console.log("response data:  " + JSON.stringify(newRespData));
        res.send(JSON.stringify(newRespData));
        res.end();
        return;
      } else {
        var newRespData = [];
        res.send(JSON.stringify(newRespData));
        res.end();
      }
    }
  );
}

function insertOrder(req, res) {
  console.log("insertOrder data: " + JSON.stringify(req.body));
  const orderData = req.body;
  console.log("orderData.products: " + orderData.products);

  var orderItems = "";
  orderData.products.map(function(item) {
    orderItems =
      orderItems +
      item.productname +
      "  " +
      item.weight +
      " " +
      item.qty +
      "  " +
      item.price +
      ", ";
  });
  console.log("orderItems: " + orderItems);
  var smsBody =
    "Your Order From " +
    orderData.shopname +
    ", Items are: " +
    orderItems +
    ", Total Bill: " +
    orderData.totalcost +
    " Rs";

  // for (var i = 0; i < 5; i++) {
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

  Order.collection.insertOne(orderObj, { ordered: false }, function(err, docs) {
    if (err) {
      console.log("Order documents not inserted to Collection");
      res.send(JSON.stringify("fail"));
      res.end();
      return console.error(err);
    } else {
      //   client.messages.create({
      //     body: smsBody,
      //     to: '+919867614466',  // Text this number
      //     from: '+16699001369' // From a valid Twilio number
      // })
      // .then((message) => console.log("sms send: "+message.sid));

      request.get(
        {
          url:
            "https://platform.clickatell.com/messages/http/send?apiKey=x94dg_KoQuGJOts7A4Y8-w==&to=919867614466&content=" +
            smsBody
        },
        function(err, httpResponse, body) {
          if (err) {
            return console.error("post failed:", err);
          }

          console.log("Post successful!  Server responded with:", body);
        }
      );

      console.log("Order documents inserted to Collection");
    }
  });
  // }

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
  console.log("customerDataStr: " + customerDataStr);
  const customerData = JSON.parse(customerDataStr);
  var isRegistered = "no";

  for (var i = 0; i < customerData.length; i++) {
    const customerid = uuid.v4(); //new Date().getTime();
    const customername = customerData[i].name;
    var customermobile = customerData[i].mobile;
    var shopid = customerData[i].shopid;
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
          customeraddresslineone: null,
          customeraddresslinetwo: null,
          landmark: null,
          city: null,
          createdatetime: new Date(Date.now()),
          isRegisteredByShop: "yes",
          isRegisteredByCustomer: "no"
        },

        $set: { updatedatetime: new Date(Date.now()) },
        $addToSet: { shops: shopid }
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
      Customer.find({ shops: shopid }, function(err, data) {
        if (err) {
          console.log(err);
          res.send(JSON.stringify("fail"));
          res.end();
          return;
        }
        console.log("data: " + data);
        if (data.length !== 0) {
          res.send(JSON.stringify(data));
          res.end();
          // console.log("customer is present: " + JSON.stringify(data));
          return;
        } else {
          res.send(JSON.stringify(data));
          res.end();
          console.log("customer is present: " + JSON.stringify(data));
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
    app.listen(6050, "192.168.0.116", () => {
      console.log("server is listening on 9000 port");
    });

    console.log("MongoDB connected...server listening at 3000");
  })
  .catch(err => console.log(err));
