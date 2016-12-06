// Event callback
function cb(func, arg) {
	try {
		if(arg) {
			func(arg);
		} else {
			func();
		}
	} catch(e) {
		console.log(e.stack);
	}
	return false;
}

// Formats
var formats = {
	"Single": {
		"exponent": 8,
		"mantissa": 23
	},
	"Double": {
		"exponent": 11,
		"mantissa": 52
	},
	"Extended": {
		"exponent": 15,
		"mantissa": 63
	}
};

// Helper functions
function split(str, format) {
	var t_off = 0,
		t_parts = ["sign", "exponent", "mantissa"];
	for(var i = 0; i < t_parts.length; i++) {
		var t_part = t_parts[i];
		t_parts[i] = str.substr(t_off, format[t_part]);
		t_off += format[t_part];
	}
	return t_parts;
}
function padding(ch, count) {
    return Array(count).fill(ch).join("");
}
function length_pad(str, ch, len) {
    if(str.length >= len) {
        return str.substr(-len);
    }
    return padding(ch, len - str.length) + str;
}
function length_pad_end(str, ch, len) {
    if(str.length >= len) {
        return str.substr(0, len);
    }
    return str + padding(ch, len - str.length);
}
function to_binary(exp, exp_bits) {
	var res = "";
	while(exp > 0 && res.length < exp_bits) {
		res = ((exp % 2 == 0) ? "0" : "1") + res;
		exp = Math.floor(exp / 2);
	}
	return length_pad(res, "0", exp_bits);
}

// Number helpers
function parse_binary_integer(str) {
    var t_pow = 1;
    return str.split("").reduceRight(function(r,c) {
        if(c == "1") {
            r += t_pow;
        }
        t_pow *= 2;
        return r;
    }, 0);
}
function parse_binary_decimal(str) {
    var t_pow = 1;
    return str.split("").reduce(function(r,c) {
        if(c == "1") {
            r += t_pow;
        }
        t_pow /= 2;
        return r;
    }, 0);
}

// Format changed
function formatChanged(form_name) {
	// Dom
	var t_form = document.forms.namedItem(form_name),
		t_format = t_form.elements.namedItem("format").value,
		t_inExp = t_form.elements.namedItem("bits-exp"),
		t_inMan = t_form.elements.namedItem("bits-man");
	// Custom sizes?
	if(t_format == "c") {
		// Enable inputs
		t_inExp.disabled = "";
		t_inMan.disabled = "";
	} else {
		// Disable inputs
		t_inExp.disabled = "disabled";
		t_inMan.disabled = "disabled";
		// Get format
		var t_vals = formats[t_format];
		// Valid format?
		if(t_vals == undefined || t_vals["exponent"] == undefined || t_vals["mantissa"] == undefined) {
			alert("Invalid format: " + t_format);
			return false;
		}
		// Show format
		t_inExp.value = t_vals["exponent"];
		t_inMan.value = t_vals["mantissa"];
	}
}

// Float to Decimal conversion
function calcFloat(sign, exp, exp_bits, man, man_bits) {
    // Calculate
    var res = "0";
    // Calculate exponent
    var t_bias = Math.pow(2, exp_bits - 1) - 1,
        t_exp = parse_binary_integer(exp);
    // Handle cases
    if(t_exp == 0) { // Denormalized
        res = parse_binary_decimal("." + padding("0", t_bias - 1) + man);
    } else if(t_exp == 2 * t_bias + 1) { // Special
        if(man.indexOf("1") >= 0) {
            return "NaN";
        }
        res = "Infinity";
    } else { // Normalized
        t_exp -= t_bias;
        var t_num = "";
        // Move decimal point
        if(t_exp == -1) {
            t_num = ".1" + man;
        } else if(t_exp < 0) {
            t_num = "." + padding("0", -t_exp - 1) + "1" + man;
        } else if(t_exp == 0) {
            t_num = "1." + man;
        } else if(t_exp < man_bits) {
            t_num = "1" + man.substr(0, t_exp) + "." + man.substr(t_exp);
        } else {
            t_num = "1" + man + padding("0", t_exp - man_bits) + ".";
        }
        // Parse
        var t_loc = t_num.indexOf(".");
        res = parse_binary_integer(t_num.substr(0, t_loc)) + parse_binary_decimal(t_num.substr(t_loc));
    }
    // Return with sign
    return (sign == "0" ? "+" : "-") + res;
}

// Float to Decimal submit
function floatToDecimal() {
    // DOM
	var t_form = document.forms.namedItem("f2d"),
		t_exp_bits = parseInt(t_form.elements.namedItem("bits-exp").value),
		t_man_bits = parseInt(t_form.elements.namedItem("bits-man").value);
    // Check bits
    if(t_exp_bits == NaN || t_exp_bits <= 1 || t_man_bits == NaN || t_man_bits <= 0) {
        alert("Invalid bit lengths, Exponent >= 2 bits, and Mantissa >= 1 bit");
        return false;
    }
    // Inputs
    var t_mode = t_form.elements.namedItem("mode").value,
        t_signE = t_form.elements.namedItem("sign"),
		t_sign = t_signE.value,
        t_expE = t_form.elements.namedItem("exp"),
		t_exp = t_expE.value,
        t_manE = t_form.elements.namedItem("man"),
		t_man = t_manE.value,
        t_wholeE = t_form.elements.namedItem("whole"),
		t_whole = t_wholeE.value;
    // Fix inputs
    t_sign = t_sign.replace(/[^01]/g, "");
    t_exp = t_exp.replace(/[^01]/g, "");
    t_man = t_man.replace(/[^01]/g, "");
    t_whole = t_whole.replace(/[^01]/g, "");
    // Parse whole input
    if(t_mode == "whole") {
        t_whole = length_pad_end(t_whole, "0", 1 + t_exp_bits + t_man_bits);
        var t_parts = split(t_whole, {
            "sign": 1,
            "exponent": t_exp_bits,
            "mantissa": t_man_bits
        });
        t_sign = t_parts[0];
        t_exp = t_parts[1];
        t_man = t_parts[2];
    }
	// Fix input lengths
    if(t_sign.length != 1) {
        t_sign = "0";
    }
    t_exp = length_pad_end(t_exp, "0", t_exp_bits);
    t_man = length_pad_end(t_man, "0", t_man_bits);
	t_whole = t_sign + "|" + t_exp + "|" + t_man;
    // Parse float
    var t_res = calcFloat(t_sign, t_exp, t_exp_bits, t_man, t_man_bits);
    // Successful?
    if(t_res.length == 0) {
        alert("Could not calculate value");
        return false;
    }
    // Output
    var t_out = document.getElementById("f2dOut");
    t_out.innerHTML = t_res;
	// Set input values
	t_wholeE.value = t_whole;
	t_signE.value = t_sign;
	t_expE.value = t_exp;
	t_manE.value = t_man;
}

// Decimal to float conversion
function calcDecimal(value, exp_bits, man_bits) {
	if(value == 0) {
		return ["0", padding("0", exp_bits), padding("0", man_bits)];
	}
	var sign = "",
		exp = "",
		man = "",
		res = "";
	// Handle sign bit
	sign = (value < 0) ? "1" : "0";
	value = Math.abs(value);
	// Handle exponent
	var bias = Math.pow(2, exp_bits - 1) - 1;
	exp = bias;
	while(value >= 2 && exp < bias * 2 + 1) {
		exp++;
		value /= 2;
	}
	while(value < 1 && exp >= 0) {
		exp--;
		value *= 2;
	}
	// Valid exp?
	if(value < 1 || value >= 2) {
		return "NaN";
	}
	// To binary
	exp = to_binary(exp, exp_bits);
	// Handle mantissa
	value--;
	while(man.length < man_bits) {
		value *= 2;
		if(value >= 1) {
			man += "1";
			value--;
		} else {
			man += "0";
		}
	}
	return [sign, exp, man];
}

// Decimal to Float submit
function decimalToFloat() {
    // DOM
	var t_form = document.forms.namedItem("d2f"),
		t_exp_bits = parseInt(t_form.elements.namedItem("bits-exp").value),
		t_man_bits = parseInt(t_form.elements.namedItem("bits-man").value),
		t_signE = document.getElementById("d2fOut-sign"),
		t_expE = document.getElementById("d2fOut-exp"),
		t_manE = document.getElementById("d2fOut-man"),
		t_wholeE = document.getElementById("d2fOut-whole");
    // Check bits
    if(t_exp_bits == NaN || t_exp_bits <= 1 || t_man_bits == NaN || t_man_bits <= 0) {
        alert("Invalid bit lengths, Exponent >= 2 bits, and Mantissa >= 1 bit");
        return false;
    }
    // Inputs
    var t_valueE = t_form.elements.namedItem("value"),
		t_value = t_valueE.value;
	// Fix input
	t_value = t_value.replace(/[^+-\.0-9]/g, "");
	// Parse input
	t_value = parseFloat(t_value);
	if(isNaN(t_value)) {
		alert("Invalid input");
		return false;
	}
	// Parse decimal
	var t_res = calcDecimal(t_value, t_exp_bits, t_man_bits);
	// Successful?
	if(typeof t_res == "string") {
		alert("Could not calculate value");
		return false;
	}
	// Outputs
	t_wholeE.innerHTML = t_res.join("|");
	t_signE.innerHTML = t_res[0];
	t_expE.innerHTML = t_res[1];
	t_manE.innerHTML = t_res[2];
}