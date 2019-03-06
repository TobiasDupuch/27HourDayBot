const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const schedule = require('node-schedule');

let bot;

let telegramKey = fs.readFile("apiKey.txt", "utf8", function(err, data) {
  if (err) throw err;
  let tgKey = data.slice(0, -1);;

  bot = new TelegramBot(tgKey, {
    polling: true
  });


  bot.on('message', (msg) => {
    console.log(msg);
    notifyMe(msg.from.id, msg.text, );
  });




});


function notifyMe(sender, text) {
  if (sender != "682973818") {
    bot.sendMessage("682973818", "RECEIVED: " + text + " FROM: " + sender);
  } else {
    let target = text.split("/")[0];
    let messageToSend = text.split("/")[1];
    bot.sendMessage(target, messageToSend);
    console.log("SENDING: " + messageToSend + " TO " + target);
  }
}
