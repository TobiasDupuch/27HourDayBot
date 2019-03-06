const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const schedule = require('node-schedule');

var bot;

var telegramKey = fs.readFile("apiKey.txt", "utf8", function(err, data) {
  if (err) throw err;
  const tgKey = data;
  bot = new TelegramBot(tgKey, {
    polling: true
  });
telegramKey = telegramKey.slice(0, -1);


  //sheduled jobs
  const cronJobTest = schedule.scheduleJob('0 * * * *', function() {
    bot.sendMessage(682973818, "Time to log something. Type 'log'.");
  });

  const cronJobBeforeBedtime = schedule.scheduleJob('*/30 * * * *', function() {
    //check if somebodies bedtime is up.
    //make hour and minute from time
    let dateNow = new Date();
    let hourNow = addZero(dateNow.getHours());
    let minuteNow = addZero(dateNow.getMinutes());
    let timeNow = hourNow+":"+minuteNow;
    console.log("CHECKING BEDTIMES FOR: "+timeNow);

    fs.readFile("data/allusers.json", function(err, data) {
        if (err) throw err;
        console.log("ALLUSERS.JSON LOADED FOR CRON JOBS:");
        let allUsers = (JSON.parse(data));
        for (var i = 0; i < allUsers.users.length; i++) {
          if (allUsers.users[i] == timeNow) {
            bot.sendMessage(allUsers.users[i], "Good Night?'.");
          }
////CHECK USER FILE NOT ALL USERS, STUPID!
        }
      });



  });


  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log("INCOMING MESSAGE: ");
    console.log(msg);

    //check if user exists if not, create.

    checkUser(chatId, msg);

  });
});



// opts = {
//   reply_markup: JSON.stringify({
//     // one_time_keyboard: true,
//     // hide_keyboard: true,
//     keyboard: [
//       ['Yes, you are the bot of my life '],
//       ['No, sorry there is another one...']
//     ]
//   })
// }

// const keyBoardHide = {
//   reply_markup: JSON.stringify({
//     hide_keyboard: true,
//   })
// }
// const keyBoardNumbers = {
//   reply_markup: JSON.stringify({
//     one_time_keyboard: true,
//     // hide_keyboard: true,
//     keyboard: [
//       ['7', '8', '9'],
//       ['4', '5', '6'],
//       ['1', '2', '3'],
//       ['0']
//     ]
//   })
// }

const keyBoardBedtime = {
  reply_markup: JSON.stringify({
    one_time_keyboard: true,
    // hide_keyboard: true,
    keyboard: [
      ['21:30',"22:00"],
      ['22:30',"23:00"],
      ['23:30',"00:00"],
      ['00:30',"01:00"]
    ]
  })
}






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
            "created": Date.now(),
            "step": 0,
            "logging": false,
            "log": [],
          };
          fs.writeFile("data/" + chatId.toString() + "/user.json", JSON.stringify(initUser), function(err) {
            if (err) throw err;
            console.log('INITIAL USER FILE CREATED.');
            loadUser(chatId, msg);
          });
          addUserToAllUsers(chatId.toString());

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

function addUserToAllUsers(user){
  console.log("ADDING USER "+user+" to allusers.json");
  fs.readFile("data/allusers.json", function(err, data) {
    if (err) throw err;
    console.log("ALLUSERS.JSON LOADED:");
    let allUsers = (JSON.parse(data));
    allUsers.users.push(user);
    fs.writeFile("data/allusers.json", JSON.stringify(allUsers), function(err) {
      if (err) throw err;
      console.log('ADDED USER TO ALL USERS');
    });
  });
}

function handleDialog(user, msg) {
  if (user.logging == true) {
    if (msg.text == "stop") {
      user.logging = false;
      saveToUser(user);
      console.log("USER MANUALLY ENDED LOGGING MODE");
      bot.sendMessage(user.id, "Ok. Remember: to log something just type 'log' first.");


    } else {
      user.log.push({
        "timestamp": new Date().getTime(),
        "entry": msg.text
      });
      user.logging = false;
      saveToUser(user);
      console.log("USER LOGGED MESSAGE: " + msg.text);
      bot.sendMessage(user.id, "We logged that. Thanks");

    }

  } else if (msg.text == "log" || msg.text == "Log") {
    console.log("USER ACTIVATED LOGGING MODE");
    user.logging = true;
    saveToUser(user);

    bot.sendMessage(user.id, "What would you like to log?");

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
        bot.sendMessage(user.id, "Ok, " + user.name + " What's your age?", );
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
        bot.sendMessage(user.id, "We will ask you to answer one or more questions every evening before you go to bed. To know when to ask you we need to know when that is.",keyBoardBedtime);

        break;
      case 5:
        user.bedtime = msg.text;
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

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
