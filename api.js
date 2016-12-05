var express = require('express');
var request = require('request')  
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());


// Global variables for later use.
var username = "374a4ae1df4ba412cfb9f6485f426143";
var pass = "b6cb8aac2c4f558eeff122a4f2bdbe48";

/**
 * Takes in TuneFind's API response for a search on a TV show name
 * and parses it to extract how many seasons there are, and how many
 * songs and episodes are in each season. For each season, it will also 
 * extract the TuneFind API URL to search for that season. This will be useful
 * to list all the episodes once the user has selected a season. The resulting
 * dictionary has this format: {season number: [song count, episode count, season API URL]}
 * Nothing is returned, but the global variable `seasonsDict` gets populated
 * @param {Object} body - the body of the response in JSON format
 */
 function populateSeasonsDict(body) {
 	var seasonsDict = {};
 	parsedBody = JSON.parse(body);
 	seasons = parsedBody["seasons"];
 	for (i = 0; i < seasons.length; i++) {
 		seasonNumber = seasons[i].number;
 		songCount = seasons[i].song_count;
 		episodeCount = seasons[i].episode_count;
 		seasonURL = seasons[i].tunefind_api_url;
 		seasonsDict[seasonNumber] = [episodeCount, seasonURL];
 	}
 	return seasonsDict;
 };

/**
 * Takes in TuneFind's API response for a search on a season for a TV show
 * and parses it to extract how many episodes there are, the episode names, 
 * and how many songs are in each episode. For each episode, it will also 
 * extract the TuneFind API URL to search for that episode. This will be useful
 * to list all the songs & scenes once the user has selected an episode. The resulting
 * dictionary has this format: {episode number: [episode name, song count, episode API URL]}
 * Nothing is returned, but the global variable `episodesDict` gets populated
 * @param {Object} body - the body of the response in JSON format
 */
 function populateEpisodesDict(body) {
 	var episodesDict = {};
 	parsedBody = JSON.parse(body);
 	episodes = parsedBody["episodes"];
 	for (i = 0; i < episodes.length; i++) {
 		episodeNumber = episodes[i].number;
 		episodeName = episodes[i].name;
 		songCount = episodes[i].song_count;
 		episodeURL = episodes[i].tunefind_api_url;
 		episodesDict[episodeNumber] = [episodeName, episodeURL];
 	}
 	return episodesDict;
 };

/**
 * Takes in TuneFind's API response for a search on a episode within a season for a TV show
 * and parses it to extract song names, artist names, and the scene for each song if applicable. 
 * The resulting dictionary has this format: {song name: [artist name, scene]}
 * Nothing is returned, but the global variable `songsDict` gets populated
 * @param {Object} body - the body of the response in JSON format
 */
function populateSongsDict(body) {
	var songsDict = {};
	parsedBody = JSON.parse(body);
	songs = parsedBody["songs"];
	for (i = 0; i < songs.length; i++) {
		artistName = songs[i].artist.name;
		songName = songs[i].name;
		scene = songs[i].scene;
		if (!scene) {
			scene = "Song isn't used in a particular scene.";
		}
		songsDict[songName] = [artistName, scene];
	}
	return songsDict;
};

// Define your routes here

app.post('/tunefind_get_movie_songs', function(req, res) {
	movieName = req.body.movieName;
	movieName = movieName.replace(/ /g, "-").toLowerCase();
	url = 'https://'+ username + ':' + pass + '@www.tunefind.com/api/v1/movie/' + movieName;

	request(
		{
			url: url
		},
		function(error, response, body) {
			if (error || response.statusCode == 404) {
				res.status(404).send('Error 404: Invalid Movie Name');
			} else {
				var songsDict = populateSongsDict(body);
				res.json(songsDict);
			}			
		}
	)
});

app.post('/tunefind_get_show_seasons', function (req, res, next) {
	showName = req.body.showName;
	showName = showName.replace(/ /g, "-").toLowerCase();
	url = 'https://'+ username + ':' + pass + '@www.tunefind.com/api/v1/show/' + showName;

	request(
		{
			url: url
		},
		function(error, response, body) {
			if (error || response.statusCode == 404) {
				res.status(404).send('Error 404: Invalid Show Name');
			} else {			
				var seasonsDict = populateSeasonsDict(body);
				res.json(seasonsDict);
			}
		}
	)
});

app.post('/tunefind_get_show_episodes', function (req, res, next) {
	selectedSeasonURL = req.body.selectedSeason;
	url = 'https://' + username + ':' + pass + '@' + selectedSeasonURL.substring(8);

	request(
		{
			url: url
		},
		function(error, response, body) {
			var episodesDict = populateEpisodesDict(body);
			res.json(episodesDict);
		}
	)
});

app.post('/tunefind_get_show_songs', function (req, res, next) {
	selectedEpisodeURL = req.body.selectedEpisode;
	url = 'https://' + username + ':' + pass + '@' + selectedEpisodeURL.substring(8);

	request(
		{
			url: url
		},
		function(error, response, body) {
			var songsDict = populateSongsDict(body);
			res.json(songsDict);
		}
	)
});

app.post('/youtube_search', function (req, res, next) {
	youtubeSearch = req.body.youtubeSearch;
	youtubeSearch = youtubeSearch.replace(/(\||-)/g, " ");
	youtubeSearch = youtubeSearch.replace(/&/g, "and"); 
	youtubeSearch = encodeURI(youtubeSearch);
	url = 'https://www.googleapis.com/youtube/v3/search?key=AIzaSyCqzpPsxZBRhNB2UwO4TWpHANu0PXtxyT4&part=snippet&type=video&maxResults=1&q=' + youtubeSearch;

	request(
		{
			url: url
		},
		function(error, response, body) {
			body = JSON.parse(body);
			videoID = body["items"][0]["id"]["videoId"];
			youtubeURL = "https://www.youtube.com/embed/" + videoID
			res.json({'youtubeURL' : youtubeURL});
		}
	)
});

// Start up server on port 3000 on host localhost
var server = app.listen(process.env.PORT || 3001, function () {
  var port = server.address().port;
  console.log('Trackstream server on localhost listening on port ' + port + '!');
  //console.log('Open up your browser (within your VM) and enter the URL "http://localhost:' + port + '" to view your website!');
});