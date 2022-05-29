const express = require('express');
const router = express.Router();
const sqlite3=require('sqlite3').verbose();
const path = require('path');
const XMLHttpRequest = require('xhr2');
const SECRET_KEY = '6LdsNSggAAAAAJyUq-YGe0sDqL26lVQwkPiia2q-';
const fetch = require('node-fetch');

const basededatos=path.join(__dirname,"basededatos","basededatos.db");
const bd=new sqlite3.Database(basededatos, err =>{ 
if (err){
	return console.error(err.message);
}else{
	console.log("db only");
}
})

const create="CREATE TABLE IF NOT EXISTS contactos(email VARCHAR(20),nombre VARCHAR(20), comentario TEXT,fecha DATATIME,ip TEXT, country VARCHAR(20);";

bd.run(create,err=>{
	if (err){
	return console.error(err.message);
}else{
	console.log("table only");
}
})

router.get('/contactos',(req,res)=>{
	const sql="SELECT * FROM contactos;";
	bd.all(sql, [],(err, rows)=>{
			if (err){
				return console.error(err.message);
			}else{
			res.render("contactos.ejs",{datos:rows});
			}
	})
})

//Envio POST del Formulario.
router.post('/',(req,res)=>{
  	const response_key = req.body["g-recaptcha-response"];
  	const secret_key = process.env.KEY_PRIVATE;
  	const url = 
	`https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
  	fetch(url, {
    	method: "post",
  	})
    	.then((response) => response.json())
    	.then((google_response) => {
			//Si se verifica el captcha, automaticamente se hace envia los datos a la Base de Datos
		if (google_response.success == true) {
	//Obtener la fecha/hora
	var hoy = new Date();
	var horas = hoy.getHours();
	var minutos = hoy.getMinutes();
	var segundos = hoy.getSeconds();
  	var hora = horas + ':' + minutos + ':' + segundos + ' ';
  	var fecha = hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear() + '//' + hora;
	  //////////////Obtener la IP publica////////////////
	  var ip = req.headers["x-forwarded-for"];
	  if (ip){
		var list = ip.split(",");
		ip = list[list.length-1];
	 } else {
		ip = req.connection.remoteAddress;
	  }
	  ////////////Obtener el Pais//////////////
	  var XMLHttp = new XMLHttpRequest();
	  XMLHttp.onreadystatechange = function(){
	  if(this.readyState == 4 && this.status == 200) {
		  var ipwhois = JSON.parse(this.responseText); 
		  var country = ipwhois.country 
		  var countryCode = ipwhois.country_code
		  var clientCountry = country + '(' + countryCode + ')'
		}	

		//Ingreso de los registros hacia la Base de Datos
	const sql="INSERT INTO contactos(nombre, email, comentario, fecha,ip,country) VALUES (?,?,?,?,?,?)";
	const nuevos_mensajes=[req.body.nombre, req.body.email, req.body.comentario,fecha,ip,clientCountry];
	bd.run(sql, nuevos_mensajes, err =>{
	if (err){
		return console.error(err.message);
	}
	else{
		res.redirect("/");
		}
	})
} 
	}
}); //=> Llave qué cierra el "if" para obtener el pais

//Obtener el Pais desde la API con la IP.
XMLHttp.open('GET', 'https://ipwho.is/' + ip, true); 
XMLHttp.send();		


router.get('/',(req,res)=>{
	res.render('index.ejs',{datos:{}})
});



module.exports = router});