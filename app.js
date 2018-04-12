const express = require('express'); // this is requiring the server.js
const bodyParser = require('body-parser'); //http body parser
const path = require('path');
const NodeCouchDb = require('node-couchdb'); //this exports the node-couchdb constructor which accepts a host and a port

var mapreduce = require('mapred')();

// accessing the database with login details
const couch = new NodeCouchDb({
	auth:{
		user:'admin',
		password: '12345'
	}
});

// variables created to get the database name and view its content
// the view was created in 
const dbName = 'invoices';
const viewUrl = '_design/all_invoices/_view/allInvoices';
// view the map reduce to see workers with a invoice total greater than 500
const viewUrl2 = '_design/_great500/_view/mapGreat';

// This will bring back a list of all databases
// A view
couch.listDatabases().then(function(dbs){
	console.log(dbs);
});

//express acts as a framework to node.js
const app = express();

//express looks for the views inside folders
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Returns middleware that only parses json and only looks at requests
// content type is json.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// this will get the invoices in our database and lets us view
// the contents of the database
app.get('/', function(req, res){
	//dbName = invoices and viewUrl1 = the view i created in couchdb
	couch.get(dbName, viewUrl).then(
		function(data, headers, status){
			console.log(data.data.rows);
			res.render('index',{
				invoices:data.data.rows
			})
		},
		function(err){
			res.send(err);
		});
});

// this will return the map reduce for workers with an invoice total of 500 or more
//data = data is json response
//headers = headers is an object with all response headers
// status is statusCode number
app.get('/', function(req,res){
    couch.get(dbName, viewUrl2).then(
    	function(data,headers,status){
    		console.log(data.data.rows);
    		res.render('index',{
    			invoices:data.data.rows
    		})
    	},
    	function(err){
    		res.send(err);
    	});
});

//add an invoice to the database
//Create a Post request 
app.post('/invoice/add', function(req, res){
	//variables created to request their details 
	const worker = req.body.worker;
	const labour = req.body.labour;
	const materials = req.body.materials;
	const total = req.body.total;
	const completed = req.body.completed;

	//generates unique ids as a new id needs to be created each time an
	//invoice is created.
	couch.uniqid().then(function(ids){
		const id = ids[0];

		//couch.insert will add the details to the invoices database
		couch.insert('invoices', {
			_id: id,
			worker: worker,
			labour: labour,
			materials: materials,
			total: total,
			completed: completed
		}).then(
			function(data, headers, status){
				//redirects to the home page
				res.redirect('/');
			},
			//error function
			function(err){
				res.send(err);
			});
	});
	
});
//end of add invoice

//updating an invoice in the database
//similar to the insert but we need to add the rev and id
app.post('/invoice/update', function(req, res){
	const id = req.body._id;
	const rev = req.body._rev;
	const worker = req.body.worker;
	const labour = req.body.labour;
	const materials = req.body.materials;
	const total = req.body.total;
	const completed = req.body.completed;

	couch.uniqid().then(function(ids){
		const id = ids[0];

		couch.update('invoices',{
			_id: id,
			_rev: rev,
			worker: worker,
			labour: labour,
			materials: materials,
			total: total,
			completed: completed
		}).then(
			function(data, headers, status){
				res.redirect('/');
			},
			function(err){
				res.send(err);
			});
	});
});
// end of updating an invoice in the database


//delete an invoice
app.post('/invoice/:id', function(req, res){
	const id = req.params.id;
	const rev = req.body.rev;

	//couch delete function passing in the database name,
	//the id and rev.
	couch.del(dbName, id, rev).then(
		function(data, headers, status){
			res.redirect('/');

		},
		function(err){
			res.send(err);
		});
});
// end of delete an invoice


// this allows the server to listen for connections
app.listen(3000, function(){
	console.log('Server Started On Port 3000');
});