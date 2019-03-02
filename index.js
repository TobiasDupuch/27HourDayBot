const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const schedule = require('node-schedule');


const bot = new TelegramBot("638772528:AAGwE_YJgegWUEnO1_sn-nCB5qmqnVVx8As", {
  polling: true
});

console.log("BOT RUNNING")


//sheduled jobs
// var cronJobTest = schedule.scheduleJob('*/1 * * * *', function(){
//   bot.sendMessage(682973818, "CRON TEST2");
// });


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log("INCOMING MESSAGE: ");
  console.log(msg);

  //check if user exists if not, create.

  checkUser(chatId, msg);

});


function checkUser(chatId, msg) {
  console.log("CHECKING IF USER EXITS...");
  fs.access("data/" + chatId.toString(), fs.constants.F_OK, (err) => { //checking for folder
    if (err) {
      console.log("USER DOESN'T EXIST. CREATING DIR...");
      fs.mkdir("data/" + chatId.toString(), {
        recursive: false
      }, (err) => { //creating folder
        if (err) {
          console.log(err);
        } else {
          console.log("DIR CREATED!");
          console.log("CREATING INITIAL USER FILE...");
          const initUser = {
            "id": chatId,
            "step": 0,
            "logging": false,
            "log": []
          };
          fs.writeFile("data/" + chatId.toString() + "/user.json", JSON.stringify(initUser), function(err) {
            if (err) throw err;
            console.log('INITIAL USER FILE CREATED.');
            loadUser(chatId, msg);
          });
        }
      });
    } else {
      console.log("USER EXISTS");
      loadUser(chatId, msg);
    }
  });
}

function loadUser(chatId, msg) {
  console.log("LOADING USER...");
  fs.readFile("data/" + chatId.toString() + "/user.json", function(err, data) {
    if (err) throw err;
    console.log("USER LOADED:");
    console.log(JSON.parse(data));
    checkState(JSON.parse(data), msg);
  });
}

function checkState(user, msg) {
  console.log("CHECKING USER STATE FOR: ");
  console.log(user);
  console.log("USER IS AT STEP: " + user.step);
  handleDialog(user, msg);
}


function handleDialog(user, msg) {
  if (user.logging == true) {
    if (msg.text == "stop") {
      user.logging = false;
      saveToUser(user);
      console.log("USER MANUALLY ENDED LOGGING MODE");
      bot.sendMessage(user.id,"Ok. To log something just type 'log'");


    } else {
      user.log.push({"timestamp":new Date().getTime(),"entry":msg.text});
      user.logging = false;
      saveToUser(user);
      console.log("USER LOGGED MESSAGE: "+msg.text);
      bot.sendMessage(user.id,"We logged that. Thanks");

    }

  } else if (msg.text == "log") {
    console.log("USER ACTIVATED LOGGING MODE");
    user.logging = true;
    saveToUser(user);

    bot.sendMessage(user.id, "Logbucheintrag für XX:XX");

  } else {
    console.log("SENDING MESSAGE FOR STEP: " + user.step + "...");
    switch (user.step) {
      case 0:
        bot.sendMessage(user.id, "welcome **INTRODUCTION** ok?");
        user.step++;
        saveToUser(user);
        break;

      case 1:
        user.step++;
        saveToUser(user);
        bot.sendMessage(user.id, "How should we call you? **ONBOARDING**");
        break;

      case 2:
        user.name = msg.text;
        user.step++;
        saveToUser(user);
        bot.sendMessage(user.id, "Ok, " + user.name + " What's your age?");
        break;

      case 3:
        user.age = msg.text;
        user.step++;
        saveToUser(user);
        bot.sendMessage(user.id, "And what would you consider your education or job");
        break;

      case 4:
        user.job = msg.text;
        user.step++;
        saveToUser(user);
        bot.sendMessage(user.id, "That was it! You'll find a watch you can add to your homescreen at www.tobens.com/clock");

        setTimeout(function() {
          bot.sendMessage(user.id, "You will hear from us again. Until then try to look at the old clock as rarely as possible.")
        }, 3000);

        setTimeout(function() {
          bot.sendMessage(user.id, "If you just want to log something, just write the word 'log'.")
        }, 5000);

        break;
      default:

    }

  }
}

function saveToUser(user) {
  console.log("SAVING TO USER...");
  fs.writeFile("data/" + user.id.toString() + "/user.json", JSON.stringify(user), function(err) {
    if (err) throw err;
    console.log('CHANGES SAVED TO USER FILE.');
  });
}
