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
	dom_cur = null,
	dom_frame = null,
	dom_ep_list;
function load_dom() {
	dom_btn_prev = document.getElementById("btn-prev");
	dom_btn_next = document.getElementById("btn-next");
	dom_cur = document.getElementById("cur");
	dom_frame = document.getElementById("frame");
	dom_ep_list = document.getElementById("ep-list");
}

// State
var index = 0,
	ls_item = "arrowverse_index";

// Local storage
var has_LS = window.localStorage !== undefined;
function load() {
	if(has_LS) {
		index = parseInt(window.localStorage.getItem(ls_item));
		if(isNaN(index)) {
			index = 0;
		}
	}
	refresh_display();
}
function save() {
	if(has_LS) {
		window.localStorage.setItem(ls_item, index.toString());
	}
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
	
	// Display video
	if(info["link"].length === 0) {
		dom_frame.setAttribute("src", "missing.html");
	} else {
		dom_frame.setAttribute("src", info["link"]);
	}
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