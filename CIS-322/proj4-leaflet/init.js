var map;

// EUGENE, OR
var eugene = [44.0519, 123.0867];

// Credit: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// Marker logic
var markers = {};
function html_delete_button(mark){
	return '<button onclick="deleteMarker(this)" data-marker="' + mark.cis_id + '">Delete</button>';
}
function makeMarker(coords) {
	var mark = L.marker(coords);
	var cis_id = guid();
	mark.cis_id = cis_id;
	markers[cis_id] = mark;
	return mark;
}
function deleteMarker(me) {
	var cis_id = me.getAttribute('data-marker');
	var mark = markers[cis_id];
	if(mark) {
		map.removeLayer(mark);
		delete markers[cis_id];
	}
}

// Position :D
var my_latlng = [0,0];
function updatePos() {
	$.ajax({
		url: 'http://ipinfo.io/',
		dataType: 'json'
	}).success(function(e) {
		var pos = e.loc.split(',');
		my_latlng[0] = parseFloat(pos[0]);
		my_latlng[1] = parseFloat(pos[1]);
	}).error(function(e) {
		my_latlng = eugene;
	}).always(function() {
		map.setView(my_latlng, 14);
		var mark = makeMarker(my_latlng);
		mark.addTo(map);
		mark.bindPopup('<div class="centered">I think you are here...<br />' + html_delete_button(mark) + '</div>');
		mark.openPopup();
	});
}