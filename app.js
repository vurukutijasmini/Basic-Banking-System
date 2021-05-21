const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost:27017/bankDBS",{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex:true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to database");
});

const userSchema = new mongoose.Schema({
	name: String,
	account : String,
	mobile : Number,
	address : String,
	balance : Number
});


const transSchema = new mongoose.Schema({
	transId: String,
	From : String,
	To : String,
	Time : String,
	Amount : Number
});

const Trans = mongoose.model("Trans",transSchema);

const User = mongoose.model("Users",userSchema);

app.get("/ViewCustomers", function(req,res){

	User.find({},function(err, foundItems) {
		if(err){
			console.log(err);
		}
		else {
			res.render("details",{listItems: foundItems});
		}
	});
});

app.post("/ViewCustomer", function(req,res) {
	var account = req.body.account_id;
	var errormsg = "";
	var link = "ViewCustomer";
	User.find({account:account},function(err,foundItems){
		if(err){
			console.log(err);
			errormsg = "Error in Server";
			res.render("failure",{error_msg:errormsg,links:link});
		}
		else {
			if(foundItems.length > 0){
				res.render("details",{listItems:foundItems});
			}
			else {
				errormsg = "Details with Account Number does not exist ..!";
				res.render("failure",{error_msg:errormsg,links:link});
				
			}
		}
	});
});

app.post("/MakeTransaction",function(req,res){

	var source = req.body.source;
	var dest = req.body.dest;
	var amount = Number(req.body.amount);
	var errormsg = "";
	var link = "MakeTransaction";
	User.find({account:source},function(err,foundItems){
		if(err){
			console.log(err);
			errormsg = "Error in Server";
			res.render("failure",{error_msg:errormsg,links:link});
		}
		else {
			if(foundItems.length == 0){
				errormsg = "Source Account Doesn't exist";
				res.render("failure",{error_msg:errormsg,links:link});
			}
			User.find({account:dest},async function(err,foundItem){
				var id = "JB".concat(String(mongoose.Types.ObjectId()));
				if(err){
					console.log(err);
					errormsg = "Error in Database";
					res.render("failure",{error_msg:errormsg,links:link});
				}
				else{
					if(foundItem.length == 0) {
						errormsg = "Destination Account Doesn't exist";
						res.render("failure",{error_msg:errormsg,links:link});
					}
					if(foundItems[0].balance >= amount){
						var uamount = foundItems[0].balance - amount;
						console.log(uamount);
						var vamount = foundItem[0].balance + amount;
						console.log(vamount);
						User.findOneAndUpdate({account:source},
							{ $set: {balance:uamount}}).exec();
						User.findOneAndUpdate({account:dest},
							{ $set: {balance:vamount}}).exec();
						const transaction = new Trans({
							transId: id,
							From : source,
							To : dest,
							Time : currentdate(),
							Amount : amount
						});
						await transaction.save();
						await Trans.find({transId:id},function(err,found_Item){
							if(err){
								console.log(err);
								errormsg = "Failure at server side";
								res.render("failure",{error_msg:errormsg,links:link});
							}
							else {
								res.render("trans",{transItems:found_Item});
							}
						});
					}
					else {
						errormsg = "Funds not sufficient";
						res.render("failure",{error_msg:errormsg,links:link});
					}
				}
			});
		}
	});
	
});

app.get("/backtoresults",function(req,res){
	res.redirect("/");
});

app.get("/showTransactions",function(req,res){
	Trans.find({},function(err,found_Items){
		res.render("list",{transItems:found_Items});
	});
});

app.get("/",function(req,res){
	res.sendFile(__dirname+"/index.html");
});

app.get("/viewCustomer", function(req,res){
	res.sendFile(__dirname + "/viewCustomer.html");
});

app.get("/makeTransaction", function(req,res){
	res.sendFile(__dirname + "/makeTransaction.html");
});

app.listen(2000,function(req,res){
	console.log("server started at the port 2000");
});

function currentdate() {
	var currentdate = new Date(); 
    var datetime = "" + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();

    return datetime;
}