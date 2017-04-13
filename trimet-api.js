
$(function() {
  $("#trainSelected").change(function() {
    // if the option is green then add green line stops..
    var trainRoute = $("#trainSelected").val();
    if(trainRoute === "Green Line to City Ctr") {
      $("#trainStopSelected").empty().append(
        '<option>Choose A Stop</option>' +
        '<option value="13132">Clackamas Town Center</option>' +
        '<option value="13135">Lents/SE Foster Rd</option>' +
        '<option value="8370">Gateway/NE 99th Ave</option>' +
        '<option value="8373">Hollywood/NE 42nd Ave</option>' +
        '<option value="8377">Rose Quarter</option>' +
        '<option value="7601">Union Station/NW 5th & Glisan</option>' +
        '<option value="7646">Pioneer Place/SW 5th Ave</option>' +
        '<option value="7606">PSU South/SW 5th & Jackson</option>'
      );
    } else if (trainRoute === "Green Line to Clackamas") {
      $("#trainStopSelected").empty().append(
        '<option>Choose A Stop</option>' +
        '<option value="10293">PSU South/SW 6th & College</option>' +
        '<option value="7777">Pioneer Courthouse/SW 6th Ave</option>' +
        '<option value="7763">Union Station/NW 6th & Hoyt</option>' +
        '<option value="8340">Rose Quarter</option>' +
        '<option value="8344">Hollywood/NE 42nd Ave</option>' +
        '<option value="8347">Gateway/NE 99th Ave</option>' +
        '<option value="13128">Lents/SE Foster Rd</option>' +
        '<option value="7646">Pioneer Place/SW 5th Ave</option>' +
        '<option value="13132">Clackamas Town Center</option>'
      );
    }
  });

  $("#trainStopSelected").change(function() {
    localStorage.clear();
    $(this).parent('form').submit();

    var trainStop = $('#trainStopSelected').find(":selected").val();

    /**** First Trimet API call (arrivals) ****/
    console.log("Stop ID: " + trainStop);
    $.ajax({
      type: "GET",
      url: "https://developer.trimet.org/ws/v2/arrivals?locIDs=" + trainStop + "&xml=true&appID=3B5160342487A47D436E90CD9",
      dataType: "xml",
      success: processArrivalXML
    });

    function processArrivalXML(xml) {
      var trainRoute = $('#trainSelected').find(":selected").val();
      var trainArray = new Array();
      $(xml).find("arrival").each(function() {
        // Train name (shortSign)
        var shortSign = $(this).attr('shortSign');
        // count to stop at 1
        var count = 0;
        if(shortSign.includes(trainRoute) && count === 0) {
          // Vehicle ID
          var trainId = $(this).attr('vehicleID');
          // Train name (fullSign)
          var fullSign = $(this).attr('fullSign');
          console.log("Fullsign: " + fullSign);
          // Delay
          var scheduledTime = parseInt($(this).attr('scheduled'));
          var estimatedTime = parseInt($(this).attr('estimated'));
          var delay;
          if(scheduledTime > estimatedTime) {
            delay = ((scheduledTime - estimatedTime) / 1000 / 60);
          } else {
            delay = ((estimatedTime - scheduledTime) / 1000 / 60);
          }
          console.log("Delay: " + delay);
          // Arrival Time
          var scheduledDate = new Date(0);
          scheduledDate.setUTCMilliseconds(scheduledTime);
          var arrivalTime = scheduledDate.toLocaleTimeString();
          console.log("arrival time: " + arrivalTime);

          var trainInformation = { fullSign: fullSign, delay: delay, arrival: arrivalTime, trainId: trainId };

          trainArray.push(trainInformation);
        }
        count = 1;
      });
      localStorage.setItem("trainArray", JSON.stringify(trainArray));
    }
  }); /** End of Stop Selected Code **/


  /**** Check url for reports ****/
  var url = location.href;
  if(url.includes("reports")) {
    /**** Second Trimet API Call (vehicles) ****/
    $.ajax({
      type: "GET",
      url: "https://developer.trimet.org/ws/v2/vehicles?xml=true&appID=3B5160342487A47D436E90CD9",
      dataType: "xml",
      success: processVehicleXML
    });

    function processVehicleXML(xml) {
      var trainMetaArray = new Array();
      console.log("processVehicleXML");
      $(xml).find("vehicle").each(function() {
        var vehicleId = $(this).attr("vehicleID");
        if(vehicleId === "107") {
          // Meta data
          var shortSign = $(this).attr("signMessage");
          var fullSign = $(this).attr("signMessageLong");
          var longitude = $(this).attr("longitude");
          var latitude = $(this).attr("latitude");
          var lastLocID = $(this).attr("lastLocID");
          var nextLocID = $(this).attr("nextLocID");

          var trainMeta = { trainId: vehicleId, longitude: longitude, latitude: latitude, lastLocID: lastLocID, nextLocID: nextLocID, shortSign: shortSign, fullSign: fullSign };

          localStorage.setItem("longitude", parseFloat(longitude));
          localStorage.setItem("latitude", parseFloat(latitude));

          trainMetaArray.push(trainMeta);
          console.log(trainMeta);
          localStorage.setItem("trainMetaArray", trainMetaArray);
        }
      });
      // localStorage.setItem("trainMetaArray", JSON.stringify(trainMetaArray));
    }

    var trainArray = JSON.parse(localStorage.getItem("trainArray"));
    console.log(trainArray);
    // var trainMetaArray = JSON.parse(localStorage.getItem("trainMetaArray"));
    // console.log(trainMetaArray); // null
    // alert("train id: " + trainMetaArray[0]["trainId"]);
    // console.log("train long: " + parseFloat(trainMetaArray[0]["longitude"]));

    if(trainArray !== null) {
      $("#trainName").text(trainArray[0]["fullSign"]);
      $("#trainDelay").text(trainArray[0]["delay"]);
      $("#trainArrival").text(trainArray[0]["arrival"]);
    } else {
      $("#trainName").text("Train was null");
      console.log("Error: TrainArray is null");
    }

    /**** Google Map API ****/
    var myCenter = new google.maps.LatLng(localStorage.getItem("latitude"), localStorage.getItem("longitude"));
    console.log(localStorage.getItem("latitude"));
    console.log(localStorage.getItem("longitude"))
    console.log(typeof localStorage.getItem("latitude"));

    function initialize() {
      var mapProp = {
        center:myCenter,
        zoom:14,
        scrollwheel:true,
        draggable:true,
        mapTypeId:google.maps.MapTypeId.ROADMAP
      };
      var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
      var marker = new google.maps.Marker({
        position: myCenter,
      });
      marker.setMap(map);
    }
    google.maps.event.addDomListener(window, 'load', initialize);
  }
  $(".userReports").slideDown();
});
