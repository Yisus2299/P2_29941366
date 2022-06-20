const express = require('express');
//const { request } = require('../app');
const request = require('request');
const router = express.Router();
const secretKey = process.env.SECREST_KEY
var sqlite3 = require('sqlite3');
const nodemailer = require("nodemailer");

if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}


var db = new sqlite3.Database('./mock.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") {
     
    db = new sqlite3.Database('./mock.db', (err) => {
      if (err) {
          console.log("Getting error " + err);
          exit(1);
  }
  db.run(
    'CREATE TABLE comentarios (nombre, correo, remoteAddress, comentario,fecha,ubication)'
  );
})

      return;
      } else if (err) {
          console.log("Getting error " + err);
          exit(1);
  }
  //runQueries(db);
});






router.get('/', (req, res) => {
  res.render('index', { datos:{} });
});
router.post("/comentario",(req,res)=>{

  console.log(req.body)
  console.log(req.socket.remoteAddress)

res.redirect('/');


})
/** 
router.post('verify',(req,res)=>{
 
  if(!req.body.captcha){
    res.json({'msg':'captcha token is undefined'});
  }
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}`;
  request(verifyUrl,(err,response,body)=>{
    if(err){


     console.log(err);

    }
    body= JSON.parse(body);
  })
  if(!body.success || body.score < 0.4 ){
    return res.json({'msg':'you might be a robot, sorry','score':body.score})
  }
  return res.json({'msg':'success','score':body.score})

});

*/
router.get('/contactos', (req, res) => {

  const sql = 'SELECT * FROM comentarios' 

  db.all(sql,[],(err,rows)=>{
    if(err) return console.error(err.message);

    rows.forEach((row)=>{
      console.log(row);
      //console.log('a')
    res.render('contactos',{ data: JSON.stringify(rows) });
 
    });
  });

});
var ubication=''

router.post('/subscribe',(req,res)=>{
  console.log(process.env.EMAIL)
  //console.log(req.body.captcha)
  geourl = `https://api.ipgeolocation.io/ipgeo?apiKey=08dfecfc4a5f40a69fb8dadcebe7275a&ip=181.208.153.58&fields=currency`

  var options = {
    'method': 'GET',
    'url': geourl,
    'headers': {
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    
    ubication=response.body
    console.log(ubication);
  });
  console.log(`${req.body.captcha}`)

  //console.log(req.body)

 
  

  if(!req.body.captcha){
    console.log("err");
    return res.json({"success":false, "msg":"Capctha is not checked"});
   
}

try {



  var options = {
    'method': 'POST',
    'url': `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${req.body.captcha}`,
    'headers': {
    }
  };
  
  request(options, function (err, response,body) {
   
    if(err){console.log(err); }
    body = JSON.parse(body);
  
    if(!body.success && body.success === undefined){
      return res.json({"success":false, "msg":"captcha verification failed"});
  }
  
  else if(body.score < 0.5){
    return res.json({"success":false, "msg":"you might be a bot, sorry!", "score": body.score});
  }
  
  remoteAddress = req.socket.remoteAddress
  let correo = req.body.mail
  let comentario = req.body.msg
  let nombre =req.body.firstName
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  
  ubication=  ubication.toString();
  const sql='INSERT INTO comentarios (nombre, correo, remoteAddress, comentario,fecha,ubication) VALUES(?,?,?,?,?,?)';
  db.run(
          sql,
          [nombre,correo,remoteAddress,comentario,dateTime,ubication],
          (err) => {
            if(err) return console.error(err.message);
            console.log('enviado')
          
          }
          )
  
  
  
  
  //correo
  
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.GOOGLE_KEY
    }
  });
  
  var mailOptions = {
    from: 'jmzm08@gmail.com',
    to: 'programacion2ais@dispostable.com',
    subject: 'Sending EmailAA using Node.js',
    text: `${nombre} ${correo} ${remoteAddress}${dateTime}${ubication}`  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  
  //fin correo
    // return json message or continue with your function. Example: loading new page, ect
    return res.json({"success":true, "msg":"captcha verification passed", "score": body.score});
  
  
  })



  
} catch (error) {
  console.log(error)
}



});

module.exports = router;
