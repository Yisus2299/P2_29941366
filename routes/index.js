var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const request = require('request');
var bcrypt = require('bcrypt');
var con = require('../conn/conn');
require('dotenv').config();
const nodemailer = require("nodemailer");

var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var ubication=''
/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.flag == 1){
    req.session.destroy();
    res.render('index', { title: 'CodeLanguage', message : 'Email Already Exists' , flag : 1});
  }
  else if(req.session.flag == 2){
    req.session.destroy();
    res.render('index', { title: 'CodeLanguage', message : 'Registration Done. Please Login.', flag : 0});
  }
  else if(req.session.flag == 3){
    req.session.destroy();
    res.render('index', { title: 'CodeLanguage', message : 'Confirm Password Does Not Match.', flag : 1});
  }
  else if(req.session.flag == 4){
    req.session.destroy();
    res.render('index', { title: 'CodeLanguage', message : 'Incorrect Email or Password.', flag : 1 });
  }
  else{
    res.render('index', { title: 'CodeLanguage' });
  }
   
});

//Handle POST request for User Registration
router.post('/auth_reg', function(req, res, next){
  
  var fullname = req.body.fullname;
  var email = req.body.email;
  var password = req.body.password;
  var cpassword = req.body.cpassword;

  if(cpassword == password){

    var sql = 'select * from user where email = ?;';

    con.all(sql,[email], function(err, result, fields){
      if(err) throw err;

      if(result.length > 0){
        req.session.flag = 1;
        res.redirect('/');
      }else{

        var hashpassword = bcrypt.hashSync(password, 10);
        var sql = 'insert into user(fullname,email,password) values(?,?,?);';

        con.all(sql,[fullname,email, hashpassword], function(err, result, fields){
          if(err) throw err;
          req.session.flag = 2;
          res.redirect('/');
        });
      }
    });
  }else{
    req.session.flag = 3;
    res.redirect('/');
  }
});


//Handle POST request for User Login
router.post('/auth_login', function(req,res,next){

  var email = req.body.email;
  var password =req.body.password;

  var sql = 'select * from user where email = ?;';
  
  con.all(sql,[email], function(err,result, fields){
    if(err) throw err;

    if(result.length && bcrypt.compareSync(password, result[0].password)){
      req.session.email = email;
      res.redirect('/home');
    }else{
      req.session.flag = 4;
      res.redirect('/');
    }
  });
});


//Route For Home Page
router.get('/home', function(req, res, next){

  if (!req.session.email) {
    res.send('You are not authorized to view this page');
  }
else{

  res.render('home', {message : 'Welcome, ' + req.session.email});
}
});

router.get('/logout', function(req, res, next){
  console.log('b')
  if(req.session.email){
    req.session.destroy();
    res.redirect('/');}
  else{
    req.session.destroy();
    res.redirect('/');
  }
   

})

router.get('/contactos', (req, res) => {
  if (!req.session.email) {

    res.send('You are not authorized to view this page');
  }
  else{
  const sql = 'SELECT * FROM comentarios' 

  con.all(sql,[],(err,rows)=>{
    if(err) return console.error(err.message);

    rows.forEach((row)=>{
      console.log(row);
      //console.log('a')
    res.render('contactos',{ data: JSON.stringify(rows) });
 
    });
  });
}


});




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
  con.run(
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
  //'programacion2ais@dispostable.com'
  var mailOptions = {
    from: 'jmzm08@gmail.com',
    to: ['programacion2ais@dispostable.com','arodu.test@gmail.com'],
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
