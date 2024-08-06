const http = require('https');

const options = {
	method: 'GET',
	hostname: 'deezerdevs-deezer.p.rapidapi.com',
	port: null,
	path: '/infos',
	headers: {
		'x-rapidapi-key': '4774d2c2ddmsh8ffa7dba3b26a75p16e06ajsna098ef989091',
		'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
	}
};

const req = http.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});

req.end();