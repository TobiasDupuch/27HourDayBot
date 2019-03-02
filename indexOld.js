const TelegramBot = require('node-telegram-bot-api');
var fs = require("fs");


const bot = new TelegramBot("638772528:AAGwE_YJgegWUEnO1_sn-nCB5qmqnVVx8As", {
  polling: true
});

function Person() {
}

let participant;


function initializeUser(userID) {
  console.log("initializing user " + userID);
  //CHECK IF USER EXISTS:
  fs.access("data/"+userID.toString(), fs.constants.F_OK, (err) => {
    if (err) {
      console.log("USER DOESN'T EXIST...CREATING DIR...");
      fs.mkdir("data/" + userID.toString(), {recursive: false}, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("DIR CREATED!");
          bot.sendMessage(userID,"Welcome to the 27 Hour day!");

          participant = new Person();
          participant.progress = 1;
          console.log(participant);
          bot.sendMessage(userID,"How do you want to be called? This does not have to be your real name.");
        }
      });
    } else {
      console.log("USER EXISTS");
      bot.sendMessage(userID,"Welcome back");

    }
  });
}



bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(msg);

  if (msg.text == "/start") {
    initializeUser(chatId);
  }

  if (participant.progress == 1){
    participant.name = msg.text;
    bot.sendMessage(chatId,"Hello "+participant.name);
    console.log(participant);

  }

  if (msg.voice.mime_type == "audio/ogg") {
    console.log("is audio");
    bot.downloadFile(msg.voice.file_id, "data/"+chatId+"/")
  }

});
