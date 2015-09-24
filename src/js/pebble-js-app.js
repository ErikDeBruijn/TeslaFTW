/*
IDEAS: Shake to refresh range/climate?

*/
var access_token;
var TESLA_CLIENT_ID='e4a9949fcfa04068f59abb5a658f2bac0a3428e4652315490b659d5ab3f35a9e';
var TESLA_CLIENT_SECRET='c75f14bbadc8bee3a7594412c31416f8300256d7668ea7e6e7f06727bfb9d220';

var debug = localStorage.getItem('debug') || false; 
var vehicleID = localStorage.getItem('vehicleID') || null;
var retries = 3;
var passiveRequest = true;
var chargeData;
var climateData;
var settingStore;
var portal = 'https://owner-api.teslamotors.com';

var settings = {
	kwh_cost: 0.21,
	currency_unit: "EUR",
	distance_unit: "km",
	distance_factor: 1.60934
};
Pebble.addEventListener("ready",
    function(e) {
        console.log("==== TESLA CTL =====");
		chargeData = null;
		climateData = null;
		settingStore = JSON.parse(localStorage.getItem('settings')) || {unitOfDistance:'mi',unitOfCurrency:'USD',kwhCost:0.30};
		settings.distance_unit = settingStore.unitOfDistance;
		settings.distance_factor = (settings.distance_unit == 'km' ? 1.60934 : 1);
		settings.currency_unit = settingStore.unitOfCurrency;
		settings.temperature_unit = (settings.distance_unit == 'km' ? 'C' : 'F');
		settings.kwh_cost = (0+settingStore.kwhCost) || 0.30;
//		portal = settingStore.APIURL || 'https://portal.vn.teslamotors.com';
		// portal = 'https://owner-api.teslamotors.com';
        console.log("Username: "+settingStore.username + ", password: "+settingStore.password + ", vehicleID: "+vehicleID + ", debug: "+debug);
		console.log("Settings:" + JSON.stringify(settings));

        setTimeout(function(){
            if(settingStore.username === "" || settingStore.username === false || settingStore.username === null) {
                Pebble.showSimpleNotificationOnPebble("About Tesla FTW!", "Hi, use the phone app to go to \"Settings\" and enter your Tesla Login.\n\nEnjoy, Erik");
                return false;
            }
            if(vehicleID === null) {
                console.log("Need a vehicleID...");
                doLogin(['getVehicles','getClimateState','getChargedState']);
            } else {
				doLogin(['getClimateState','getChargedState']);// passively get charged state (skip popup)
            }
        },1000);
    }
);

// setInterval(function(){window.batteryPercInt--;},1000);

function appmessage(e) {
    console.log("Received msg: ");
    console.log(e.payload);
    console.log("Menu = " + typeof e.payload.menuIndexClicked);

	if(typeof e.payload.menuIndexClicked == 'number') {
		passiveRequest = false;
		console.log("==== menuIndexClicked = " + e.payload.menuIndexClicked);
		switch (e.payload.menuIndexClicked) {
			case 0: console.log("MENU0.0: Turn on AC");
				if(vehicleID === null)
					doLogin(['getVehicles',{name:"Enable A/C",cmd:"auto_conditioning_start",method:'POST'}]);
				else
					performActions([{name:"Enable A/C",cmd:"auto_conditioning_start",method:'POST'}]);
				break;
			case 1:
				console.log("MENU0.1: Climate stats");
				if(vehicleID === null)
					doLogin(['getVehicles','getClimateState']);
				else
					getClimateState([]);
				break;
			case 10:
				console.log("MENU1.0: Start charge");
				performActions([
					{name:"Open charge door",cmd:"charge_port_door_open",method:'POST'},
					{name:"Start charge",cmd:"charge_start",method:'POST'}]
				);
				break;
			case 11:
				console.log("MENU1.1: Get range");
				performActions(['getChargedState']);
				break;
			case 12:
				console.log("MENU1.2: Stop charge");
				performActions([{name:"Stop charging",cmd:"charge_stop",method:'POST'}]);
				break;
			case 20:
				console.log("MENU2.0: Lock doors");
				performActions([{name:"Lock doors",cmd:"door_lock",method:'POST'}]);
				break;
			case 21:
				console.log("MENU2.1: Honk");
				performActions([{name:"Honk horn",cmd:"honk_horn",method:'POST'}]);
				break;
			case 22:
				console.log("MENU2.2: Flash lights");
				performActions([{name:"Flash lights",cmd:"flash_lights",method:'POST'}]);
				break;
			case 23:
				console.log("MENU2.3: Reconnect vid="+ vehicleID);
				Pebble.showSimpleNotificationOnPebble("Reconnect", "I will attempt to reconnect to the API, find your car and get info about it.");
				performActions(['resetdata','doLogin','getVehicles','getChargedState','disablePassiveRequests']);
				break;
			case 24:
				console.log("MENU2.4: Get Vehicle info vid="+ vehicleID);
				performActions([{name:'Get vehicle info',cmd:'vehicle_state',method:'GET'}]);
				break;
			case 25:
				console.log("MENU2.5: Turn off A/C vid="+ vehicleID);
				performActions([{name:'Turn off A/C',cmd:'auto_conditioning_stop',method:'POST'}]);
				break;

			case 26:
				console.log("MENU2.6: About");
				Pebble.showSimpleNotificationOnPebble("About Tesla FTW!", "By Erik de Bruijn.\nTesla is a brand owned by Tesla Motors. This application is not affiliated or endorsed by Tesla Motors.\n\nDedicated to Elon Musk who is a big inspiration to me and whom I hope to meet one day.\n\nEnjoy, Erik");
				break;
			case 99:
				console.log("99: App loaded");
				performActions(['resetdata']);
				break;
			default:
			console.log("menu option undef.");
			break;
		}
	}
}

function performActions(actions) {
	console.log("performActions("+actions+")");
	var action = actions.shift();
	console.log("performActions: next up is "+action+"\n");
	if(vehicleID === null) {
		if(action != 'getVehicles')
			actions.unshift('getVehicles');
		if(action != 'doLogin')
			actions.unshift('doLogin');
	}
	switch(action) {
		case 'getVehicles': getVehicles(actions); break;
		case 'getChargedState': getChargedState(actions); break;
		case 'getClimateState': getClimateState(actions); break;
		case 'disablePassiveRequests': passiveRequest = false; break;
		case 'enablePassiveRequests': passiveRequest = true; break;
		case 'resetdata':
			console.log("Resetting vars...");
			passiveRequest = true;
			chargeData = null;
			climateData = null;
			vehicleID = null;
			localStorage.removeItem('vehicleID');
			retries = 3;
			// performActions(actions);
			break;
	}
	if(typeof action == 'object' && action.cmd) {
		performCommand(action,actions);
	}
	if(--retries > 0 && (vehicleID === null)) {
		console.log("Calling performActions() from performActions() itself (retries = "+retries+").");
		return performActions(actions);
	}
}
// IO calls to API uses code from: https://github.com/hjespers/teslams
function doLogin(actions) {
	// if(access_token)
		// return performActions(actions); // perform remaining actions
	//FIXME: get access_token
	console.log("doLogin(): Attempting to receive a token");
	var data = new FormData();
	data.append('grant_type','password');
	data.append('client_id',TESLA_CLIENT_ID);
	data.append('client_secret',TESLA_CLIENT_SECRET);
	data.append('email', settingStore.username.trim());
	data.append('password', settingStore.password.trim());
	var req = new XMLHttpRequest();
	req.TimeOut = 2000;
	req.open('POST', portal+'/oauth/token',true);
	req.onreadystatechange = function(e) {
		if (req.readyState == 4) {
			console.log("doLogin() response (http: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				try { data = JSON.parse(this.responseText); } catch(err) { return cb(new Error('login failed')); }
				if (typeof data != "object") return cb(new Error('expecting a JSON object from Tesla Motors cloud service'));
				console.log(data);
				access_token = data.access_token;
				console.log('access_token' + access_token);
				Pebble.sendAppMessage({"99":"Success!!"});
				performActions(actions); // perform remaining actions
			} else {
				console.log("Failed. "+ req.status.toString()+ " "+e.error+" " +req.error+ "response Text"+req.responseText);
				Pebble.showSimpleNotificationOnPebble("Connection problem", "Could not verify username and password at "+ portal + '/login. Invalid HTTPS response.');
			}
		}
	};
	req.onload = function(e) {
		if (req.readyState == 4) {
			console.log("Response (status: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				Pebble.sendAppMessage({"99":"Success!!"});
				performActions(actions); // perform remaining actions
			} else {
				console.log("Failed. "+ req.status.toString()+ " "+e.error+" " +req.error);
				Pebble.sendAppMessage({"99":"Login failed!"});
				Pebble.showSimpleNotificationOnPebble("Login failure", "There was a login error (username="+settingStore.username+"): "+ req.status.toString()+ " "+e.error);
			}
		}
	};
	req.send(data);
}

// IO calls to API uses code from: https://github.com/hjespers/teslams
function getVehicles(actions) {
	console.log("getVehicles(): Attempting to receive an array (!) of vehicles :)");

	var req = new XMLHttpRequest();
	req.open('GET', portal +'/api/1/vehicles', true);
	req.setRequestHeader('Authorization','Bearer '+access_token);
	req.onload = function(e) {
		if (req.readyState == 4) {
			console.log("Response (status: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				console.log("HTTP GET success.\n");
				try { data = JSON.parse(this.responseText); } catch(err) { return cb(new Error('login failed')); }
				if (typeof data != "object") return cb(new Error('expecting a JSON object from Tesla Motors cloud service'));
				console.log("Vehicles (num="+ data.response.length+ "): ");
				if(data.response.length !== 0) {
					vehicleData = data.response[0];
					if(data.response.length > 1)
						Pebble.showSimpleNotificationOnPebble("Vehicle list", "Multiple vehicles were listed ("+data.length+"). Using the first one: "+vehicleData.id_s);
					if(data.response.length == 1)
						Pebble.showSimpleNotificationOnPebble("Vehicle list", "1 vehicle found: "+vehicleData.id_s+": "+JSON.stringify(vehicleData));
					localStorage.setItem('vehicleData', vehicleData);
					localStorage.setItem('vehicleID', vehicleData.id_s);
					vehicleID = vehicleData.id_s;
					console.log("Using vehicle ID "+vehicleID);
					performActions(actions); // perform remaining actions
				} else
				Pebble.showSimpleNotificationOnPebble("Vehicle list", "No vehicles were listed.");
			} else {
				console.log("Failed.\n");
				Pebble.sendAppMessage({"99":"Failed retrieval!"});
			}
		}
	};
	req.send(null);
}

function getChargedState(actions) {
	console.log("getChargedState(vid="+vehicleID+",nextActions="+actions+")");
	if(chargeData) {
		showChargedState(chargeData);
		return;
	}

	var req = new XMLHttpRequest();
	// var url = portal +'/api/1/vehicles/29990376295568339/data_request/charge_state';
	var url = portal +'/api/1/vehicles/'+vehicleID+'/data_request/charge_state';
	console.log("GET "+url);
	req.open('GET', url, true);
	req.setRequestHeader('Authorization','Bearer '+access_token);
	req.setRequestHeader('User-Agent', 'Model S 2.1.79 (Nexus 5; Android REL 4.4.4; en_US)');
	req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	req.setRequestHeader('Accept-Encoding', 'gzip,deflate');
	req.onload = function(e) {
		if (req.readyState == 4) {
			console.log("Response (status: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				console.log("HTTP GET success.\n");
				try { data = JSON.parse(this.responseText); } catch(err) { return cb(new Error('Data couldnt be parsed. Is it JSON? '+this.responseText)); }
				if (typeof data != "object") return cb(new Error('expecting a JSON object from Tesla Motors cloud service'));
				console.log("Results (num="+ data.length+ "): ");
				console.log(data);
				chargeData = data.response;
				console.log("chargeData: "+chargeData);

				if(data.length !== 0) {
					theData = data[0];
					if(!passiveRequest) // Don't show popup if its not a GUI initiated request.
						showChargedState(data);

					Pebble.sendAppMessage({ "batteryPerc": makeChargeTxtMini(chargeData) + "" },connectOkHandler,connectFailHandler);
					performActions(actions); // perform remaining actions
				}
			} else {
				console.log("Failed.\n");
				Pebble.sendAppMessage({"99":"Failed!!"});
			}
		}
	};
	req.send(null);
}
function showChargedState(data) {
	var chargeTxt = makeChargeTxt(data);
	Pebble.showSimpleNotificationOnPebble("Battery " + data.battery_level + "%", chargeTxt);
}

function makeChargeTxt(data) {
	var chargeTxt = data.charging_state+" ";
	if(data.charging_state == 'Charging')
		chargeTxt = data.charging_state + " " + (parseInt(data.charge_rate*settings.distance_factor,10)) + " " + settings.distance_unit + "/h\n";

	chargeTxt = chargeTxt + "Ideal range "+parseInt(data.ideal_battery_range*settings.distance_factor,10)+" " + settings.distance_unit + " ";

	var chargePhasesStr = (data.charger_phases >= 2 ? (data.charger_phases+"x") : "");
	var chargePowerStr = "";
	if(data.charger_voltage > 0)
		chargePowerStr = chargePhasesStr + data.charger_voltage + "V " + data.charger_actual_current + "A " +
		parseInt(data.charger_voltage * data.charger_actual_current/100,10)/10 + "kW";
	var now = new Date().getHours() + new Date().getMinutes()/60;
	var chargeCompleteAt = "";
	if(data.time_to_full_charge > 0) {
		chargeCompleteAt = (data.time_to_full_charge + now) % 24;
		chargeCompleteAt =  parseInt(chargeCompleteAt,10)+":" + zeroFill(parseInt(60*(chargeCompleteAt - parseInt(chargeCompleteAt,10)),10),2);
	}

	if(data.charging_state == 'Charging' || data.charging_state == 'Completed' || data.charging_state == 'Stopped')
		chargeTxt = chargeTxt + " (added "+(parseInt(data.charge_miles_added_ideal*settings.distance_factor*10,10)/10)+" " + settings.distance_unit + ", " + data.charge_energy_added + "kWh, "+ (parseInt(data.charge_energy_added*settings.kwh_cost*100,10)/100) +" "+settings.currency_unit+")\n" +
		chargePowerStr;
	if(data.charging_state == 'Charging')
		chargeTxt = chargeTxt + " (" + data.time_to_full_charge + "h left. At " + data.charge_limit_soc + "% at "+ chargeCompleteAt +")\n";
	return chargeTxt;
}

function makeChargeTxtMini(data) {
	var chargeTxt = data.battery_level + "% " + parseInt(data.ideal_battery_range*settings.distance_factor,10) + settings.distance_unit + " " + data.charging_state+" ";
	return chargeTxt;
}

function getClimateState(actions) {
	console.log("getClimateState(vid="+vehicleID+",nextActions="+actions+")");
	if(climateData) {
		Pebble.showSimpleNotificationOnPebble("Car climate",
			"AC: " + (climateData.is_auto_conditioning_on ? "on @ " + climateData.driver_temp_setting + settings.temperature_unit :"off") + "\n" +
			"In/Outside: " + (climateData.inside_temp ? climateData.inside_temp : "???") + "/" +(climateData.outside_temp ? climateData.outside_temp : "???")+" "+settings.temperature_unit +"\n"
		);
		return;
	}

	var req = new XMLHttpRequest();
	// var url = portal+'https://owner-api.teslamotors.com/api/1/vehicles/29990376295568339/data_request/climate_state';
	var url = portal+'/api/1/vehicles/'+vehicleID+'/data_request/climate_state';
	req.open('GET', url, true);
	req.setRequestHeader('Authorization','Bearer '+access_token);
	req.onload = function(e) {
		if (req.readyState == 4) {
			console.log("Response (status: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				try { data = JSON.parse(this.responseText); } catch(err) { return cb(new Error('Data couldnt be parsed. Is it JSON? '+this.responseText)); }
				if (typeof data != "object") return cb(new Error('expecting a JSON object from Tesla Motors cloud service'));
				if(data.response.length !== 0) {
					console.log(data.response.toString());
					theData = data.response;
					climateData = data.response;
					if(!passiveRequest) { // Don't show popup if its not a GUI initiated request.
						Pebble.showSimpleNotificationOnPebble("Car climate",
							"AC: " + (climateData.is_auto_conditioning_on ? "on @ " + climateData.driver_temp_setting + settings.temperature_unit :"off") + "\n" +
							"In/Outside: " + (climateData.inside_temp ? climateData.inside_temp : "???") + "/" +(climateData.outside_temp ? climateData.outside_temp : "???")+ settings.temperature_unit + "\n"
						);
					} 
					// Pebble.sendAppMessage({ "insideDegC": climateData.inside_temp+"C / "+climateData.outside_temp+"C" },connectOkHandler,connectFailHandler);
					Pebble.sendAppMessage({ "interiorTemp": data.inside_temp + "/" + data.outside_temp },connectOkHandler,connectFailHandler);
					performActions(actions); // perform remaining actions
				}
			} else {
				console.log("Failed.\n"+this.getAllResponseHeaders());
				Pebble.sendAppMessage({"99":"Failed!!"});
			}
		}
	};
	req.send(null);
}

function performCommand(action,actions) {
	console.log("cmd: "+action.cmd+"(vid="+vehicleID+")");
	if(typeof action.method == "undefined")
		action.method = 'GET';
	if(action.method == 'POST') {
		chargeData = null; 
		climateData = null;
	}

	var req = new XMLHttpRequest();
	var url = portal +'/api/1/vehicles/'+vehicleID+'/command/'+action.cmd;
	console.log(action.method+" url: "+url);
	req.open(action.method, url, true);
	req.setRequestHeader('Authorization','Bearer '+access_token);
	req.setRequestHeader('User-Agent', 'Model S 2.1.79 (Nexus 5; Android REL 4.4.4; en_US)');
	req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	req.setRequestHeader('Accept-Encoding', 'gzip,deflate');
	req.onload = function(e) {
		if (req.readyState == 4) {
			console.log("Response (status: "+req.status+"): " + this.responseText);
			if(req.status == 200) {
				console.log("HTTP GET success.\n");
				try { data = JSON.parse(this.responseText); } catch(err) { return cb(new Error('Data couldnt be parsed. Is it JSON? '+this.responseText)); }
				if (typeof data != "object") return cb(new Error('expecting a JSON object from Tesla Motors cloud service'));
				console.log(data);
				if(data.response === false) {
					Pebble.showSimpleNotificationOnPebble(action.name,
						"Result: " + data.result + "\n" +
						"Reason: " + data.reason
					);
					performActions(actions);
				}
				else {
					if(typeof data.response == 'undefined')
						Pebble.showSimpleNotificationOnPebble(action.name,"HTTP response:\n"+this.responseText);
					else {
						Pebble.showSimpleNotificationOnPebble(action.name,
							"Success! \n" +
							"" + data.response.reason
						);
					}
					performActions(actions); // perform remaining actions
				}

			} else {
				console.log("Failed.\n");
				Pebble.sendAppMessage({"99":"Failed!!"});
			}
		}
	};
	req.send(null);
}

function connectOkHandler(e) {
	console.log("Successfully delivered message");
}
function connectFailHandler(e) {
	console.log("Failed delivering message");
}

function showConfiguration(e) {
	console.log("Configuration menu....");
	Pebble.openURL('https://dl.dropboxusercontent.com/u/7326702/Do-not-delete/pebbleconf1.html?name='+settingStore.username);
}
function webviewclosed(e) {
    console.log("Configuration window returned: " + e.response);
    var o = JSON.parse(e.response);
    if(o) {
	    console.log("Configuration set e.response.username to: " + o.username);
	    localStorage.setItem('settings', e.response);
    }
}

Pebble.addEventListener("appmessage",appmessage);
Pebble.addEventListener("webviewclosed",webviewclosed);
Pebble.addEventListener("showConfiguration",showConfiguration);


function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}