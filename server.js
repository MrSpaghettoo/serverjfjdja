require("dotenv").config();
const https = require('https')
const {
	ethers
} = require("ethers");
const {
	toUtf8Bytes
} = require("ethers/lib/utils");
var express = require("express");
var packageInfo = require("../package.json");
const launchFinder = require("./launchFinder");
const fs = require("fs")


const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT;

var app = express();

app.get("/", function(req, res) {
	res.json({
		version: packageInfo.version
	});
});

https
	.createServer({
			key: fs.readFileSync("certificates/server.key"),
			cert: fs.readFileSync("certificates/server.cert"),
		},
		app
	)
	.listen(PORT, function() {
		console.log(
			"Example app listening on port 3000! Go to https://localhost:" + PORT
		);
	});


module.exports = function(bot) {
	app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
	app.post(`/${process.env.RANDOM_PATH}`, (req, res) => {
		try {
			let body = "";
			// Listen for data events on the request stream
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", () => {
				// Do something with the request body
				const providedSignature = req.headers["x-signature"];
				if (!providedSignature) {
					console.log("Signature not provided");
					return;
				}
				const generatedSignature = ethers.utils.keccak256(
					toUtf8Bytes(body + process.env.MORALIS_API)
				);
				if (generatedSignature !== providedSignature) {
					console.log(
						"Invalid Signature",
						generatedSignature,
						providedSignature
					);
					bot.telegram.sendMessage(
						process.env.BAKI,
						"NON VALID DATA RECIVED!!!"
					);
					res.status(201).send("Signature not valid");
					return;
				}
				body = JSON.parse(body);
				console.log("Valid Signature");
				launchFinder(body, bot);
				res.status(200).send("ok");
			});
		} catch (err) {
			bot.telegram.sendMessage(process.env.BAKI,
				"Something broken in server");
			return;
		}
	});
};
