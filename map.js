(function () {
    var train = L.icon({
        iconUrl: 'images/train_icon.png',
        iconSize: [38, 60],
        iconAnchor: [19, 30],
    });

    var mapsCreationSettings = {
        selector: 'madrid',
        TILE_SRC: 'images/mapTiles/madrid/{z}/{x}/{y}.png.tile',
        currentZoom: 14,
        latLng: [40.282675775140497, -3.798906900782018],
        options: {
            minZoom: 12,
            maxZoom: 16
        }
    };
    var map = {};
    var marker = {};

    function initMap(options) {
        map = L.map(options.selector).setView(options.latLng, options.currentZoom);
        L.tileLayer(options.TILE_SRC, options.options).addTo(map);
        marker = L.marker(options.latLng, {icon: train}).addTo(map);
        omnivore.kml('M4_L12_S1_ESTACION.kml').addTo(map);
        omnivore.kml('M4_L12_S1_TRAMO.kml').addTo(map);
    }

    initMap(mapsCreationSettings);
}());
