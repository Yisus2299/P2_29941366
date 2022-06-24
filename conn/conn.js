//var mysql = require('mysql');
const sqlite3 = require('sqlite3');
var con =new sqlite3.Database('./MYBD.db', (err) => {
    if (err) {
      console.log('Could not connect to database', err)
    } else {
      console.log('Connected to database')
    }
  })

module.exports = con;