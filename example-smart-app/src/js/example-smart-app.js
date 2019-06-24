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

function fetchall(smart, name) {
    var val = smart.patient.api.fetchAll({
      type: name
    });
    return val;
}

(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('/!\\ ' + arguments[0].config.type + ' Loading error: ' + arguments[0].error.responseText, arguments);
      //ret.reject();
    }

    function onReady(smart)  {
        
      //Auth against the CM portal
      console.log(smart);
      
      $.post( "https://cors.io/?https://nakker.pythonanywhere.com/", smart.tokenResponse)
        .done(function( data ) {
            $( "#token_validation" ).html( data );
      });
      
      //Get data from CM

      //Get the data from Cerner
      if (smart.hasOwnProperty('patient')) {
        var p = defaults();
        
        var values = {};
        var properties = [  //"Patient", 
                            "AllergyIntolerance",
                            "Appointment",
                            "Binary",
                            "CarePlan",
                            "Condition",
                            "Contract",
                            "Device",
                            "DiagnosticReport",
                            "DocumentReference",
                            "Encounter",
                            "Goal",
                            "Immunization",
                            "MedicationAdministration",
                            "MedicationOrder",
                            "MedicationStatement",
                            "Observation",
                            "Person",
                            "Procedure",
                            "ProcedureRequest",
                            "RelatedPerson",
                            "Schedule",
                            "Slot"];
        
        var patient = smart.patient;
        var pt = patient.read();
        
        $.when(pt).done(function(Patient) {
            console.log("#################### Patient ####################");
            console.log(Patient);
            p.patient = Patient.text.div;
            ret.resolve(p);
        });
        
        properties.forEach(function (obj){
          console.log(obj);
          values[obj] = fetchall(smart, obj);
          $.when(values[obj]).fail(onError);
          $.when(values[obj]).done(function(object) {
            if(object) {
              p.content += "<br/><h2>"+obj+"</h2>";
              console.log("-----------------"+obj+"------------------");
              console.log(object);
              ret.resolve(p);
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
      patient: {value: ''},
      content: {value: ''}
    };
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#patient_data').html(p.patient);
    $('#all_the_data').html(p.content);
    
  };

})(window);
