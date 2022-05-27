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

                        let marker = new maplibregl.Marker({element:element})
                            .setLngLat([site.longitude, site.latitude])
                            .addTo(map);

                        element.addEventListener('click', ()=>{
                            console.log(marker);
                        });

                    }
                }
            );
        });
    }
})(window.jQuery);