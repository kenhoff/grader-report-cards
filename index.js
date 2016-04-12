var users = require('./users.js');

var request = require('request');
var outputGradesForUser = function(user) {
	var userScore = 0;
	var totalScore = 0;
	for (var i = 0; i < 20; i++) {
		if (("assignments" in user) && (user.assignments[i])) {
			// console.log("Assignment " + i + ": " + (user.assignments[i].score * 100).toFixed(2) + "%");
			userScore += user.assignments[i].score * 100;
		} else {
			// console.log("Assignment " + i + ": 0%");
			userScore += 0;
		}
		totalScore += 100;
	}
	// find user
	for (member of users.members) {
		if (member.id == user.id) {
			console.log(member.name);
		}
	}
	console.log("Total: " + ((userScore / totalScore) * 100).toFixed(2) + "% _(" + userScore.toFixed(2) + "/" + totalScore.toFixed(2) + ")_");
}
request(process.env.FIREBASE_URL, function(error, response, body) {
	body = JSON.parse(body)
	for (var userID in body) {
		if (body.hasOwnProperty(userID)) {
			// console.log(body[userID])
			outputGradesForUser(body[userID])
		}
	}
})
