(function($){
    let map;
    $(function(){
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
    });

    function getMapBBox()
    {
        let bounds = map.getBounds();
        let northEast = bounds.getNorthEast();
        let southWest = bounds.getSouthWest();
        return {
            lats:[northEast.lat, southWest.lat],
            lngs:[northEast.lng, southWest.lng]
        };
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

        map.once("load", function(){
            $.post(
                '/sites/fetch',
                {bounds:JSON.stringify(getMapBBox())},
                function(data)
                {
                    for(let site of data.sites)
                    {
                        let element = document.createElement('div');
                        element.classList.add('marker');

                        let imgElement= document.createElement('img');
                        imgElement.src='img/icon.png';
                        element.append(imgElement);

                        let townlandName = site.townland_name.toLowerCase();
                        townlandName = townlandName.replace(/\b[a-z]/g, function(letter) {
                            return letter.toUpperCase();
                        });

                        let marker = new maplibregl.Marker({element:element})
                            .setLngLat([site.longitude, site.latitude])
                            .setPopup(new maplibregl.Popup().setHTML(`<table><tr><th>Type:</th><td>${site.classdesc}</td></tr><tr><th>Townland:</th><td>${townlandName}</td></tr><tr><th>SMRS:</th><td>${site.smrs}</td></tr></table>`))
                            .addTo(map);
                    }
                }
            );
        });
    }
})(window.jQuery);