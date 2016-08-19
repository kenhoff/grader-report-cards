require('dotenv').config();

if (!process.env.FIREBASE_URL) {
	throw "no FIREBASE_URL env var defined"
}

// it's called "code" for a reason!
// (because it's totally unreadable)
var fs = require('fs');
var request = require('request');
var parse = require('csv-parse/lib/sync');
var users = require('./users.js');
var sessions = require('./sessions.js');
var assignments = require('./assignments.js');

request("https://slack.com/api/users.list?token=" + process.env.SLACK_API_TOKEN, function(err, response, body) {
	users = JSON.parse(body).members

	request(process.env.FIREBASE_URL, function(error, response, body) {
		grades = JSON.parse(body)
			// console.log(body);
			// read in attendance
		attendance = fs.readFileSync(__dirname + "/attendance.tsv")
		attendanceArrays = parse(attendance, {
			delimiter: "	"
		})
		attendanceArrays = attendanceArrays.slice(1)
		attendanceObject = {}
		for (userAttendance of attendanceArrays) {
			attendanceObject[userAttendance[0]] = userAttendance.slice(1)
		}

		// instead, what I should be doing is looping through all the keys of users from the firebase object, then just matching real names and attendance information later
		// this lets me just wipe firebase every time we start a class, then I'll know all the report cards are up-to-date

		// console.log(attendanceObject);

		for (var user in grades) { // iterating through keys
			if (grades.hasOwnProperty(user)) {
				// first, check to see if they exist in the list of slack users
				slackUser = getSlackUserByID(user, users)
				if (!slackUser) {
					break;
				}
				// console.log(slackUser);
				// and, check and see if they exist in the attendance object
				userAttendanceObject = attendanceObject[slackUser.name];
				if (!userAttendanceObject) {
					break;
				}

				reportCard = "# " + slackUser.real_name + "\n\n"
				reportCard += "## Attendance\n\n"

				attendedSessions = 0
				for (attendanceDay of userAttendanceObject) {
					if (attendanceDay != "") {
						attendedSessions += 1
					}
				}
				totalSessions = 20
				percentSessions = (attendedSessions / totalSessions) * 100
				reportCard += slackUser.real_name + " attended **" + percentSessions + "%** (" + attendedSessions + "/" + totalSessions + ") of available sessions.\n\n"
				for (var i = 0; i < sessions.length; i++) {
					reportCard += "-	" + sessions[i] + " - **" + ((userAttendanceObject[i] == "x") || (userAttendanceObject[i] == "-") ? "attended" : "did not attend") + "**" + "\n"
				}
				reportCard += "\n"
				reportCard += "## Grades\n\n"
				completedPoints = 0

				for (var assignment in grades[user].assignments) {
					if (grades[user].assignments.hasOwnProperty(assignment)) {
						if (grades[user].assignments[assignment] != null) {
							completedPoints += grades[user].assignments[assignment].score * 100
						}
					}
				}

				totalPoints = 2000
				percentScore = (completedPoints / totalPoints) * 100
				reportCard += slackUser.real_name + " received a score of **" + percentScore.toFixed(2) + "%** (" + completedPoints.toFixed(2) + "/" + totalPoints + " points total) across all assignments.\n\n"

				for (var i = 0; i < assignments.length; i++) {
					reportCard += "-	" + assignments[i] + " - **" + (grades[user].assignments[i] ? grades[user].assignments[i].score * 100 : 0).toFixed(2) + "%**\n"
				}

				reportCard += "\n"
				reportCard += "## Project links\n\n"
				reportCard += "### Portfolio\n\n"
				reportCard += (grades[user].assignments[4] ? grades[user].assignments[4].url : "(unsubmitted)")
				reportCard += "\n\n"
				reportCard += "### TSA Randomizer\n\n"
				reportCard += (grades[user].assignments[15] ? grades[user].assignments[14].url : "(unsubmitted)")
				reportCard += "\n\n"
				reportCard += "### Random Quote App\n\n"
				reportCard += (grades[user].assignments[19] ? grades[user].assignments[19].url : "(unsubmitted)")
				reportCard += "\n\n"

				fs.writeFileSync(__dirname + "/output/" + slackUser.real_name.toLowerCase().split(" ").join("_") + ".md", reportCard)
			}
		}
	})
})



var getSlackUserByID = function(desiredUserID, allSlackUsers) {
	for (var slackUser of allSlackUsers) {
		if (slackUser.id == desiredUserID) {
			return slackUser;
		}
	}
	return null;
}
