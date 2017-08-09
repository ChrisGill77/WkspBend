var bendingCalcs = (function() {

	// Inputs and outputs
	var material = "medium";
	var thickness = 0;
	var radius = 0;
	var setback = 0;
	var angle = 90;
	var kvalue = 0;
	var flange1 = 0, flange2 = 0;
	var leg1 = 0, leg2 = 0;
	var ba = 0;
	var metal = 0;
	
	// Common items
	var ver = 1;		// Version of data in the file
	var dps = 1;		// Number of decimals in calculated values (1 for mm, 2 for inches)
	var KFIELDS = 5;	// Number of form fields for K values
	
	// Tables of K values
	var kbreaks = [1.0, 2.0, Number.MAX_VALUE];			// Break values for the tables
	var ksoft = [0.20, 0.30, 0.50];
	var kmedium = [0.25, 0.33, 0.50];
	var khard = [0.30, 0.40, 0.50];

	// File handling
	var fileSys = null;
	
	//
	// Initialise the app
	//
	function initialise() {
		if (typeof(Storage) !== "undefined") {
			readDataFile();
		} else {
			$("#btnSave").hide();
		}
		
		$("#btnCalc").click(function(){calculateForm()});
		$("#btnSetup").click(function(){showSetupForm()});
		$("#btnCancel").click(function(){showMainForm()});
		$("#btnSave").click(function(){saveSettings()});
		$("#btnHelp1").click(function(){showMainHelp()});
		$("#btnHelp2").click(function(){showSetupHelp()});
		$("#btnBack1").click(function(){showMainForm()});
		$("#btnBack2").click(function(){showSetupForm()});
		
		setDps();
	}

	//
	// If K = 0, use the lookup table to find a typical value
	//
	function lookupKvalue() {
		var rt = radius / thickness;
		var n = kbreaks.length;
		
		for (var i = 0; i < n; i++) {
			if (rt < kbreaks[i]) {
				switch (material) {
					case "soft":    kvalue = ksoft[i];     return;
					case "hard":    kvalue = khard[i];     return;
					default:   		kvalue = kmedium[i];   return;
				}
			}
		}
	}
	
	//
	// Calculate the results for bending
	//
	function calculateForm() {
		if (!parseFields())
			return;
		
		if (kvalue == 0) {
			lookupKvalue();
			$("#fldKvalue").val(kvalue.toFixed(2).toString());
		}
		
		setback = thickness + radius;
		leg1 = flange1 - setback;
		leg2 = flange2 - setback;
		if (angle > 170)
			ba = 0.43 * thickness;		// Approximation for fold-backs
		else
			ba = (Math.PI * angle / 180) * (radius + kvalue * thickness);
		metal = leg1 + leg2 + ba;

		showValue("#fldSetback", setback);
		showValue("#fldLeg1", leg1);
		showValue("#fldLeg2", leg2);
		showValue("#fldAllowance", ba);
		showValue("#fldMetal", metal);
	}
	
	//
	// Show a decimal value to the standard number of DPs
	//
	function showValue(obj, val) {
		$(obj).val(val.toFixed(dps).toString());
	}
	
	//
	// Parse the bending values
	//
	function parseFields() {
		material = $('input[name=fldMaterial]:checked', '#bendform').val(); // returns string

		thickness = parseFloat($("#fldThickness").val());
		if (isNaN(thickness) || (thickness <= 0)) {
			showAlert("The material thickness must be greater than zero");
			return false;
		}
		
		radius = parseFloat($("#fldRadius").val());
		if (isNaN(radius) || (radius < 0.5 * thickness)) {
			showAlert("The corner radius must be greater than half the thickness");
			return false;
		}
		
		angle = parseFloat($("#fldAngle").val());
		if (isNaN(angle) || (angle < 0) || (angle > 180)) {
			showAlert("The bend angle must be between zero and 180°");
			return false;
		}
		
		kvalue = parseFloat($("#fldKvalue").val());
		if (isNaN(kvalue) || (kvalue < 0) || (kvalue > 1)) {
			showAlert("The K value must be between zero and 1. Leave at zero to use the default.");
			return false;
		}

		flange1 = parseFloat($("#fldFlange1").val());
		flange2 = parseFloat($("#fldFlange2").val());
		if (isNaN(flange1) || (flange1 <= 0) || isNaN(flange2) || (flange2 <= 0)) {
			showAlert("The flange lengths must be greater than zero");
			return false;
		}
		
		return true;
	}

	//
	// Show alerts in a browser-friendly manner
	//
	function showAlert(message) {
		if (navigator.notification) {
			navigator.notification.alert(message, null, null, "OK");
		} else {
			alert(message);
		}
	}
	
	//
	// Read the K values and other data if available
	//
	function readDataFile() {
		if (typeof(Storage) === "undefined")
			return;
		
		if (!localStorage.version) {
			writeDataFile();
			return;
		}
		
		var v = JSON.parse(localStorage.version);
		// Future - do something different if v != ver
		
		dps = JSON.parse(localStorage.dps);
		kbreaks = JSON.parse(localStorage.kbreaks);
		ksoft = JSON.parse(localStorage.ksoft);
		kmedium = JSON.parse(localStorage.kmedium);
		khard = JSON.parse(localStorage.khard);
	}
	
	//
	// Write the data to local storage
	//
	function writeDataFile() {
		if (typeof(Storage) === "undefined")
			return;
		
		localStorage.clear();
		localStorage.setItem("version", ver);
		localStorage.setItem("dps", dps);
		localStorage.setItem("kbreaks", JSON.stringify(kbreaks));
		localStorage.setItem("ksoft", JSON.stringify(ksoft));
		localStorage.setItem("kmedium", JSON.stringify(kmedium));
		localStorage.setItem("khard", JSON.stringify(khard));
	}
	
	//
	// Show the settings form
	//
	function showSetupForm() {
		showSettings();
			$("#bendform").hide();
			$("#helpform1").hide();
			$("#helpform2").hide();
			$("#setupform").show();
	}
	
	//
	// Show the main form
	//
	function showMainForm() {
			$("#setupform").hide();
			$("#helpform1").hide();
			$("#helpform2").hide();
			$("#bendform").show();
	}

	//
	// Show the help forms
	//
	function showMainHelp() {
			$("#setupform").hide();
			$("#bendform").hide();
			$("#helpform1").show();
			$("#helpform2").hide();
	}

	function showSetupHelp() {
			$("#setupform").hide();
			$("#bendform").hide();
			$("#helpform2").show();
			$("#helpform1").hide();
	}

	//
	// Display the settings values
	//
	function showSettings() {
		$("#fldDps").val(dps.toString());
		
		// Show the fields for which we have values. Note that we leave the break empty for the last one
		var i = 0;
		for (; i < kbreaks.length; i++) {
			var is = i.toString();
			$("#fldKbrk" + is).val((kbreaks[i] > 999999) ? "" : kbreaks[i].toFixed(3).toString());
			$("#fldKsft" + is).val(ksoft[i].toFixed(3).toString());
			$("#fldKmed" + is).val(kmedium[i].toFixed(3).toString());
			$("#fldKhrd" + is).val(khard[i].toFixed(3).toString());
		}
		
		// Clear out the rest of the fields
		for (; i < KFIELDS; i++) {
			var is = i.toString();
			$("#fldKbrk" + is).val("");
			$("#fldKsft" + is).val("");
			$("#fldKmed" + is).val("");
			$("#fldKhrd" + is).val("");
		}
	}
	
	//
	// Check and save the updated K values
	//
	function saveSettings() {
		if (!parseSettings())
			return;
		
		writeDataFile();
		setDps();
		showMainForm();
	}

	//
	// Set the step size for numeric fields to avoid complaints from browsers
	//
	function setDps() {
		var step = Math.pow(10, -dps);
		$("#fldKvalue").attr("step", step);
		$("#fldThickness").attr("step", step);
		$("#fldRadius").attr("step", step);
		$("#fldAngle").attr("step", step);
		$("#fldFlange1").attr("step", step);
		$("#fldFlange2").attr("step", step);
	}
	
	//
	// Parse the settings and hold them locally until we're sure all is OK
	// The last R/T value may be empty but other than that, all fields must be complete
	//
	function parseSettings() {
		var d = parseFloat($("#fldDps").val());
		if (isNaN(d) || (d < 0) || (d > 9)) {
			showAlert("The number of decimals must be between 0 and 9");
			return false;
		}
		
		var kc = 0;
		var kb = [0, 0, 0, 0, 0];
		var ks = [0, 0, 0, 0, 0];
		var km = [0, 0, 0, 0, 0];
		var kh = [0, 0, 0, 0, 0];
		
		// Parse the values - store blanks as -1 for now
		for (var i = 0; i < KFIELDS; i++) {
			var vn, vs;
			var is = i.toString();
			
			vs = $("#fldKbrk" + is).val();
			if (vs.length == 0) {
				vn = -1;
			}
			else {
				vn = parseFloat(vs);
				if (isNaN(vn) || (vn <= 0)) {
					showAlert("");
					return false;
				}
			}
			kb[i] = vn;
	
			vs = $("#fldKsft" + is).val();
			if (vs.length == 0) {
				vn = -1;
			}
			else {
				vn = parseFloat(vs);
				if (isNaN(vn) || (vn <= 0)) {
					showAlert("");
					return false;
				}
			}
			ks[i] = vn;
	
			vs = $("#fldKmed" + is).val();
			if (vs.length == 0) {
				vn = -1;
			}
			else {
				vn = parseFloat(vs);
				if (isNaN(vn) || (vn <= 0)) {
					showAlert("");
					return false;
				}
			}
			km[i] = vn;
	
			vs = $("#fldKhrd" + is).val();
			if (vs.length == 0) {
				vn = -1;
			}
			else {
				vn = parseFloat(vs);
				if (isNaN(vn) || (vn <= 0)) {
					showAlert("");
					return false;
				}
			}
			kh[i] = vn;
		}
	
		// All rows must be: all empty, all full or break empty and others full but this must be the last row
		kc = -1;
		for (var i = KFIELDS - 1; i >= 0; i--) {
			if ((kb[i] < 0) && (ks[i] < 0) && (km[i] < 0) && (kh[i] < 0)) {
				continue;
			}
			
			if ((ks[i] > 0) && (km[i] > 0) && (kh[i] > 0)) {
				if ((kb[i] < 0) && (kc >= 0)) {
					showAlert("Only the last row can have an empty R/T value");
					return false;
				}
				
				if (kc < 0) {
					kc = i;
				}
			}
			else {
				showAlert("K values must be all set or clear in each row");
				return false;
			}
		}
		
		// All OK - copy the values
		dps = d;
		kbreaks = [];
		ksoft = [];
		kmedium = [];
		khard = [];
		
		for (var i = 0; i <= kc; i++) {
			kbreaks[i] = (kb[i] >= 0) ? kb[i] : Number.MAX_VALUE;
			ksoft[i] = ks[i];
			kmedium[i] = km[i];
			khard[i] = kh[i];
		}
			
		return true;
	}
	
	return {
		init: initialise
	}
})();