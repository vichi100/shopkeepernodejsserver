

var accountSid = 'ACbc43a7a2a3c4fe6cf3eedea6b74399aa'; // Your Account SID from www.twilio.com/console
var authToken = '827902493885adc9b335e38f4507a85a';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

client.messages.create({
    body: 'Hello from Node',
    to: '+919867614466',  // Text this number
    from: '+12345678901' // From a valid Twilio number
})
.then((message) => console.log(message.sid));
