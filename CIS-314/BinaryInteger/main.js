// Event callback
function cb(func, arg) {
	try {
		if(arg) {
			func(arg);
		} else {
			func();
		}
	} catch(e) {
		console.error(e.stack);
	}
	return false;
}

// Lookups
var binary_lookup = {
	"0": "0000", "1": "0001", "2": "0010", "3": "0011",
	"4": "0100", "5": "0101", "6": "0110", "7": "0111",
	"8": "1000", "9": "1001", "A": "1010", "B": "1011",
	"C": "1100", "D": "1101", "E": "1110", "F": "1111"
};
var hex_lookup = {
	"0000": "0", "0001": "1", "0010": "2", "0011": "3",
	"0100": "4", "0101": "5", "0110": "6", "0111": "7",
	"1000": "8", "1001": "9", "1010": "A", "1011": "B",
	"1100": "C", "1101": "D", "1110": "E", "1111": "F"
};

// Helper function
function chunk(arr, size) {
	return arr.reduce(function(r,c) {
		if(r.length == 0 || r[r.length-1].length >= size) {
			r.push([]);
		}
		r[r.length-1].push(c);
		return r;
	}, []);
}

// Padding functions
function padding(ch, count) {
	return Array(count).fill(ch).join("");
}
function binary_pad(str) {
	var t_extra = "";
	if(str.length % 4 != 0) {
		t_extra = padding("0", 4 - (str.length % 4));
	}
	return t_extra + str;
}
function length_pad(str, ch, length) {
	if(str.length >= length) {
		return str.substr(-length);
	}
	return padding("0", length - str.length) + str;
}
function number_pad_binary(b, length,unsigned) {
	if(unsigned && length == 0) {
		return binary_pad(b);
	}
	return length_pad(b, "0", length);
}
function number_pad_hex(h, length,unsigned) {
	if(unsigned && length == 0) {
		return "" + h;
	}
	return length_pad(h, "0", Math.floor(length / 4));
}

// The actual logic
var number_lookup = {
	"binary": {
		"binary": function(b, length,unsigned) {
			// Add "|" every four bits
			return chunk(b.split(""), 4).map(function(r) { return r.join(""); }).join("|");
		},
		"decimal": function(b, length,unsigned) {
			// Convert
			var power = 1;
			return b.split("").reduceRight(function(r,c,i) {
				if(c == "1") {
					// Sign bit (for twos) counts as negative
					r += (unsigned == false && i == 0) ? -power : power;
				}
				power *= 2;
				return r;
			}, 0).toString();
		},
		"hex": function(b, length,unsigned) {
			// Convert every four to a hex character
			return chunk(b.split(""), 4).map(function(r) { return hex_lookup[r.join("")]; }).join("");
		}
	},
	"decimal": {
		"binary": function(d, length,unsigned) {
			// Parse input
			var t_num = parseInt(d);
			// Valid input?
			if(t_num == NaN || (unsigned && t_num < 0)) {
				return "";
			}
			// Handle negative numbers
			var t_neg = false;
			if(!unsigned && t_num < 0) {
				t_num = -(t_num + 1);
				t_neg = true;
			}
			// Convert
			var t_res = "";
			while(t_num > 0) {
                t_res = (t_num % 2) + t_res;
				t_num = Math.floor(t_num / 2);
			}
            // Fix the length
            if(length > 0) {
                t_res = length_pad(t_res, "0", length);
            } else {
                t_res = binary_pad(t_res);
            }
			// Flip if original was negative
			if(t_neg) {
				t_res = t_res.split("").map(function(a) { return a == "0" ? "1" : "0"; }).join("");
			}
			// Add "|" with binary-binary conversion
			return number_lookup["binary"]["binary"](t_res, length,unsigned);
		},
		"decimal": function(d, length,unsigned){
			// Convert to binary without "|"
			var t_binary = number_lookup["decimal"]["binary"](d, length,unsigned).replace(/\|/g, "");
            // Convert back to decimal (handles overflow)
			return number_lookup["binary"]["decimal"](t_binary, length,unsigned);
		},
		"hex": function(d, length,unsigned) {
			// Convert to binary without "|"
			var t_binary = number_lookup["decimal"]["binary"](d, length,unsigned).replace(/\|/g, "");
			// Use binary-hex conversion
			return number_lookup["binary"]["hex"](t_binary, length,unsigned);
		}
	},
	"hex": {
		"binary": function(h, length,unsigned) {
			// Convert to binary with "|" between each hex (four bits)
			return h.split("").map(function(c) { return binary_lookup[c]; }).join("|");
		},
		"decimal": function(h, length,unsigned) {
			// Convert to binary without "|"
			var t_binary = number_lookup["hex"]["binary"](h, length,unsigned).replace(/\|/g, "");
			// Use binary-decimal conversion
			return number_lookup["binary"]["decimal"](t_binary, length,unsigned);
		},
		"hex": function(h, length,unsigned) {
			return h;
		}
	}
};

// Handler for form submission
function submitted(form_name) {
	// DOM
	var t_form = document.forms.namedItem(form_name),
		t_size = t_form.elements.namedItem("size").value,
		t_sizeCustom = t_form.elements.namedItem("size-custom").value,
		t_mode = t_form.elements.namedItem("mode").value,
		t_input = t_form.elements.namedItem(t_mode).value;
	// Set unsigned
	var unsigned = form_name == "unsigned";
	// Get the length
	var len = 32;
	if(t_size == "c") {
		len = parseInt(t_sizeCustom);
	} else {
		len = parseInt(t_size);
	}
	// Invalid length?
	if(len == NaN || len < 0 || len % 4 != 0 || (len == 0 && (!unsigned || t_size != "0"))) {
		alert("The size must be a positive multiple of four bits");
		return false;
	}
	// Set length for lookups
	var length = len;
	// Fix input
	switch(t_mode) {
		case "binary": {
            // Strip invalid characters
			t_input = t_input.replace(/[^01]/g, "");
            // Default value if empty
			if(t_input.length == 0) {
				t_input = "0";
			}
            // Correct the length of input
			t_input = number_pad_binary(t_input, length,unsigned);
		} break;
		case "decimal": {
            // Strip invalid characters
			t_input = t_input.replace(/[^-+0-9]/g, "");
            // Remove sign if unsigned input
			if(unsigned) {
				t_input = t_input.replace(/[-+]/g, "");
			}
            // Default value if empty
			if(t_input.length == 0) {
				t_input = "0";
			}
		} break;
		case "hex": {
            // Strip invalid characters
			t_input = t_input.toUpperCase().replace(/[^0-9A-F]/g, "");
            // Default value if empty
			if(t_input.length == 0) {
				t_input = "0";
			}
            // Correct the length of input
			t_input = number_pad_hex(t_input, length,unsigned);
		} break;
		default: {
			alert("Error: Invalid mode selected");
			return false;
		}
	}
    // Modes
    var t_modes = ["binary", "decimal", "hex"];
	// Get outputs
	var t_results = ["", "", ""];
	for(var i = 0; i < t_results.length; i++) {
        // Get result
		t_results[i] = number_lookup[t_mode][t_modes[i]](t_input, length,unsigned);
        // Invalid result?
		if(t_results[i].length == 0) {
			alert("Error: Could not convert");
			return false;
		}
	}
	// Set outputs
	for(var i = 0; i < t_modes.length; i++) {
		document.getElementById(form_name + "--" + t_modes[i]).innerHTML = t_results[i];
	}
    // Prevent event propagation
	return false;
}

// Handler for size drop-down
function sizeChanged(form_name) {
	// DOM
	var t_form = document.forms.namedItem(form_name),
		t_size = t_form.elements.namedItem("size").value,
		t_sizeCustom = t_form.elements.namedItem("size-custom");
	// Enable/disable custom size input
	if(t_size == "c") {
		t_sizeCustom.disabled = "";
	} else {
		t_sizeCustom.disabled = "disabled";
	}
	return false;
}