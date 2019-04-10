(function () {
    $.ajax('M4_L12_S1_ESTACION.kml').done(function(xml) {
        var stations = toGeoJSON.kml(xml);
        stations.features.forEach(element => {
            $('#stations_list').append('<li id="station_' + element.properties.DENOMINACION + '">' + element.properties.DENOMINACION + ' - ' + element.properties.CODIGOESTACION + '</li>');
            console.log(element.properties.DENOMINACION);
        });
    });
}());