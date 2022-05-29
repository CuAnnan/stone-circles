(function($){
    let map, $map;
    let sidebar = false;
    let markers = {};
    let markersOnScreen = {};

    $(function(){
        $map = $('#map');
        navigator.geolocation.getCurrentPosition(
            (pos)=>{
                loadMap(pos.coords);
            },
            (err)=>{
                console.log(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
        $('#doubleArrow').click(()=>{
            sidebar = !sidebar;
            if(sidebar)
            {
                $map.css({'right':"25%"});
            }
            else
            {
                $map.css({'right':"0%"});
            }
        });
    });

    function updateMarkers()
    {
        let newMarkers = {};
        let features = map.querySourceFeatures('sites');

        for(let feature of features)
        {
            let coords = feature.geometry.coordinates;
            let props = feature.properties;

            if(props.cluster)
            {
                continue;
            }

            let id = props.objectid;
            let marker = markers[id];
            if(!marker)
            {
                let el = document.createElement('div');
                el.classList.add('marker');
                let img = document.createElement('img');
                img.src = '/img/cromlech.png';
                el.append(img);

                marker = markers[id] = new maplibregl.Marker({element:el}).setLngLat(coords);

            }

            newMarkers[id] = marker;

            if(!markersOnScreen[id])
            {
                marker.addTo(map);
            }


        }

        for (let id in markersOnScreen) {
            if (!newMarkers[id]) markersOnScreen[id].remove();
        }
        markersOnScreen = newMarkers;
    }

    function loadMap()
    {

        map = new maplibregl.Map({
            container: 'map',
            style:
                'https://api.maptiler.com/maps/streets/style.json?key=lftTsnOYVAyeszjYo2eP',
            center: [-7.503210, 53.44939],
            zoom: 6.5
        });

        let markerHeight = 50, markerRadius = 10, linearOffset = 25;
        let popupOffsets = {
            'top': [0, 0],
            'top-left': [0,0],
            'top-right': [0,0],
            'bottom': [0, -markerHeight],
            'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
            'left': [markerRadius, (markerHeight - markerRadius) * -1],
            'right': [-markerRadius, (markerHeight - markerRadius) * -1]
        };

        map.on('data', function (e) {
            if (e.sourceId !== 'sites' || !e.isSourceLoaded) return;

            map.on('move', updateMarkers);
            map.on('moveend', updateMarkers);
            updateMarkers();
        });

        map.once("load", function(){
            map.addSource('sites', {
                type:'geojson',
                data:'/sites/GeoJSON',
                cluster:true,
                clusterMaxZoom:10,
                clusterRadius:35
            });

            map.addLayer({
                id:'clusters',
                type:'circle',
                source:'sites',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#51bbd6',
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        100,
                        30,
                        750,
                        40
                    ]
                }
            });

            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'sites',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });

            map.addLayer({
                id:'unclustered',
                type:'symbol',
                source:'sites',
                filter: ['!', ['has', 'point_count']],
                'icon-anchor':'bottom',
                'icon-image':'/imgs/cromlech.png'
            });
        });
    }
})(window.jQuery);