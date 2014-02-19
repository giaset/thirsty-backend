var express = require('express');
var logfmt = require('logfmt');
var app = express();

var insta = require('instagram-node').instagram();
insta.use({ client_id: '49c392e9b0d545da846d722a86670579',
			client_secret: 'e51d7694d016424a81a08f74a285805f' });

app.use(logfmt.requestLogger());

app.get('/', function(req, res){
	var body = '<html>'+
		'<head>'+
			'<meta http-equiv-"Content-Type" content="text/html; '+
			'charset=UTF-8" />'+
		'</head>'+
		'<body>'+
			'<form action="/thirsty">'+
				'Liker: <input type="text" name="liker"><br>'+
				'Likee: <input type="text" name="likee"><br>'+
				'<input type="submit" value="Submit" />'+
			'</form>'+
		'</body>'+
		'</html>';


	res.send(body);
});

app.get('/thirsty', function(req, res){
	res.writeHead(200, { "Content-Type": "text/html" });
	var html_start = '<html>'+
		'<head>'+
			'<meta http-equiv-"Content-Type" content="text/html; '+
			'charset=UTF-8" />'+
		'</head>'+
		'<body>';

	res.write(html_start);

	/* DEFINE OUR FUNCTIONS */

	var getUser = function(username, onComplete) {
		insta.user_search(username, function(err, users, limit) {
			onComplete(users[0]);
		});
	};

	var getUserDisplayName = function(user) {
		return (user.full_name == '') ? user.username : user.full_name;
	};

	var handleImage = function(image, user, onComplete) {
		insta.likes(image.id, function(err, likes, limit) {
			for (var i = 0; i < likes.length; i++) {
				if (likes[i].id == user.id) {
					var thumbnail_url = image.images.standard_resolution.url;
					var image_tag = '<a href=\"'+image.link+'\"><img src=\"'+thumbnail_url+'\"/></a>';
					res.write(image_tag);
					break;
				}
			}
			onComplete();
		});
	};

	var handleAllImages = function(liker, likee) {

		var pageHandler = function(err, images, pagination, limit) {
			var i = 0;

			var handleNextImage = function() {
				if (i < images.length) {
					handleImage(images[i++], liker, handleNextImage);
				} else if (pagination.next) {
					pagination.next(pageHandler);
				} else {
					res.end();
				}
			};

			handleNextImage();
		};

		insta.user_media_recent(likee.id, pageHandler);
	};

	/* NOW CALL THEM */

	// First get the liker
	getUser(req.query.liker, function(user) {
		var liker = user;
		// Next get the likee
		getUser(req.query.likee, function(user) {
			var likee = user;
			// Now that we have the users, write the page header
			res.write('<h1>Photos of ' + getUserDisplayName(likee) + ' liked by ' + getUserDisplayName(liker) + '</h1>');
			// And write images one by one as matches are found
			handleAllImages(liker, likee);
		});
	});

});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
	console.log('Listening on port ' + port);
});