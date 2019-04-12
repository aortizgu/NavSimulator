var MAP = {};
var MARKER = {};
var STATIONS = [];
var VIA = [];
var STRETCH = [];
var POSITION = {};

/////////////////////////////////////////////
///////////////////UTILS/////////////////////
/////////////////////////////////////////////

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

function updateOdometer(){
    odo = parseFloat($("#odometer").val());
    if (!isNaN(odo) && odo >= 0.0){
        nearestDist = 99999999;
        for (let index = 0; index < VIA.length; index++) {
            const point = VIA[index];
            dist = Math.abs(odo - point.pm);
            if(nearestPoint == undefined || dist < nearestDist){
                nearestDist = dist;
                nearestPoint = point;
            }
        }
        $("#lat").val(nearestPoint.lat);
        $("#lng").val(nearestPoint.lng);
        $("#odometer").val(Math.round(nearestPoint.pm*10)/10);
        MARKER.setCenter(nearestPoint);
        updatePosition();
        updateStations();
    }else{
        alert("Not valid odometer");
    }
}

function updatePosition() {
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
    $("#lat").val(nearestPoint.lat);
    $("#lng").val(nearestPoint.lng);
    $("#odometer").val(Math.round(nearestPoint.pm*10)/10);
}

function updateStations(){
    lat = MARKER.getLatLng().lat;
    lng = MARKER.getLatLng().lng;
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
    position.lat = nearestPoint.lat;
    position.lng = nearestPoint.lng;
    MARKER.setLatLng(position, {
      draggable: 'true'
    }).bindPopup(position).update();
    updatePosition();
    updateStations();
}

/////////////////////////////////////////////
///////////////////INIT/////////////////////
/////////////////////////////////////////////

function initStations(){
    $.ajax('M4_L12_S1_ESTACION.kml').done(function(xml) {
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
        updateStations()
    });
}

function initMap() {

    var options = {
        selector: 'madrid',
        TILE_SRC: 'images/mapTiles/madrid/{z}/{x}/{y}.png.tile',
        currentZoom: 14,
        latLng: [40.282675775140497, -3.798906900782018],
        options: {
            minZoom: 12,
            maxZoom: 16
        }
    };

    var train = L.icon({
        iconUrl: 'images/train_icon.png',
        iconSize: [38, 60],
        iconAnchor: [19, 30],
    });
    
    MAP = L.map(options.selector).setView(options.latLng, options.currentZoom);
    L.tileLayer(options.TILE_SRC, options.options).addTo(MAP);
    MARKER = L.marker(options.latLng, {icon: train, draggable: true}).addTo(MAP);
    MARKER.on('dragend', onMarkerMoved);
    omnivore.kml('M4_L12_S1_ESTACION.kml').addTo(MAP);
    omnivore.kml('M4_L12_S1_TRAMO.kml').addTo(MAP);
}

function initVia() {
    $.ajax('M4_L12_S1_TRAMO.kml').done(function(xml) {
        viaRaw = toGeoJSON.kml(xml);
        for (let index = 0; index < viaRaw.features.length; index++) {
            const viaBeetwen = viaRaw.features[index];
            STRETCH[viaBeetwen.properties.CODIGOESTACION] = viaBeetwen;
        }
        STRETCH.sort();
        STRETCH.reverse();

        lastPm = 0.0;
        lastPoint = undefined;
        countMeters = 0.0;
        for (const id in STRETCH) {
            if (STRETCH.hasOwnProperty(id)) {
                const stretch = STRETCH[id];
                for (let index2 = 0; index2 < stretch.geometry.coordinates.length; index2++) {
                    const pointRaw = stretch.geometry.coordinates[index2];
                    point = {
                        lat: pointRaw[1],
                        lng: pointRaw[0],
                        pm: 0.0
                    }
                    if(lastPoint != undefined){
                        lastPm += distance(lastPoint.lat, lastPoint.lng, point.lat, point.lng, "m");
                        point.pm = lastPm;
                    }
                    VIA.push(point);
                    lastPoint = point;
                }
                countMeters += parseFloat(stretch.properties.LONGITUDTRAMOANTERIOR);
                console.log("station: " + stretch.properties.DENOMINACION + ", countMeters: " + Math.round(countMeters*10)/10 + ", lastPm: " + Math.round(lastPm*10)/10);
                lastPm = countMeters;                
            }
        }
        updatePosition();
    });
}

function initVars(){

}

/////////////////////////////////////////////
///////////////////ON READY//////////////////
/////////////////////////////////////////////

$('document').ready(function() {
    initMap();
    initStations();
    initVia();
    $('#odometer').change(function(){
        updateOdometer();
    });
}());
