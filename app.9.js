const express = require("express");
// var multer  = require('multer')
// var upload = multer({ dest: 'uploads/' })

// var fileupload = require("express-fileupload");
var busboy = require("connect-busboy"); //middleware for form/file upload
var path = require("path"); //used for file path
var fs = require("fs-extra");

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
// app.use(fileupload());
app.use(busboy());
app.use(express.static(path.join(__dirname, "public")));

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



app.post("/sendVoiceOrder", function(req, res) {
  // https://stackoverflow.com/questions/23691194/node-express-file-upload
  // https://github.com/mscdex/busboy
  var fstream;
  var orderObj = {};
  var voiceorderurl = null;
  console.log("req.busboy: " + JSON.stringify(req.body));
  req.pipe(req.busboy);
  req.busboy.on("file", function(fieldname, file, filename) {
    console.log("Uploading: " + filename);
    console.log("fieldname: " + fieldname);
    console.log("dirname: " + __dirname);

    //Path where image will be uploaded
    fstream = fs.createWriteStream(__dirname + "/orders/" + filename + ".m4a");
    voiceorderurl = __dirname + "/orders/" + filename + ".m4a"
    file.pipe(fstream);
    fstream.on("close", function() {
      console.log("Upload Finished of " + filename);
      // res.redirect("back"); //where to go next
    });
  });

  req.busboy.on("field", function(
    fieldname,
    val,
    fieldnameTruncated,
    valTruncated
  ) {
    console.log("Field [" + fieldname + "]: value: " + val);
    orderObj[fieldname] = val;
  });

  req.busboy.on("finish", function() {
    console.log("Done parsing form!");

    orderObj["products"] = [];
    orderObj["totalcost"] = 0;
    orderObj["partialpaymentamount"] = 0;
    orderObj["voiceorderurl"] = voiceorderurl;
    orderObj["createdatetime"] = new Date(
      new Date().setDate(new Date().getDate())
    );
    orderObj["updatedatetime"] = new Date(
      new Date().setDate(new Date().getDate())
    );

    console.log("orderObj: " + JSON.stringify(orderObj));
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
        var smsBody =
          "Order From " +
          orderObj.customername + '-'+orderObj.customermobile+
          " has been book via voice order";
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
        res.send(JSON.stringify("success"));
        res.end();
      }
    });
  });
});

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

app.post("/fetchOrderChartDataForCustomer", function(req, res) {
  console.log("fetchOrderChartDataForCustomer");
  fetchOrderChartDataForCustomer(req, res);
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

app.post("/creditOrdersByCustomerId", function(req, res) {
  console.log("creditOrdersByCustomerId");
  getCreditOrdersByCustomerId(req, res);
});

app.post("/fetchPaymentDetails", function(req, res) {
  console.log("fetchPaymentDetails");
  fetchPaymentDetails(req, res);
});

app.post("/insertPaymentDetails", function(req, res) {
  console.log("insertPaymentDetails");
  insertPaymentDetails(req, res);
});

app.post("/fetchOrdersByCustomerId", function(req, res) {
  console.log("fetchOrdersByCustomerId");
  fetchOrdersByCustomerId(req, res);
});

app.post("/fetchShopsListByCustomerid", function(req, res) {
  console.log("fetchShopsListByCustomerid");
  fetchShopsListByCustomerid(req, res);
});

app.post("/createNewCustomerByCustomer", function(req, res) {
  console.log("createNewCustomerByCustomer");
  createNewCustomerByCustomer(req, res);
});

app.post("/addOrUpdateCustomerAddressByCustomer", function(req, res) {
  console.log("addOrUpdateCustomerAddressByCustomer");
  addOrUpdateCustomerAddressByCustomer(req, res);
});

app.post("/fetchCustomerDetails", function(req, res) {
  console.log("fetchCustomerDetails");
  fetchCustomerDetails(req, res);
});

app.post("/fetchShopsDetailsByMobile", function(req, res) {
  console.log("fetchShopsDetailsByMobile");
  fetchShopsDetailsByMobile(req, res);
});

app.post("/addShopInCustomerShopList", function(req, res) {
  console.log("addShopInCustomerShopList");
  addShopInCustomerShopList(req, res);
});

// app.post("/sendVoiceOrder", function(req, res) {
//   console.log("sendVoiceOrder");
//   sendVoiceOrder(req, res);
// });

function sendVoiceOrder(req, res) {
  console.log("sendVoiceOrder: " + JSON.stringify(req.files));
  res.send(JSON.stringify("vichi"));
  res.end();
  return;
}

function addShopInCustomerShopList(req, res) {
  console.log("addShopInCustomerShopList: " + JSON.stringify(req.body));
  var shopid = req.body.shopid;
  var customerid = req.body.customerid;
  Customer.updateOne(
    { customerid: customerid },
    { $addToSet: { shops: shopid } },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        console.log(
          "addShopInCustomerShopList is present: " + JSON.stringify(data)
        );
        res.send(JSON.stringify(data));
        res.end();
        return;
      }
    }
  );
}

function fetchShopsDetailsByMobile(req, res) {
  console.log("fetchShopsDetailsByMobile: " + JSON.stringify(req.body));
  var shopmobile = req.body.shopmobile;
  Shop.findOne(
    { $or: [{ shopmobile: shopmobile }, { shopmobile: "+91" + shopmobile }] },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        console.log(
          "fetchShopsDetailsByMobile is present: " + JSON.stringify(data)
        );
        res.send(JSON.stringify(data));
        res.end();
        return;
      }
    }
  );
}

function fetchCustomerDetails(req, res) {
  console.log("fetchCustomerDetails: " + JSON.stringify(req.body));
  var customerid = req.body.customerid;
  var customermobile = req.body.customermobile;
  console.log("customerid: " + customerid);
  console.log("customermobile: " + customermobile);
  // { $or: [ { quantity: { $lt: 20 } }, { price: 10 } ] } mobile;
  // customerid: customerid
  Customer.findOne(
    {
      $or: [
        { customerid: customerid },
        { customermobile: "+91" + customermobile },
        { customermobile: customermobile }
      ]
    },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        console.log("customer is present: " + JSON.stringify(data));
        res.send(JSON.stringify(data));
        res.end();
        return;
      }
    }
  );
}

function createNewCustomerByCustomer(req, res) {
  console.log("createNewCustomerByCustomer: " + JSON.stringify(req.body));
  var customermobile = req.body.customermobile;
  var customername = req.body.customername;
  var customeraddresslineone = req.body.customeraddresslineone;
  var customeraddresslinetwo = req.body.customeraddresslinetwo;
  var expotoken = req.body.expotoken;
  var landmark = req.body.landmark;
  var city = req.body.city;
  const customerid = uuid.v4();
  var createdatetime = new Date(Date.now());
  var updatedatetime = new Date(Date.now());
  try {
    Customer.create(
      {
        customerid: customerid,
        expotoken: expotoken,
        customermobile: customermobile,
        customername: customername,
        customeraddresslineone: customeraddresslineone,
        customeraddresslinetwo: customeraddresslinetwo,
        landmark: landmark,
        city: city,
        createdatetime: createdatetime,
        updatedatetime: updatedatetime,
        isRegisteredByShop: "no",
        isRegisteredByCustomer: "yes"
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

function addOrUpdateCustomerAddressByCustomer(req, res) {
  console.log(
    "addOrUpdateCustomerAddressByCustomer: " + JSON.stringify(req.body)
  );
  var customerid = req.body.customerid;
  var customername = req.body.customername;
  var customeraddresslineone = req.body.customeraddresslineone;
  var customeraddresslinetwo = req.body.customeraddresslinetwo;
  var landmark = req.body.landmark;
  var expotoken = req.body.expotoken;
  var city = req.body.city;
  try {
    Customer.updateOne(
      { customerid: customerid },
      {
        $set: {
          expotoken: expotoken,
          customeraddresslineone: customeraddresslineone,
          customeraddresslinetwo: customeraddresslinetwo,
          landmark: landmark,
          customername: customername,
          city: city,
          isRegisteredByCustomer: "yes"
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

function fetchShopsListByCustomerid(req, res) {
  console.log("fetchShopsListByCustomerid " + JSON.stringify(req.body));
  const customermobile = req.body.customermobile;
  console.log("fetchShopsListByCustomerid " + customermobile);
  Customer.findOne({ customermobile: customermobile }, function(err, data) {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("response data:  " + JSON.stringify(data));
      var customerdata = data;
      // var shopsid = data.shops;
      // console.log("response datay:  " + JSON.stringify(shopsid));
      Shop.find({ shopname: "Kamal store" }, function(err, data) {
        //convert shopid in string while storing it in db
        if (err) {
          console.log(err);
          return;
        } else {
          console.log("response datax:  " + JSON.stringify(data));
          var respData = {
            customerdata: customerdata,
            shopslist: data
          };
          res.send(JSON.stringify(respData));
          res.end();
          return;
        }
      });
    }
  });
}

function fetchOrdersByCustomerId(req, res) {
  console.log("fetchOrdersByCustomerId " + JSON.stringify(req.body));
  const customerid = req.body.customerid;
  console.log("fetchOrdersByCustomerId " + customerid);
  var startDate = new Date(new Date().setDate(new Date().getDate() - 1));
  var endDate = new Date(new Date().setDate(new Date().getDate() + 1));
  Order.find(
    {
      customerid: customerid
      // updatedatetime: { $gte: startDate, $lte: endDate }
    },
    function(err, data) {
      if (err) {
        console.log(err);
        return;
      }
      console.log('data: '+ JSON.stringify(data))
      var totalCostOfNewOrder = 0;
      var totalNumberOfNewOrder = 0;
      var totalCostOfPendingOrder = 0;
      var totalNumberOfPendingOrder = 0;
      var totalCostOfCompletedOrder = 0;
      var totalNumberOfCompletedOrder = 0;
      if (data.length !== 0) {
        console.log("order is present: " + JSON.stringify(data));
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
  )
    .sort({ createdatetime: -1 })
    .limit(50);
}

async function insertPaymentDetails(req, res) {
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
  var receiveamount = req.body.receiveamount;
  const balanceamountafterreceivingpayment =
    req.body.balanceamountafterreceivingpayment;

  var paymentid = new Date().getTime();
  var createdatetime = new Date(Date.now());
  var updatedatetime = new Date(Date.now());
  var paymentsArray = [];
  var haschangedorderstatus = "no";

  var query = Order.find({
    shopid: shopid,
    customerid: customerid,
    paymentstatus: "credit"
  }).sort({ createdatetime: 1 });
  const orderData = await query.exec();
  // console.log('orderData: '+orderData)
  // orderData.map(function(creditOrderItem) {
  var count = 0;
  for (let creditOrderItem of orderData) {
    console.log("count: " + count);
    count = count + 1;
    console.log("creditOrderItem: " + creditOrderItem);
    var ordercreatedatetime = creditOrderItem.createdatetime;
    const orderid = creditOrderItem.orderid;
    const totalcost = creditOrderItem.totalcost;
    const partialpaymentamount = creditOrderItem.partialpaymentamount;
    var remainingAmountOfTotalCost = totalcost - partialpaymentamount;

    var remainingAmountAfterRecentlyReceivedPayment =
      receiveamount - remainingAmountOfTotalCost;
    console.log("receiveamount: " + receiveamount);
    console.log("remainingAmount: " + remainingAmountOfTotalCost);
    console.log(
      "remainingAmountAfterRecentlyReceivedPayment: " +
        remainingAmountAfterRecentlyReceivedPayment
    );
    if (remainingAmountAfterRecentlyReceivedPayment === 0) {
      var obj = {
        orderid: orderid,
        payment: receiveamount,
        orderstatus: "received",
        ordercreatedatetime: ordercreatedatetime
      };

      haschangedorderstatus = "yes";
      paymentsArray.push(obj);
      Order.updateOne(
        {
          shopid: shopid,
          customerid: customerid,
          orderid: orderid
        },

        {
          $inc: { partialpaymentamount: Math.abs(receiveamount) },
          $set: {
            paymentstatus: "received",
            // partialpaymentamount: creditOrderTotalCost,
            updatedatetime: updatedatetime
          }
        },
        function(err, data) {
          if (err) {
            console.log(err);
            return;
          } else {
            console.log("insertPaymentDetails1: " + JSON.stringify(data));
          }
        }
      );
      break;
    } else if (remainingAmountAfterRecentlyReceivedPayment > 0) {
      var obj = {
        orderid: orderid,
        payment: remainingAmountOfTotalCost,
        orderstatus: "received",
        ordercreatedatetime: ordercreatedatetime
      };
      receiveamount = remainingAmountAfterRecentlyReceivedPayment;
      haschangedorderstatus = "yes";
      paymentsArray.push(obj);
      Order.updateOne(
        {
          shopid: shopid,
          customerid: customerid,
          orderid: orderid
        },

        {
          $inc: { partialpaymentamount: Math.abs(remainingAmountOfTotalCost) },
          $set: {
            paymentstatus: "received",
            // partialpaymentamount: creditOrderTotalCost,
            updatedatetime: updatedatetime
          }
        },
        function(err, data) {
          if (err) {
            console.log(err);
            return;
          } else {
            console.log("insertPaymentDetails1: " + JSON.stringify(data));
          }
        }
      );
      if (remainingAmountAfterRecentlyReceivedPayment === 0) {
        break;
      }
    } else {
      var obj = {
        orderid: orderid,
        payment: receiveamount,
        orderstatus: "credit",
        ordercreatedatetime: ordercreatedatetime
      };

      paymentsArray.push(obj);

      Order.updateOne(
        {
          shopid: shopid,
          customerid: customerid,
          orderid: orderid
        },

        {
          $inc: { partialpaymentamount: Math.abs(receiveamount) },
          $set: { updatedatetime: updatedatetime }
        },
        function(err, data) {
          if (err) {
            console.log(err);
            return;
          } else {
            console.log("insertPaymentDetails2: " + JSON.stringify(data));
          }
        }
      );
      break;
    }
  }
  console.log("paymentsArray: " + JSON.stringify(paymentsArray));
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
      paymentsbyorderid: paymentsArray,
      haschangedorderstatus: haschangedorderstatus,
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
        console.log("insertPaymentDetails" + JSON.stringify(data));
        res.send(JSON.stringify({ paymentid: paymentid }));
        res.end();
        return;
      }
    }
  );
}

function fetchPaymentDetails(req, res) {
  var combinedArray = [];
  console.log("fetchPaymentDetails: " + JSON.stringify(req.body));
  const shopid = req.body.shopid;
  const customerid = req.body.customerid;
  Order.find(
    { shopid: shopid, customerid: customerid, paymentstatus: "credit" },
    function(err, data) {
      if (err) {
        console.log(err);
        res.send(JSON.stringify("fail"));
        res.end();
        return;
      } else {
        if (data.length === 0) {
          res.send(data);
          res.end();
        } else {
          combinedArray = combinedArray.concat(data);
          console.log("combinedArray: " + combinedArray);
          var createdatetimeoflastcreditorder =
            data[data.length - 1].createdatetime;
          Order.find(
            // find recently received order
            {
              shopid: shopid,
              customerid: customerid,
              paymentstatus: "received",
              createdatetime: { $lte: createdatetimeoflastcreditorder }
            },
            function(err, data) {
              if (err) {
                console.log(err);
                res.send(JSON.stringify("fail"));
                res.end();
                return;
              } else {
                console.log("data3: " + JSON.stringify(data));
                combinedArray = combinedArray.concat(data);
                var recentlyReceivedOrderCreateTime;
                if (data.length === 0) {
                  recentlyReceivedOrderCreateTime = createdatetimeoflastcreditorder;
                  console.log(
                    "recentlyReceivedOrderCreateTime1: " +
                      recentlyReceivedOrderCreateTime
                  );
                } else {
                  console.log(
                    "recentlyReceivedOrderCreateTime2: " +
                      recentlyReceivedOrderCreateTime
                  );
                  recentlyReceivedOrderCreateTime = data[0].createdatetime;
                }

                Payment.find(
                  {
                    shopid: shopid,
                    customerid: customerid,
                    createdatetime: { $gte: recentlyReceivedOrderCreateTime }
                  },
                  function(err, data) {
                    if (err) {
                      console.log(err);
                      res.send(JSON.stringify("fail"));
                      res.end();
                      return;
                    } else {
                      combinedArray = combinedArray.concat(data);
                      console.log(
                        "combinedArray: " + JSON.stringify(combinedArray)
                      );
                      var combinedSortedArray = combinedArray.sort(
                        function compare(a, b) {
                          var dateA = new Date(a.createdatetime).getTime();
                          console.log("dateA: " + dateA);
                          var dateB = new Date(b.createdatetime).getTime();
                          return dateB - dateA;
                        }
                      );

                      console.log(
                        "combinedSortedArray: " +
                          JSON.stringify(combinedSortedArray)
                      );
                      res.send(JSON.stringify(combinedSortedArray));
                      res.end();
                      return;
                    }
                  }
                ).sort({ createdatetime: -1 });
              }
            }
          )
            .sort({ createdatetime: -1 })
            .limit(1);
        }
      }
    }
  ).sort({ createdatetime: -1 });
}

function getCreditOrdersByCustomerId(req, res) {
  console.log("getCreditOrdersByCustomerId 2: " + JSON.stringify(req.body));
  const customerid = req.body.customerid;
  console.log("getCreditOrdersByCustomerId 2: " + customerid);
  var startDate = new Date(new Date().setDate(new Date().getDate() - 180));

  Order.aggregate([
    {
      $match: {
        paymentstatus: "credit",
        updatedatetime: { $gte: startDate },
        customerid: customerid // *** UNCOMMENT IN PROD
      }
    },
    {
      $group: {
        _id: {
          shopid: "$shopid",
          shopname: "$shopname",
          shopmobile: "$shopmobile",
          // deliveryaddress: "$deliveryaddress",
          paymentstatus: "$paymentstatus"
          // partialpaymentamount: "$partialpaymentamount",
        },
        totalAmount: { $sum: "$totalcost" },
        totalpartialpaymentamount: { $sum: "$partialpaymentamount" },
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

      res.send(JSON.stringify(data));
      res.end();
      return;
    }
  });
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
        updatedatetime: { $gte: startDate },
        shopid: shopid // *** UNCOMMENT IN PROD
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
          // partialpaymentamount: "$partialpaymentamount",
        },
        totalAmount: { $sum: "$totalcost" },
        totalpartialpaymentamount: { $sum: "$partialpaymentamount" },
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

      res.send(JSON.stringify(data));
      res.end();
      return;
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
  // const customermobile = customerDetails.customermobile;
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
    } else {
      res.send(JSON.stringify(data));
      res.end();
      return;
    }
  }).sort({ createdatetime: -1 });
}

function fetchOrderChartDataForCustomer(req, res) {
  console.log("fetchOrderChartData req.body: " + JSON.stringify(req.body));
  const orderSummaryQueryData = req.body;
  const customerid = req.body.customerid;
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
    { $match: { updatedatetime: { $gte: yestetDay }, customerid: customerid } },
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
        {
          $match: {
            updatedatetime: { $gte: yestetDay },
            customerid: customerid
          }
        },
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
          Order.aggregate([
            {
              $match: {
                updatedatetime: { $gte: monthEndDate },
                customerid: customerid
              }
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
                    customerid: customerid
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
                        // customerid: customerid
                      }
                    },
                    {
                      $group: {
                        _id: "$paymentstatus",
                        totalAmount: { $sum: "$totalcost" },
                        totalpartialpaymentamount: {
                          $sum: "$partialpaymentamount"
                        },
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
                        totalpartialpaymentamount: {
                          $sum: "$partialpaymentamount"
                        },
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
  ).sort({ createdatetime: -1 });
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
    shopmobile: orderData.shopmobile,
    shopaddress: orderData.shopaddress,
    customerid: orderData.customerid,
    customername: orderData.customername,
    customermobile: orderData.customermobile,
    deliveryaddress: orderData.deliveryaddress,
    voiceorderurl: null,
    products: orderData.products,
    totalcost: orderData.totalcost,
    partialpaymentamount: 0,
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
    app.listen(6050, "192.168.0.112", () => {
      console.log("server is listening on 9000 port");
    });

    console.log("MongoDB connected...server listening at 3000");
  })
  .catch(err => console.log(err));
