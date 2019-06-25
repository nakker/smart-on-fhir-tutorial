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
    
    function onError() {
      console.log('/!\\ ' + arguments[0].config.type + ' Loading error: ' + arguments[0].error.responseText, arguments);
      //ret.reject();
    }

    function onReady(smart)  {
        
      //Auth against the CM portal
      console.log(smart);
      
      $.post( "https://cors.io/?https://nakker.pythonanywhere.com/", smart.tokenResponse)
        .done(function( data ) {
            $( "#token_validation" ).html(data);
      });
      
      //Get data from CM

      //Get the data from Cerner
      if (smart.hasOwnProperty('patient')) {
        var p = defaults();
        
        var values = {};
        var properties = [  //["Patient", 
                            ["AllergyIntolerance", null ],
                            ["Appointment", { code: { $or: ['accepted','proposed', 'booked'] }}],
                            ["Binary", null],
                            ["CarePlan", null],
                            ["Condition", null],
                            ["Contract", null],
                            ["Device", null],
                            ["DiagnosticReport", null],
                            //["DocumentReference", null],
                            ["Encounter", null],
                            ["Goal", null],
                            ["Immunization", null],
                            ["MedicationAdministration", null],
                            ["MedicationOrder", null],
                            ["MedicationStatement", null],
                            ["Observation", null],
                            ["Person", null],
                            ["Procedure", null],
                            ["ProcedureRequest", null],
                            ["RelatedPerson", null],
                            ["Schedule", null],
                            ["Slot", null]]; 
        
        var patient = smart.patient;
        var pt = patient.read();
        var props_loaded = 0;
        
        $.when(pt).done(function(Patient) {
            console.log("#################### Patient ####################");
            console.log(Patient);
            p.patient = Patient.text.div;
            is_resolved(props_loaded, properties, p, ret);
        });
        
        
        properties.forEach(function (myarray_o_shit){
            
            var obj_name = myarray_o_shit[0];
            var query    = myarray_o_shit[1];
            
            values[obj_name] = fetchall(smart, obj_name, query);
            
            $.when(values[obj_name]).fail(function() {
                console.log('/!\\ ' + arguments[0].config.type + ' Loading error: ' + arguments[0].error.responseText, arguments);
                props_loaded += 1;
                is_resolved(props_loaded, properties, p, ret);
            });
            
            $.when(values[obj_name]).done(function(object) {
                if(object) {
                    console.log("-----------------"+obj_name+"------------------");
                    console.log(object);
                    
                    p.content += "<h2>"+obj_name+"</h2><div>";
                    object.forEach(function (o){
                        p.content +=  o.text.div;
                    });
                    p.content += "</div>";
                    props_loaded += 1;
                    is_resolved(props_loaded, properties, p, ret);
                }
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
