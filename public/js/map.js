(function($){
    let map, $map;
    let sidebar = false;
    let markers = {};
    let markersOnScreen = {};
    let counties =[], $counties;
    let siteTypes = [], $siteTypes;
    let filters;

    let iconMap = {
        'Stone circle':'cromlech',
        'Stone circle - embanked':'cromlech',
        'Stone circle - five-stone':'cromlech',
        'Stone circle - multiple-stone':'cromlech',
        'Ringfort - rath':'rath',
        'Ringfort - cashel':'rath',
        'Ringfort - unclassified':'rath',
        'Megalithic structure':'megalith',
        'Megalithic tomb':'megalith',
        'Standing stone':'standing stone',
        'Stone row':'stone row',
        'Cairn':'cairn'
    };

    $(function(){
        $map = $('#map');
        $('#doFilter').click(applyFilter);
        // Form elements do not reset on a refresh.
        // This allows us to save the state of the search.
        assignFilters();


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

    function assignFilters()
    {
        filters = {
            counties:$('#counties').val(),
            types:$('#siteTypes').val()
        };
    }

    function applyFilter()
    {
        assignFilters();
        updateSites();
    }

    function createTextRow(heading, text)
    {

        let tr= document.createElement('tr');
        let th =document.createElement('th');
        th.append(document.createTextNode(heading));
        tr.append(th);
        let td = document.createElement('td');
        td.append(document.createTextNode(text));
        tr.append(td);
        return tr;
    }

    function createTable(props)
    {
        let townland = props.townland_name.toLowerCase().replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        });
        let county = props.county.toLowerCase().replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        });

        let tableElement = document.createElement('table');
        tableElement.classList.add('popup-table');
        tableElement.append(createTextRow('County:', county));
        tableElement.append(createTextRow('Townland:', townland));
        tableElement.append(createTextRow('Type:', props.classdesc));
        tableElement.append(createTextRow('SMRS:', props.smrs));

        let linkTr = document.createElement('tr');
        let linkTd = document.createElement('td');
        linkTd.colSpan=2;
        linkTr.append(linkTd);
        let linkA = document.createElement('a');
        linkA.href=`http://maps.apple.com?ll=${props.latitude},${props.longitude}&q=${townland} ${props.classdesc}`;
        linkA.append(document.createTextNode('Get Directions'));
        linkTd.append(linkA);
        tableElement.append(linkTr);

        let markTr = document.createElement('tr');
        let markTd = document.createElement('td');
        markTd.colspan=2;
        markTr.append(markTd);
        let markLink = document.createElement('a');
        markLink.href='#';
        markLink.append(document.createTextNode('Favourite'));
        markLink.addEventListener('click',()=>{
            let elem = document.getElementById(`image-${props.objectid}`);
            let filename = elem.src.split('/').pop().split('.').shift();
            let newFilename;
            if(filename.endsWith('-red'))
            {
                newFilename=filename.replace('-red','');
                markLink.innerText = 'Unfavourite';
            }
            else
            {
                newFilename = `${filename}-red`
                markLink.innerText = 'Unfavourite';
            }
            elem.src=`/img/${newFilename}.png`;

        });
        markTd.append(markLink);
        tableElement.append(markTr);

        return tableElement;
    }

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
                img.id = `image-${id}`;
                if(iconMap[props.classdesc])
                {
                    img.src = `/img/${iconMap[props.classdesc]}.png`;
                }
                else
                {
                    img.src='/img/monument.png';
                }

                el.append(img);

                marker = markers[id] = new maplibregl.Marker({element:el})
                    .setLngLat(coords);

                let popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(createTable(props, marker));
                //     `<table class="popup-table">
                //         <tr><td colspan="2"><a href="http://maps.apple.com?ll=${props.latitude},${props.longitude}&q=${townland} ${props.classdesc}">Navigate here</a></td></tr>
                //         <tr><td colspan="2"><div>Flag as interesting</div></td></tr>
                //     </table>`
                // );

                marker.setPopup(popup);

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

        map.once("load", ()=>{updateSites();});
    }

    function updateSites()
    {
        if(map.getSource('sites')) {
            map.removeLayer('clusters');
            map.removeLayer('cluster-count');
            map.removeLayer('unclustered');
            map.removeSource('sites');
        }


        $.ajax({
            type:"POST",
            url:'/sites/GeoJSON',
            data:filters,
            dataType:"json"})
        .done(function(data){
            map.addSource('sites', {
                type:'geojson',
                data:data,
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
                    'circle-color': '#66C547',
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