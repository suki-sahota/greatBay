/*
 * Author: Suki Sahota
 * Description: Auction Application (Node.js with MySql JavaScript Client)
 */
const inquirer = require('inquirer');
const mysql = require("mysql");
const keys = require("./pw");

// CREATING CONNECTION TO MYSQL SERVER
// ___________________________________
const connection = mysql.createConnection({
  host: keys.connectionInfo.host,
  port: keys.connectionInfo.port,
  user: keys.connectionInfo.user,
  password: keys.connectionInfo.password,
  database: keys.connectionInfo.database
});


// CONNECTING TO OUR MYSQL SERVER THROUGH NODE.JS
// ___________________________________
connection.connect(function(err) {
  if (err) throw err;
  console.log();
  console.log("Connected as id " + connection.threadId);
  console.log();
  start();
});


// METHOD TO ASK USER IF THEY WANT TO BID/SELL/EXIT
// ___________________________________
const start = function() {
  inquirer.prompt([
    {
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: ["POST AN ITEM", "BID ON AN ITEM", "EXIT"]
    }
  ]).then(function(answer) {
    if (answer.action === 'POST AN ITEM') {
      console.log();
      postItem();
    } else if (answer.action === 'BID ON AN ITEM') {
      console.log();
      bidItem();
    } else if (answer.action === 'EXIT') {
      console.log();
      connection.end();
    }
  });
}


// METHOD FOR POSTING AUCTION ITEM FOR SALE
// ___________________________________
const postItem = function() {
  inquirer.prompt([
    {
      name: "name",
      type: "input",
      message: "What is your item called?"
    },
    {
      name: "startBid",
      type: "input",
      message: "What price would you like to start the bidding?",
      validate: function(value) {
        if (isNaN(value) === false) {
          return true;
        }
        return false;
      }
    },
    {
      name: "category",
      type: "list",
      message: "What type of item is it?",
      choices: ["SPORTS", "RECREATIONAL", "PROFESSIONAL", "APPLIANCES"]
    }
  ]).then(function(answers) {
    createProduct(answers.name, answers.startBid, answers.category);
  });
}


// METHOD FOR BIDDING ON AUCTION ITEM
// ___________________________________
const bidItem = function() {
  readProducts();
}


// METHOD TO CREATE DATA (C.R.U.D.)
// ___________________________________
function createProduct(name, startBid, category) {
  console.log();
  console.log("Inserting a new auction item into table...");
  connection.query(`INSERT INTO ${ keys.TABLE } SET ?`,
    {
      name: name,
      category: category,
      starting_bid: startBid || 0,
      highest_bid: startBid || 0
    },
    function(err, res) {
      if (err) throw err;
      console.log(res.affectedRows + " auction item inserted!\n");
      start();
    }
  );
}


// METHOD TO READ DATA (C.R.U.D.)
// ___________________________________
function readProducts() {
  console.log("Selecting all auction item(s)...");
  connection.query(`SELECT * FROM ${ keys.TABLE }`, function(err, results) {
    if (err) throw err;
    
    inquirer.prompt([
      {
        name: "choice",
        type: "rawlist",
        choices: function() {
          let choiceArray = [];
          for (let i = 0; i < results.length; i++) {
            choiceArray.push(results[i].name);
          }
          return choiceArray;
        },
        message: "Please select an auction item."
      },
      {
        name: "bid",
        type: "input",
        message: "How much would you like to bid?"
      }
    ]).then(function(answers) {
      let chosenItem;
      for (let i = 0; i < results.length; i++) {
        if (results[i].name === answers.choice) {
          // chosenItem is RowDataPacket object from MySql database which interests our user
          chosenItem = results[i];
        }
      }
      // Type cast our bid to a float
      let idVar = parseFloat(answers.bid);

      // Determine if bid is higher than current bid
      if (chosenItem.highest_bid < idVar) {
        // Bid is high enough -> so update db, let the user know, and start over
        updateProduct(idVar, chosenItem.id);
      } else {
        // Bid is not high enough -> so apologize and start over
        console.log();
        console.log("Your bid is too low. Please try again...");
        console.log();
        start();
      }
    });
  });
}


// METHOD TO UPDATE DATA (C.R.U.D.)
// ___________________________________
function updateProduct(highBid, id) {
  connection.query(`UPDATE ${ keys.TABLE } SET ? WHERE ?`,
    [
      {
        highest_bid: highBid
      },
      {
        id: id
      }
    ],
    function(err, res) {
      if (err) throw err;
      console.log();
      console.log(res.affectedRows + " auction item updated!\n");
      start();
    }
  );
}