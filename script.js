//get first page
var URL = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=1&page=';
$.getJSON(URL+'1', function(data) {
	var menuData = data.menus;
	var loaded = 1; //counter to be incremented

	//how many pages of data to load
	var pages = data.pagination.total / data.pagination.per_page;
	var total = data.pagination.total;

	//load remainig pages
	for (i = 2; i <= pages; i++) { //for as many pages as necessary
		$.getJSON(URL+i, function(data) {
			menuData = format(menuData, data.menus); //append new data

			loaded++; 

			if (loaded == pages) { //wait until all data is loaded to run check
				console.log(menuData);
				var verifiedMenus = menuReport(findMenus(menuData), menuData);
				console.log(verifiedMenus); //print result
			}
		});
	}
	
});

//stringify, splice in formatting + data, re-parse
function format(menuData, newData) { 
	newData = JSON.stringify(newData);
	menuData = JSON.stringify(menuData);

	var formattedData = menuData.slice(0, -1)+', '+newData.slice(1); //to remove+add brackets

	return JSON.parse(formattedData);
}

//to find and sort menus
function findMenus(menu) {
	var heads = [];
	var valid = [];
	var invalid = [];

	for(i = 0; i < menu.length; i++) { //find heads
		if (!menu[i].hasOwnProperty('parent_id')) {
			heads.push(menu[i]);
		} 
	}

	for (i = 0; i < heads.length; i++) { //sort heads in/valid
		if (checkMenu(menu, heads[i], [heads[i].id])) {
			valid.push(heads[i]);
		} else {
			invalid.push(heads[i]);
		}
	}

	//console.log(valid,invalid);
	return [valid,invalid];
}

//check if cyclical
function checkMenu(original, working, past) {
	if (working.child_ids.length > 0) {
		for (j = 0; j < working.child_ids.length; j++) {
			for (k = 0; k < past.length; k++) { //check if children go to a previously visited element
				if (working.child_ids[j] == past[k]) {
					return false; //cyclical
				} else {
					past.push(working.id) //push to visited and move on to children
					return checkMenu(original, original[working.child_ids[j]-1], past);
				}
			}
		}
	} else {
		return true; //dead end
	}

	return false; //error
}

//return ids of children
function getKids(original, working, childrenToDate, past) {
	past.push(working.id);

	if (working.child_ids.length == 0) { //if no children, return self
		childrenToDate.push(working.id);
		return childrenToDate;
	} else if (working.child_ids.length == 1 ) { //if one child
		childrenToDate.push(working.id);

		for (k = 0; k < past.length || past.length == 0; k++) {
			if (working.child_ids == past[k]) {
				return childrenToDate;
			}
		}

		past.push(working.child_ids);
		childrenToDate = childrenToDate.concat(getKids(original, original[working.child_ids-1], [], past));
		return childrenToDate;
	} else { //if many children
		for (j = 0; j < working.child_ids.length; j++) {
			for (k = 0; k < past.length || past.length == 0; k++) {
				if (working.child_ids[j] == past[k]) {
					return childrenToDate;
				}
			}
			
			past.push(working.child_ids[j]);
			var kids = getKids(original, original[working.child_ids[j]-1], [], past);
			childrenToDate = childrenToDate.concat(kids);
		}

		childrenToDate.push(working.id);
		return childrenToDate;
	}
	//return childrenToDate;
}

//turn validated menus into JSON data
function menuReport(validatedMenuArray, data) {
	var valid = validatedMenuArray[0];
	var invalid = validatedMenuArray[1];

	var jsonReport = new Object(); //make JSON object
	jsonReport.valid_menus = [];
	jsonReport.invalid_menus = [];
	
	for (i = 0; i < valid.length; i++) { //valid menus
		jsonReport.valid_menus[i] = [];
		jsonReport.valid_menus[i].root_id = valid[i].id;
		
		var children = getKids(data, data[valid[i].id-1], [], []);
		children.pop(); //to remove last element, the head
		jsonReport.valid_menus[i].children = children;
	}

	for (i = 0; i < invalid.length; i++) { //invalid menus
		jsonReport.invalid_menus[i] = [];
		jsonReport.invalid_menus[i].root_id = invalid[i].id; 

		children = getKids(data, data[invalid[i].id-1], [], []);
		children.shift(); //to remove last element, the head
		jsonReport.invalid_menus[i].children = children;
	}
	
	return jsonReport;
}