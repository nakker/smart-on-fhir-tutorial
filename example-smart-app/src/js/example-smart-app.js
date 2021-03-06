function synthesize_coded_objects(objs) {
	//Parse out condition descriptions
	obj_string = "";
	if (!Array.isArray(objs)){
	objs = [objs];
	}
	var condition_string = "";
	objs.forEach(function (obj){
	  console.log(obj);
	  obj_string += obj.code.coding[0].display + "<br/>";
	});
	return obj_string;
}

function fetchall(smart, name, query) {
	var val = smart.patient.api.fetchAll({
	  type: name,
	  query: query
	});
	return val;
}


(function(window){
  window.extractData = function() {
	var ret = $.Deferred();
	
	
	function is_resolved(props_loaded, properties, p, ret) {
		if(p.patient && props_loaded == properties.length) {
			ret.resolve(p);
		} else {
			var mylog = "Loaded " + props_loaded + " of " + properties.length + " elements";
			console.log(mylog);
			$("#loading").children("h2").html(mylog);
		}
	}
	
	function onError(arguments) {
		if(arguments[0]) {
			console.log('/!\\ ' + arguments[0].config.type + ' Loading error: ' + arguments[0].error.responseText, arguments);
		} else {
			console.log('/!\\ Loading error: ', arguments);
		}
	  //ret.reject();
	}

	function onReady(smart)  {
		
	  //Auth against the CM portal
	  console.log("----------------TOKEN FOLLOWS-------------");
	  console.log(smart);
	  console.log("------------------------------------------");
	  $.post( "https://cors-anywhere.herokuapp.com/nakker.pythonanywhere.com/", smart.tokenResponse)
		.done(function( data ) {
			$( "#token_validation" ).html(data);
		}).fail(function(xhr, status, error) {
			$( "#token_validation" ).html(xhr + "<br/>" + status + "<br/>" +error);
		}); 
	  
	  //Get data from CM

	  //Get the data from Cerner
	  if (smart.hasOwnProperty('patient')) {
		var p = defaults();
		var patient = smart.patient;
		var pt = patient.read();
		var props_loaded = 0;
		var values = {};
		var now = new Date(); 
		//var dd = String(now.getDate()).padStart(2, '0');
		var mm = String(now.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = now.getFullYear() -1;

		console.log(pt, patient);

		var properties = [  //["Patient", 
							["AllergyIntolerance", {} ],
							["Appointment", { date: yyyy + '-' + mm }],
							//["Binary", {}],
							["CarePlan", { category: "careteam",	 date: "ge" + yyyy + '-' + mm}],
							["CarePlan", { category: "assess-plan",  date: "ge" + yyyy + '-' + mm}],
							["CarePlan", { category: "longitudinal", date: "ge" + yyyy + '-' + mm}],
							//["CarePlan", { category: "encounter", context: "SET THE ENCOUNTER ID"}],
							["Condition", {}],
							//["Contract", {}],
							["Device", {}],
							["DiagnosticReport", {}],
							//["DocumentReference", {}],
							["Encounter", {}],
							["Goal", {}],
							["Immunization", {}],
							["MedicationAdministration", {}],
							["MedicationOrder", {}],
							["MedicationStatement", {}],
							["Observation", {}],
							//["Person", {}],
							["Procedure", {}],
							["ProcedureRequest", {}],
							["RelatedPerson", {}],
							//["Schedule", {}],
							//["Slot", {}] 
							];
		

		
		$.when(pt).done(function(Patient) {
			console.log("#################### Patient ####################");
			console.log(Patient);
			p.patient = Patient.text.div;
			
			//Load all of the patient dependent items
			properties.forEach(function (myarray_o_shit){
				
				var obj_name = myarray_o_shit[0];
				var query	= myarray_o_shit[1];
				query.patient = Patient.id;
				
				values[obj_name] = fetchall(smart, obj_name, query);
				
				$.when(values[obj_name]).fail(function() {
					onError(arguments);
					props_loaded += 1;
					is_resolved(props_loaded, properties, p, ret);
				});
				
				$.when(values[obj_name]).done(function(object) {
					if(object) {
						console.log("-----------------"+obj_name+"------------------");
						console.log(object);
						
						p.content += "<h2>"+obj_name+"</h2><div class='indented bordered'>";
						object.forEach(function (o){
							if(o && o.text) {
								p.content +=  "<div class='subsection'>" + o.text.div + "</div>";
							}
						});
						p.content += "</div>";
						props_loaded += 1;
						is_resolved(props_loaded, properties, p, ret);
					}
				});
			});
		});
		
	  } else {
		onError();
	  }
	}

	FHIR.oauth2.ready(onReady, onError);
	return ret.promise();

  };

  function defaults(){
	return {
	  patient: "",
	  content: ""
	};
  }

  window.drawVisualization = function(p) {
	$('#holder').show();
	$('#loading').hide();
	$('#patient_data').html(p.patient);
	$('#all_the_data').html(p.content);
	
  };

})(window);
