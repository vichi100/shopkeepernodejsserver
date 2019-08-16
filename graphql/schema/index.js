const { buildSchema } = require('graphql');



module.exports = buildSchema(`

type Customer {
  customerid: String!
  customername: String
  customernamebyshop: String
  customermobile: String!
  deliveryaddress: String
  createdEvents: [Shop]
}

input CustomerInput{
  customerid: String!
  customername: String
  customernamebyshop: String
  customermobile: String!
  deliveryaddress: String
  
}

type Product{
  productid: String
	productname: String
  brand: String
  category: String
  description: String
  weight: String
  price: String
  searchtags: String
  imageurl: String
  
}

input ProductType{
  productid: String
	productname: String
  brand: String
  category: String
  description: String
  weight: String
  price: String
  searchtags: String
  imageurl: String

}

type Shop {
  shopid: String
  shopname: String
  shopaddress: String
  shopmobile: String
  alternatemobile: String
  city: String
}

input ShopInput {
  shopname: String
  shopaddress: String
  shopmobile: String
  alternatemobile: String
  city: String

}

type Order {
  orderid: String
  shopid: String,
  shopname: String,
  customerid: String
  customername: String
  customermobile: String
  deliveryaddress: String
  totalcost: String
  dilevirystatus: String
  paymentstatus: String
  paymentmode: String

}

input OrderInput {
  
  shopid: String
  shopname: String
  customerid: String
  customername: String
  customermobile: String
  deliveryaddress: String
  totalcost: String
  dilevirystatus: String
  paymentstatus: String
  paymentmode: String

}

type Event {
  _id: ID!
  title: String!
  description: String!
  price: Float!
  date: String!
  creator: User!
}

type User {
  _id: ID!
  email: String!
  password: String
  createdEvents: [Event!]
}

input EventInput {
  title: String!
  description: String!
  price: Float!
  date: String!
}

input UserInput {
  email: String!
  password: String!
}

type RootQuery {
    events: [Event!]!
    shops: [Shop]
    products: [Product]
    customerDetails: [Customer] 
}

type RootMutation {
    createEvent(eventInput: EventInput): Event
    createUser(userInput: UserInput): User
    createCustomer(customerInput: CustomerInput): Customer
    createShop(shopInput: ShopInput): Shop
    createOrder(orderInput: OrderInput): Order
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);
