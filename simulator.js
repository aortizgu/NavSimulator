(function() {
    //include sample data
    var _pathData = [
        {latitude: 42.347856, longitude: -71.073668},
        {latitude: 42.347872, longitude: -71.068561, pause: 5000},
        {latitude: 42.347555, longitude: -71.065986},
        {latitude: 42.346349, longitude: -71.060793},
        {latitude: 42.346445, longitude: -71.058433},
        {latitude: 42.348062, longitude: -71.057832},
        {latitude: 42.348697, longitude: -71.058648},
        {latitude: 42.348094, longitude: -71.060128},
        {latitude: 42.344716, longitude: -71.061416, pause: 15000},
        {latitude: 42.340529, longitude: -71.063561},
        {latitude: 42.336928, longitude: -71.065321},
        {latitude: 42.335469, longitude: -71.065578},
        {latitude: 42.332630, longitude: -71.063433},
        {latitude: 42.329473, longitude: -71.060450},
        {latitude: 42.323794, longitude: -71.055214},
        {latitude: 42.321398, longitude: -71.054099},
        {latitude: 42.321366, longitude: -71.051245},
        {latitude: 42.316876, longitude: -71.048884}
    ];

    //the geolocation simulator
    var _simulator;
    
    //some stuff to monitor position
    var _timer,
        _timerInterval = 1000, //play with these to see more infrequent results (>= 1000)
        _update = 0;

    function init() {
        // to see the results visually
        //makeMap();

        //create the simulator, pass pathData array as parameter
        _simulator = GeolocationSimulator({coords: _pathData, speed: 200});

        //start it up (begin moving)
        _simulator.start();

        //start accessing the geolocation data, as you would
        getPosition();
    }

    //tap into the geolocation api
    function getPosition() {
        //if geolocation is available, proceed
        if ('geolocation' in navigator) {
            var options = {
                enableHighAccuracy: true,
                timeout: Infinity,
                maximumAge: 0
            };
            //get location
            navigator.geolocation.getCurrentPosition(newPosition, geoError, options);

            //lets keep getting it to see where this fella goes
            _timer = setTimeout(getPosition, _timerInterval);

        } else {
            alert.log('what browser are you using??');
        }
    }

    //handle the geolocation response obj
    function newPosition(data) {
        _update++;
        $('.output').empty();
        
        output('update ' + _update);

        var coords = data.coords;

        output('lat: ' + coords.latitude.toFixed(7));
        output('lon: ' + coords.longitude.toFixed(7));

        if(map) {
            var newLatLng = new google.maps.LatLng(coords.latitude, coords.longitude);
            map.panTo(newLatLng);    
            marker.setCenter(newLatLng);
        }
    }

    //handle geolocation errors (there won't be any!)
    function geoError(error) {
        console.log(error);
    }

    //put some text on screen
    function output(str) {
        var p = $('<p>' + str + '</p>')
        $('.output').append(p);
    }

/*    function makeMap() {
        var coords = new google.maps.LatLng(_pathData[0].latitude, _pathData[0].longitude);
        
        var myOptions = {
            zoom: 15,
            center: coords,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
        };

        map = new google.maps.Map(document.getElementById('map'), myOptions);

        var opts = {
            strokeColor: '#FF0000',
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: '#FF0000',
            fillOpacity: 0.5,
            map: map,
            center: coords,
            radius: 40
        };
        // Add the circle for this city to the map.
        marker = new google.maps.Circle(opts);
    }
      */

    //boot it up
    init();
})();