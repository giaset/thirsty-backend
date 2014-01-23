var express = require('express');
var app = express();

var insta = require('instagram-node').instagram();

insta.use({ client_id: '49c392e9b0d545da846d722a86670579',
			client_secret: 'e51d7694d016424a81a08f74a285805f' });

app.get('/', function(req, res){
	var body = '<html>'+
		'<head>'+
			'<meta http-equiv-"Content-Type" content="text/html; '+
			'charset=UTF-8" />'+
		'</head>'+
		'<body>'+
			'<form action="/thirsty">'+
				'Liker: <input type="text" name="liker">'+
				'Likee: <input type="text" name="likee">'+
				'<input type="submit" value="Submit" />'+
			'</form>'+
		'</body>'+
		'</html>';


	res.send(body);
});

app.get('/thirsty', function(req, res){
	var body = '<html>'+
		'<head>'+
			'<meta http-equiv-"Content-Type" content="text/html; '+
			'charset=UTF-8" />'+
		'</head>'+
		'<body>'+
			'%s'
		'</body>'+
		'</html>';

	var liker = req.query.liker;
	var likee = req.query.likee;

	insta.user_search(liker, function(err, users, limit) {
		var liker_id = users[0].id;
		insta.user_search(likee, function(err, users, limit) {
			var likee_id = users[0].id;

			var getLikesForImage = function(image, onComplete) {
				insta.likes(image.id, function(err, likes, limit) {
					for (var i = 0; i < likes.length; i++) {
						if (likes[i].id == liker_id) {
							onComplete(image.images.standard_resolution.url);
						}
					}
				});
			};

			var computeThirstWithCallback = function(onComplete) {
				var image_html = '';
				var getImages = function(err, images, pagination, limit) {
					for (var i = 0; i < images.length; i++) {
						getLikesForImage(images[i], function(image_url) {
							var image_tag = '<img src=\"'+image_url+'\"/>'
							console.log(image_tag);
							image_html += image_tag;
						});
					}

					if(pagination.next) {
						pagination.next(getImages);
					} else {
						onComplete(image_html);
					}
				};

				insta.user_media_recent(likee_id, getImages);
			};

			computeThirstWithCallback(function(image_html) {
				res.send(body, image_html);
			});
		});
	});
});

app.listen(3000);
console.log('Listening on port 3000');