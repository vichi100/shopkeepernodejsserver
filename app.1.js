const express = require("express");
var uuid = require("uuid");

const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");

const graphQlSchema = require("./graphql/schema/index");
const graphQlResolvers = require("./graphql/resolvers/index");

const Customer = require("./models/customer");

const app = express();

app.use(bodyParser.json());

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
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

function createCustomers(req, res) {
  // console.log(
  //   "createCustomers: post data: " + JSON.stringify(req.body)
  // );
  var customerDataArray = [];
  const customerDataStr = JSON.stringify(req.body);
  const customerData = JSON.parse(customerDataStr);
  var isRegistered = 'no';
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
      console.log('customermobile: '+customermobile)
      Customer.findOne({ customermobile: customermobile }, function(err, data) {
        if (err) {
          console.log(err);
          return;
        }
        console.log('data: '+ data)
        if (data == null || data.length == 0) {
          console.log("customer is not present with mobile : "+customermobile);
          const obj = {
            customerid: customerid,
            customername: customername,
            customermobile: customermobile,
            deliveryaddress: null,
            shops: [],
            isRegistered: isRegistered
          };
          Customer.collection.insertOne(obj, function(err, docs) {
          if (err) {
            console.log("Multiple documents not inserted to Collection");
            // res.send(JSON.stringify("fail"));
            // res.end();
            //return console.error(err);
          } else {
            console.log("Multiple documents inserted to Collection");
            // res.send(JSON.stringify("success"));
            // res.end();
          }
        });
          return;
        }
        
      }); 
      
      // customerDataArray.push(obj);
    } catch (err) {
      console.log(err);
    }
  }

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
    app.listen(3000);
    console.log("MongoDB connected...server listening at 3050");
  })
  .catch(err => console.log(err));
