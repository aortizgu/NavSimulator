(function() {
    var mapsCreationSettings = {
                selector: 'madrid',
                TILE_SRC: 'images/mapTiles/madrid/{z}/{x}/{y}.png.tile',
                popupMessage: 'This is the center of Madrid, offline custom styled map.',
                currentZoom: 14,
                latLng: [40.2842, -3.7941],
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
        marker =  L.marker(options.latLng).addTo(map)
            .bindPopup(options.popupMessage)
            .openPopup();
    }

    initMap(mapsCreationSettings);
}());
