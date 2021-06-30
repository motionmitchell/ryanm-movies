const express = require('express'); // web or [restful] api server
//const morgan = require('morgan');
const bodyParser = require('body-parser'); // allows you to extract data from a web form.
var session = require('express-session');  // store values in session. 
//const mysql = require('mysql2');
const mongoose = require ('mongoose');
var cors = require('cors');
const Models = require('./models.js');
var Movies = mongoose.model('movies');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const auth =require('./auth');
const crypto = require('crypto');
const Bcrypt = require("bcryptjs");
const app = express();
//const GC_MONGO_URL = "mongodb://localhost:27017/movies";
//const GC_MONGO_URL = "mongodb+srv://appjedi:Data2021@cluster0.aga82.mongodb.net/training?retryWrites=true&w=majority";
const GC_MONGO_URL ="mongodb+srv://movieuser:Movie1234@ryanmovies.uyzgj.mongodb.net/movies?retryWrites=true&w=majority";
var PORT = process.env.PORT || 5000;
const ObjectID = require('mongodb').ObjectID;
mongoose.connect(GC_MONGO_URL, { useUnifiedTopology: true, useNewUrlParser: true });
const GC_USERS = [
	{"username":"admin","password":"Test1234","fullname":"Admin","birthday":"1985-01-01T00:00:00.000Z","email":"admin@test.com","favorites":[1,8,3],"roleId":2},
	{"username":"ryan","password":"Test1234","fullname":"Ryan Tester","birthday":"1985-03-03T00:00:00.000Z","email":"ryan@test.com","favorites":[2,4],"roleId":1},
	{"username":"test","password":"Test1234","fullname":"Ryan Tester","birthday":"1985-03-03T00:00:00.000Z","email":"tester@test.com","favorites":[],"roleId":1},
	{"username":"bob","password":"Test1234","fullname":"Ryan Tester","birthday":"1985-03-03T00:00:00.000Z","email":"bob@test.com","favorites":[],"roleId":1},
	{"username":"june","password":"Test1234","fullname":"Ryan Tester","birthday":"1985-03-03T00:00:00.000Z","email":"june@test.com","favorites":[],"roleId":1}
];

app.use(session({secret:'XASDASDA'}));
var ssn;
app.use(bodyParser.urlencoded({ extended: false}));

app.use(cors());
//app.use(morgan('common'));
app.use(express.static("public"))

app.use(function (err, req, res, next){
    console.log(err)
    next(err)
});
app.get ("/", async (req, res) =>{
	res.send("<h1>Hello from Heroku</h1>");
	
});
app.get("/seed",async (req, res)=> {
    
		GC_USERS.forEach ((obj)=>{
			saveUser(obj);
		});
   
	res.end("done");
});
app.get("/movies", async (req, res) =>{
	mongoose.model('movies').find((err,movies)=>{
		res.send(movies);
	});
});
app.get("/movie/title/:title", async (req, res) =>{
	const title = req.params.title;

	mongoose.model('movies').findOne ({description: title},(err,movie)=>{
		res.send(movie);
	});
});
app.get("/movies/genre/:genre", async (req, res) =>{
	const genre = req.params.genre;
	console.log("id: "+genre)

	const movies = await mongoose.model('movies').find ({genre:{category:genre}});
	res.send(movies);
});
app.get("/movies/director/:name", async (req, res) =>{
	const nm = req.params.name;
	console.log("name: "+nm)

	mongoose.model('movies').findOne ({"director.name": {$eq: nm}},(err,movies)=>{
		if (err)
		{
			console.log(err);
		}
		res.send(movies.director);
	});
});
app.get('/users/register', (req, res, next) => {
   
    const form = '<h1>Login Page</h1><form method="POST" action="/users/register">\
    <br/>Enter Username:<br><input type="text" name="email">\
	<br/>Enter Full Name:<br><input type="text" name="fullname">\
	<br/>Enter birthdate:<br><input type="text" name="birthdate">\
    <br>Enter Password:<br><input type="password" name="password">\
    <br><br><input type="submit" value="Submit"></form>';

    res.send(form);

});

app.get('/login', (req, res, next) => {
   
    const form = '<h1>Login Page</h1><form method="POST" action="/users/login">\
    Enter Username:<br><input type="text" name="email">\
    <br>Enter ID:<br><input type="text" name="password">\
    <br><br><input type="submit" value="Submit"></form>';

    res.send(form);

});
var GV_USER=null;
app.post(
	'/users/register',
	//passport.authenticate('signup', { session: false }),
	async (req, res, next) => {
		console.log("register");
		//await saveUser()
		let u={
			email: req.body.email, 
			password:req.body.password,
			fullname: req.body.fullname,
			birthday: req.body.birthdate
		};
		const errors = validateUser(u);
		console.log(errors);
		if (errors.length>0)
		{
			res.json (errors);
			return;
		}

		console.log(u);
		await saveUser(u);
	  res.json({
		message: 'Signup successful',
		user: u
	  });
	}
  );
	function validateUser (user)
	{
		let errors=[]
		if (!validateEmail(user.email))
		{
			errors.push ({field:"email", message:"Invalid email"});
		}
		if (user.password.length < 8)
		{
			errors.push ({field:"password", message:"Too short must be at least 8 characters"});
		}
		if (user.fullname.length < 2)
		{
			errors.push ({field:"fullname", message:"Too short must be at least 2 characters"});
		}
		if (!isValidDate(user.birthday))
		{
			errors.push ({field:"birthday", message:"Invalid date"});
		}
		return errors;
	}
  function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
	}
	function isValidDate(str){
		// STRING FORMAT yyyy-mm-dd
		if(str=="" || str==null){return false;}								
		
		// m[1] is year 'YYYY' * m[2] is month 'MM' * m[3] is day 'DD'					
		var m = str.match(/(\d{4})-(\d{2})-(\d{2})/);
		
		// STR IS NOT FIT m IS NOT OBJECT
		if( m === null || typeof m !== 'object'){return false;}				
		
		// CHECK m TYPE
		if (typeof m !== 'object' && m !== null && m.size!==3){return false;}
					
		var ret = true; //RETURN VALUE						
		var thisYear = new Date().getFullYear(); //YEAR NOW
		var minYear = 1900; //MIN YEAR
		const daysPerMonth = [31,28,31,30,31,30,31,30,31,30,31,31];
		
		// YEAR CHECK
		if( (m[1].length < 4) || m[1] < minYear || m[1] > thisYear){ret = false;}
		// MONTH CHECK			
		const mon = parseInt(m[2])-1;
		let days = daysPerMonth[mon];
		if (mon==1 && leapYear(m[1])) // February, check for leap year
		{
			days=29;
		}
		if( (m[2].length < 2) || m[2] < 1 || m[2] > 12){ret = false;}
		// DAY CHECK
		if( (m[3].length < 2) || m[3] < 1 || m[3] > days){ret = false;}
		
		if (ret)
		{
			let dt = new Date();
			dt.setYear(m[1]);
			dt.setMonth (mon);
			dt.setDate(m[2]);
			//console.log(dt);
			let dt1 = new Date();
			if (dt.getTime()>dt1.getTime())
				return false;
			else
				return true;
		}
		return ret;			
	}

	function leapYear(year)
{
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}
  async function saveUser (user)
  {
	  console.log ("SAVE USER:");
	  const md5sum = crypto.createHash('md5');
	  user.password = md5sum.update(user.password).digest('hex');
	  console.log (user);

	  await mongoose.model('users').create(user);

	
	return;
  } 
  app.get ("/user/id", (req, res, next) => {
	res.send (ssn.userId);
  });
  app.post(
	'/users/login',
	async (req, res, next) => {
	   // const user = {password: req.body.password, email: req.body.email};
	   // console.log(user);
	  passport.authenticate(
		'login',
		async (err, user, info) => {
		  try {
			  console.log ("auth done");
			  //console.log(user);
			if (err || !user) {
			//  const error = new Error('An error occurred.');
				return res.json({Error: "An error occurred."});
			 // return next(error);
			}
  
			req.login(
			  user,
			  { session: false },
			  async (error) => {
				if (error) return next(error);
  
				const body = { _id: user._id, email: user.email };
				const token = jwt.sign({ user: body }, 'TOP_SECRET');
				ssn=req.session;
				ssn.userId =  user._id;
				return res.json({ token });
			  }
			);
		  } catch (error) {
			return next(error);
		  }
		}
	  )(req, res, next);
	}
  );
app.post("/users/registerOld", async (req, res) =>{
	// /users/register?username=june17&email=june17@test.com&fullname=June17 Test&birthday=1990-01-02&password=Test1234;
	console.log (req.body);
	const user = {
		username: req.body.username,
		email: req.body.email,
		fullname:req.body.fullname,
		birthday:req.body.birthday,
		password: req.body.password,
		favorites:[]
	};
	console.log(user);
	mongoose.model('users').create(user);
	res.send(user);
});
app.post("/users/update", async (req, res) =>{
	const id = req.body.id;
	const userUpdate = {
		
		username: req.body.username,
		email: req.body.email,
		fullname:req.body.fullname,
		birthday:req.body.birthday,
		password: req.body.password,
		favorites:[]
	};
	console.log (userUpdate);
	const result = await mongoose.model('users').findOne({_id: ObjectID(id)},(err,user)=>{
		user.username=userUpdate.username;
		user.email=userUpdate.email;
		user.password=userUpdate.password;
		user.birthday=userUpdate.birthday;
//console.log (movie);
		user.save((err)=>{
			if (err)
			{
				console.log (err);
				res.end("user not updated");
			}else{
				res.end("user updated");
			}
	});
	})
});
app.get("/user/movie/add/:un/:id", async (req, res) =>{
	const un = req.params.un;
	const id= req.params.id;
	
	mongoose.model('users').findOne ({username:un},(err,user)=>{
			user.favorites.push (parseInt(id));
//console.log (movie);
			user.save((err)=>{
				if (err)
				{
					console.log (err);
					res.end("Favorite not added");
				}else{
					res.end("Favorite Added");
				}
		});
	});
})
app.get("/user/movie/remove/:un/:id", async (req, res) =>{
	const un = req.params.un;
	const id= parseInt(req.params.id);
	
	mongoose.model('users').findOne ({username:un},(err,user)=>{
			let fav=[];
			user.favorites.forEach ((val)=>{
				if (val!==id)
				{
					fav.push (val);
				}
			})

			user.favorites=fav;
//console.log (movie);
			user.save((err)=>{
				if (err)
				{
					console.log (err);
					res.end("Favorite not removed");
				}else{
					res.end("Favorite removed");
				}
		});
	});
})
app.get("/user/unreg/:un", async (req, res) =>{
	const un = req.params.un;
	mongoose.model('users').deleteOne ({username:un},(err,user)=>{
		//user.remove();
		res.send ("unregistered");
	})
})
app.get("/user/delete/:un", (req, res)=> {
	const un = req.params.un+"";
	//console.log("ID: "+id);
	mongoose.model('users').deleteOne({username:un},(err,u)=>{
		res.end("user deleted");
	});
});
app.get("/users", (req, res)=>{
	const connection = mongoose.connection;
	mongoose.model('users').find ((err,users)=>{
		res.send(users);
	});
});
app.get("/movie/update/:id/:name",  (req, res) =>{
	const id = req.params.id;
	const name = req.params.name;
	
	mongoose.model('movies').findOne ({id: parseInt(id)},(err,movie)=>{
			movie.description=name;

			movie.save((err)=>{
				if (err)
				{
					console.log (err);
					res.end("Movie NOT Updated");
				}else{
					res.end("Movie Updated");
				}
		});
	});
});
app.get("/movie/updateBio/:id/:bio",  (req, res) =>{
	const id = req.params.id;
	const bio = req.params.bio;
	
	//User.update({"created": false}, {"$set":{"created": true}}, {"multi": true}, (err, writeResult) => {});
	var myquery = { "director.id": parseInt(id)};
	var newvalues = { $set: {"director.bio": bio} };
	Movies.updateMany(myquery, newvalues, {"multi": true}, (err, writeResult) => {});
	
	res.end("updated");
});
app.get("/user/:un", async (req, res) =>{
	const un = req.params.un;
	mongoose.model('users').findOne ({username:un},(err,user)=>{
		res.send(user);
	})
});

app.get("/movies/title/:title", async (req, res) =>{
	const title = req.params.title;
	console.log("id: "+genre)
	
	mongoose.model('movies').find ({genre:{category:genre}},(err,movies)=>{
		res.send(movies);
	});
});

app.get("/movies/gd/:genre/:dir", async (req, res) =>{
	const genre = req.params.genre;
	const dir = req.params.dir;
	console.log (dir+", genre: "+genre);
	
	mongoose.model('movies').find ({genre:{category:genre},"director.name": {$eq: dir}},(err,movies)=>{
		if (err)
		{
			console.log(err);
		}
		res.send(movies);
	});
});


app.get("/login",  (req, res) =>{
    ssn=req.session;
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<h3>Login:</h3><form action="login" method="post">');
    res.write('<p>Username: <input type="text" name="username" placeholder="username"></p>');    
    res.write('<p>Password: &nbsp;<input type="password" name="password" placeholder="password"></p>');
    res.write('<p><input type="submit" value="Login"></p>');
    res.write('</form><a href="/new">Create profile</a>');
    res.end();
});
app.post ("/login", async (req, res) =>{
	const un = req.body.username;
	const pw = req.body.password;
	const user = await getUser(un);
	if (user.password==pw)
	{
		ssn=req.session;
        ssn.user=user;
		res.end("logged in");
	}else{
		res.end("invalid loggin");
	}
});
async function getUser (un)
{
	let foundUser = await mongoose.model('users').findOne({ username:un });
	return foundUser;
}
app.get('/secreturl', (req, res) => {
    res.send('This is a secret url with super top-secret content.');
})

function getCurrentUser ()
{
	try {
		const user=ssn.user;
		if (user==null){
			//res.end("not logged in");
			return null;
		}
		return user;
	}catch (e){
		return null;
	}
}
app.get('/users', (req, res) => {
	const user = getCurrentUser();
	if (user==null)
	{
		res.end("no logged in user");
	}else if (user.roleId != 2)
	{
		res.end("not authorized");
	}
	else {
		res.json(users);
	}
})

app.listen(PORT, () => {
    console.log('Your app is listening on port '+PORT);
})
