var MAP = {};
var MARKER = {};
var STATIONS = [];
var VIA = [];
var STRETCH = [];
var POSITION = undefined;
var CENTER_MAP = [40.329693, -3.799016];
var DOWORK_PERIOD = 100;
var SEND_PERIOD = 250;
var SPEED = 0;
var ODO = 0;
var MAX_SEGMENT = 5;
const ESTATE = {
    IDDLE: 'IDDLE',
    GOTOEND: 'GOTOEND',
    GOTONEXT: 'GOTONEXT'
}
var STATE = ESTATE.IDDLE;
var MAP_STATIONS = 'M4_L12_S1_ESTACION.kml';
var MAP_STRETCH = 'M4_L12_S1_TRAMO.kml';
var MAP_OPTIONS = {
    selector: 'madrid',
    TILE_SRC: 'images/mapTiles/madrid/{z}/{x}/{y}.png.tile',
    currentZoom: 13,
    latLng: CENTER_MAP,
    options: {
        minZoom: 12,
        maxZoom: 16
    }
};
var ICON = L.icon({
    iconUrl: 'images/train_icon.png',
    iconSize: [38, 60],
    iconAnchor: [19, 30],
});


/////////////////////////////////////////////
///////////////////UTILS/////////////////////
/////////////////////////////////////////////

function interpolatePosition (lat1, lon1, lat2, lon2, total, elapsed) {
    var k = elapsed/total;
    k = (k > 0) ? k : 0;
    k = (k > 1) ? 1 : k;
    return [lat1 + k * (lat2 - lat1), lon1 + k * (lon2 - lon1)];
};

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="m") { dist = dist * 1.609344 * 1000}
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

/////////////////////////////////////////////
///////////////////FUNCTIONAL//////////////////
/////////////////////////////////////////////
function logResults(json){
    console.log(json);
  }
  

function sendLocation() {
    console.log("sendLocation");
    if(POSITION != undefined){
        var dataxml = $.xmlrpc.document('SetAsm', [101, [POSITION.lat, POSITION.lng, parseInt(POSITION.pm), 1]]);
        var dataxmlstr = new XMLSerializer().serializeToString(dataxml);
        $.ajax({
            url: "http://" + window.location.hostname + ":8001",
            type: "POST",
            crossDomain: true,
            data: dataxmlstr
        });
    }
}

function updateOdometer(){
    odo = parseFloat($("#odometer").val());
    if (!isNaN(odo) && odo >= 0.0){
        var nearestPoint = undefined;
        for (let index = 0; index < VIA.length && nearestPoint == undefined; index++) {
            const point = VIA[index];
            if(point.pm > odo){
                nearestPoint = point;
            }
        }
        if(nearestPoint != undefined){
            POSITION = nearestPoint;
            updatePosition();
        }else{
            alert("Not valid odometer");
        }
    }else{
        alert("Not valid odometer");
    }
}

function updatePosition() {
    MARKER.setLatLng([POSITION.lat, POSITION.lng], {
        draggable: 'true'
      }).bindPopup([POSITION.lat, POSITION.lng]).update();
    $("#lat").val(POSITION.lat);
    $("#lng").val(POSITION.lng);
    $("#odometer").val(Math.round(POSITION.pm*10)/10);
    ODO = POSITION.pm;
    updateStations();
}

function updateStations(){
    lat = POSITION.lat;
    lng = POSITION.lng;
    nearestDist = -1;
    nearestStation = undefined;
    for (const id in STATIONS) {
        if (STATIONS.hasOwnProperty(id)) {
            const station = STATIONS[id];
            dist = distance(lat, lng, station.lat, station.lng, "m");
            if(nearestDist < 0 || nearestDist > dist){
                nearestDist = dist;
                nearestStation = station;
            }
            $('#dist_' + station.id).text(Math.round(dist*10)/10 + ' m');            
        }
    }
    for (const id in STATIONS) {
        if (STATIONS.hasOwnProperty(id)) {
            const station = STATIONS[id];
            if(nearestStation != station){
                $('#station_' + station.id).css("color", "black");
            }else{
                $('#station_' + station.id).css("color", "red");
            }            
        }
    }
}

function onMarkerMoved(event) {
    var position = MARKER.getLatLng();
    nearestPoint = undefined;
    nearestDist = 0.0;
    for (let index = 0; index < VIA.length; index++) {
        const point = VIA[index];
        dist = distance(position.lat, position.lng, point.lat, point.lng, "m");
        if(nearestPoint == undefined || dist < nearestDist){
            nearestDist = dist;
            nearestPoint = point;
        }
    }
    POSITION = nearestPoint;
    updatePosition();
}

function moveToNextPosition() {
    var ret = false;
    do{
        if(VIA.length > POSITION.index + 1){
            POSITION = VIA[POSITION.index + 1];
            ret = true;
        }
    }while(ret && ODO > POSITION.pm && !POSITION.isStation);
    return ret;
}

function doWork() {
    switch(STATE){
        case ESTATE.IDDLE:
        break;
        case ESTATE.GOTOEND:
        if(SPEED > 0){
            ODO += SPEED/(1000/DOWORK_PERIOD);
            $("#odometer").val(Math.round(ODO*10)/10);
            var needsToMove = ODO > VIA[POSITION.index + 1].pm;
            if(needsToMove){
                if(moveToNextPosition()){
                    updatePosition();
                }else{
                    STATE = ESTATE.IDDLE;
                    alert("Reached end of route");
                }
            }
        }
        break;
        case ESTATE.GOTONEXT:
        if(SPEED > 0){
            ODO += SPEED/(1000/DOWORK_PERIOD);
            $("#odometer").val(Math.round(ODO*10)/10);
            var needsToMove =  ODO > VIA[POSITION.index + 1].pm;
            if(needsToMove){
                if(moveToNextPosition()){
                    updatePosition();
                    if(POSITION.isStation){
                        STATE = ESTATE.IDDLE;
                    }
                }else{
                    STATE = ESTATE.IDDLE;
                    alert("Reached end of route");
                }
            }
        }
        break;
    }
}

/////////////////////////////////////////////
///////////////////INIT/////////////////////
/////////////////////////////////////////////

function initStations(){
    $.ajax(MAP_STATIONS).done(function(xml) {
        var stationsRaw = toGeoJSON.kml(xml);
        for (let index = 0; index < stationsRaw.features.length; index++) {
            const element = stationsRaw.features[index];
            STATIONS[element.properties.CODIGOESTACION] = {
                id: element.properties.CODIGOESTACION,
                name: element.properties.DENOMINACION,
                dist: 0,
                lat: element.geometry.coordinates[1],
                lng: element.geometry.coordinates[0],
                nearest: false
            };
        }
        STATIONS.sort();
        STATIONS.reverse();
        STATIONS.forEach(station => {
            $('#stations_list').append('<li id="station_' + station.id + '">' + station.id + ' - ' + station.name + ' - <span id="dist_' + station.id + '"></span></li>');
        });
    });
}

function initMap() {
    MAP = L.map(MAP_OPTIONS.selector).setView(MAP_OPTIONS.latLng, MAP_OPTIONS.currentZoom);
    L.tileLayer(MAP_OPTIONS.TILE_SRC, MAP_OPTIONS.options).addTo(MAP);
    //omnivore.kml(MAP_STATIONS).addTo(MAP);
    omnivore.kml(MAP_STRETCH).addTo(MAP);
}

function initVia() {
    $.ajax(MAP_STRETCH).done(function(xml) {
        viaRaw = toGeoJSON.kml(xml);
        for (let index = 0; index < viaRaw.features.length; index++) {
            const viaBeetwen = viaRaw.features[index];
            STRETCH[viaBeetwen.properties.CODIGOESTACION] = viaBeetwen;
        }
        STRETCH.sort();
        STRETCH.reverse();

        viaTmp = [];
        lastPm = 0.0;
        lastPoint = undefined;
        lastId = 0;
        countMeters = 0.0;

        for (const id in STRETCH) {
            if (STRETCH.hasOwnProperty(id)) {
                const stretch = STRETCH[id];
                for (let index2 = 0; index2 < stretch.geometry.coordinates.length; index2++) {
                    const pointRaw = stretch.geometry.coordinates[index2];
                    point = {
                        lat: pointRaw[1],
                        lng: pointRaw[0],
                        pm: 0.0,
                        isStation: false,
                        index: viaTmp.length
                    }
                    if(lastPoint != undefined){
                        lastPm += distance(lastPoint.lat, lastPoint.lng, point.lat, point.lng, "m");
                        point.pm = lastPm;
                    }
                    viaTmp.push(point);
                    lastPoint = point;
                    if(POSITION == undefined){
                        POSITION = point;
                    }
                }
                countMeters += parseFloat(stretch.properties.LONGITUDTRAMOANTERIOR);
                console.log("station: " + stretch.properties.DENOMINACION + ", countMeters: " + Math.round(countMeters*10)/10 + ", lastPm: " + Math.round(lastPm*10)/10);
                lastPm = countMeters;    
                lastId = stretch.properties.CODIGOESTACION;     
            }
            L.marker([lastPoint.lat, lastPoint.lng]).addTo(MAP);
            lastPoint.isStation = true;
            STATIONS[lastId].lat = lastPoint.lat;
            STATIONS[lastId].lng = lastPoint.lng;
        }

        //interpolate points
        for (let index = 0; index < viaTmp.length; index++) {
            const thisPoint = viaTmp[index];
            var interpolations = [];
            interpolations.push(thisPoint);
            
            if(viaTmp.length > index + 1){
                const nextPoint = viaTmp[index+1];
                distToNext = viaTmp[index + 1].pm - thisPoint.pm;
                interpolationsNum = Math.trunc(distToNext/MAX_SEGMENT);
                if(interpolationsNum > 0){
                    for (let i = 0; i < interpolationsNum; i++) {
                        relativeDist = MAX_SEGMENT + MAX_SEGMENT*i;
                        latLng = interpolatePosition(thisPoint.lat, thisPoint.lng, nextPoint.lat, nextPoint.lng, distToNext, relativeDist);
                        point = {
                            lat: latLng[0],
                            lng: latLng[1],
                            pm: thisPoint.pm + relativeDist,
                            isStation: false
                        }
                        interpolations.push(point);
                    }
                }
            }

            for (let index2 = 0; index2 < interpolations.length; index2++) {
                const interpolation = interpolations[index2];
                interpolation.index = VIA.length;
                VIA.push(interpolation);
            }
        }

        initMarker();
        updatePosition();
    });
}

function initMarker() {
    MARKER = L.marker([POSITION.lat, POSITION.lng], {icon: ICON, draggable: true}).addTo(MAP);
    MARKER.on('dragend', onMarkerMoved);
}

/////////////////////////////////////////////
///////////////////ON READY//////////////////
/////////////////////////////////////////////

$('document').ready(function() {
    initMap();
    initStations();
    initVia();
    $('#go-to-end').click(function(){
        STATE = ESTATE.GOTOEND;
    });
    $('#go-to-next').click(function(){
        STATE = ESTATE.GOTONEXT;
    });
    $('#stop').click(function(){
        STATE = ESTATE.IDDLE;
    });
    $('#speed').change(function(){
        SPEED = parseInt($('#speed').val());
        $('#speed-kmh').val(Math.trunc(SPEED*3.6));
    });
    $('#odometer').change(function(){
        updateOdometer();
    });
    setInterval(doWork, DOWORK_PERIOD);
    setInterval(sendLocation, SEND_PERIOD);
}());
