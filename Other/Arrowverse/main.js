// Preventing iframe breakout: https://stuntcoders.com/snippets/prevent-iframe-breakout/
//*/
window.onbeforeunload = function (e) {
	var message = 'Are you sure you want to leave this page?';
	if (typeof e == 'undefined') {
		e = window.event;
	}
	if (e) {
		e.returnValue = message;
	}
	return message;
}
//*/

// DOM cache
var dom_btn_prev = null,
	dom_btn_next = null,
	dom_cur_link = null,
	dom_cur = null,
	dom_btn_source_prev = null,
	dom_btn_source_next = null,
	dom_source_link = null,
	dom_source = null,
	dom_frame_div = null,
	dom_frame = null,
	dom_ep_list = null;
function load_dom() {
	dom_btn_prev = document.getElementById("btn-prev");
	dom_btn_next = document.getElementById("btn-next");
	dom_cur_link = document.getElementById("cur-link");
	dom_cur = document.getElementById("cur");
	dom_btn_source_prev = document.getElementById("btn-source-prev");
	dom_btn_source_next = document.getElementById("btn-source-next");
	dom_source_link = document.getElementById("source-link");
	dom_source = document.getElementById("source");
	dom_frame_div = document.getElementById("frame-div");
	dom_frame = document.getElementById("frame");
	dom_ep_list = document.getElementById("ep-list");
}

// State
var index = 0,
	source = "adhqmedia.com",
	source_index = 0,
	sources = [],
	source_lookup = {},
	ls_index = "arrowverse_index",
	ls_source = "arrowverse_source";

// Local storage
var has_LS = window.localStorage !== undefined;
function load() {
	if(has_LS) {
		index = parseInt(window.localStorage.getItem(ls_index));
		if(isNaN(index)) {
			index = 0;
		}
		source = window.localStorage.getItem(ls_source);
		if(source === null) {
			source = "adhqmedia.com";
		}
	}
	refresh_display();
}
function save() {
	if(has_LS) {
		window.localStorage.setItem(ls_index, index.toString());
		window.localStorage.setItem(ls_source, source);
	}
}

// Video links
var best_sources = ["adhqmedia.com", "lolzor.com", "openload.co", "vidbaba.com", "vidzi.tv"];
function load_sources(info) {
	source_lookup = info["vid_links"];
	sources = Object.keys(source_lookup).sort();
	if(source_lookup[source] === undefined) {
		source_index = -1;
		var best_source;
		for(var i = 0; i < best_sources.length; i++) {
			best_source = best_sources[i];
			if(source_lookup[best_source] !== undefined) {
				source_index = sources.indexOf(best_source);
				return "Auto";
			}
		}
		source_index = 0;
		return "Default";
	}
	if(sources[source_index] != source) {
		source_index = sources.indexOf(source);
	}
	return false;
}

// Set source
function refresh_source() {
	// Update source name
	source = sources[source_index];
	save();
}

// Set display
function refresh_display() {
	// Fix index value
	index = Math.max(0, Math.min(index, show_order.length - 1));
	save();
	
	// Get info
	var info = show_order[index];
	
	// Set current info
	var content = info["show"] + " " + info["season"] + "-" + info["episode"];
	if(info["title"].length > 0) {
		content += "<br /><i>&quot;" + info["title"] + "&quot;</i>";
	}
	dom_cur.innerHTML = content;
    
    // Set current link
    dom_cur_link.setAttribute("href", info["ep_link"]);
	
	// Set previous info
	if(index <= 0) {
		dom_btn_prev.innerHTML = "Previous: N / A";
	} else {
		var prev_info = show_order[index-1];
		dom_btn_prev.innerHTML = "Previous: " + prev_info["show"] + " " + prev_info["season"] + "-" + prev_info["episode"];
	}
	
	// Set next info
	if(index >= show_order.length - 1) {
		dom_btn_next.innerHTML = "Next: N / A";
	} else {
		var next_info = show_order[index+1];
		dom_btn_next.innerHTML = "Next: " + next_info["show"] + " " + next_info["season"] + "-" + next_info["episode"];
	}
	
	// Get video
	var used_source = load_sources(info);
	var source_name = sources[source_index];

	// Set source info
	var source_content = "";
	if(used_source) {
		source_content = " (" + used_source + ")";
	}
	dom_source.innerHTML = "Source:" + source_content + "<br /><i>" + source_name + "</i>";

	// Set previous source info
	if(source_index <= 0) {
		dom_btn_source_prev.innerHTML = "Previous: N / A";
	} else {
		var prev_source = sources[source_index - 1];
		dom_btn_source_prev.innerHTML = "Previous: " + prev_source;
	}

	// Set next source info
	if(source_index >= sources.length - 1) {
		dom_btn_source_next.innerHTML = "Next: N / A";
	} else {
		var next_source = sources[source_index + 1];
		dom_btn_source_next.innerHTML = "Next: " + next_source;
	}

	// Set source link
	var source_link = source_lookup[source_name];
	dom_source_link.href = source_link;
	
	// Display video
    dom_frame.setAttribute("src", source_link);
}

// Callback to display episode
function jump(ind) {
	window.scrollTo(0, 0);
	index = ind;
	refresh_display();
}

// Add all the episodes as jumpable links
function add_extras() {
	for(var i = 0; i < show_order.length; i++) {
		var info = show_order[i];
		
		var title = "";
		if(info["title"].length > 0) {
			title = '<i>' + info["title"] + '</i>';
		}
		var e = document.createElement("tr");
		e.onclick = new Function('event', "jump(" + i + "); return false;");
		e.innerHTML =
			'<td>' + info["show"] + '</td>' +
			'<td>' + info["season"] + '</td>' +
			'<td>' + info["episode"] + '</td>' +
			'<td>' + title + '</td>';
		dom_ep_list.appendChild(e);
	}
}

// Read from memory and init episode data
function setup() {
	load_dom();

	var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
		navigator.userAgent && !!navigator.userAgent.match('Safari');
	if(isSafari) {
		dom_frame_div.className += " safari";
	}

	load();
	add_extras();
}

// Buttons
function goto_prev() {
	if(index <= 0) {
		return;
	}
	index--;
	refresh_display();
}
function goto_next() {
	if(index >= show_order.length - 1) {
		return;
	}
	index++;
	refresh_display();
}
function source_prev() {
	if(source_index <= 0) {
		return;
	}
	source_index--;
	refresh_source();
	refresh_display();
}
function source_next() {
	if(source_index >= sources.length - 1) {
		return;
	}
	source_index++;
	refresh_source();
	refresh_display();
}