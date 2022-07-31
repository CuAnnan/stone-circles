(function($){
    let map, $map;
    let sidebar = false;
    let markers = {};
    let markersOnScreen = {};
    let filters;
    let $modal;
    let siteTypes;

    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = …" if you're not in a function.
    // Moreover, you may need references to some window.IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    let db;

    let iconMap = {
        'Stone circle':'cromlech',
        'Stone circle - embanked':'cromlech',
        'Stone circle - five-stone':'cromlech',
        'Stone circle - multiple-stone':'cromlech',
        'Ceremonial enclosure':'cromlech',
        'Castle - motte and bailey':'motte',
        'Castle - motte':'motte',
        'Ringfort - rath':'rath',
        'Ringfort - cashel':'rath',
        'Ringfort - unclassified':'rath',
        'Megalithic structure':'megalith',
        'Megalithic tomb':'megalith',
        'Standing stone':'standing stone',
        'Stone row':'stone row',
        'Cairn':'cairn'
    };
    let favourites;

    $(function(){
        $map = $('#map');
        $('#doFilter').click(applyFilter);
        $modal = $('#loadingModal').modal({show:true, keyboard:false, backdrop:'static'}).modal('show');

        // Form elements do not reset on a refresh.
        // This allows us to save the state of the search.
        assignFilters();
        let storedFaves = localStorage.getItem('favourites');
        if(storedFaves) {
            favourites = JSON.parse(atob(storedFaves));
        }
        else
        {
            favourites = [];
        }

        const request = indexedDB.open("clochaDB", 1);
        request.onerror = (evt)=>{
            console.warn(evt);
        }
        request.onsuccess = (evt)=>{
            db = evt.target.result;
            loadSites()
                .then((data)=>{
                    loadMap(data);
                })
                .catch((error)=>{
                    console.warn(error);
                });

        };
        request.onupgradeneeded = (evt)=>{
            const db = evt.target.result;
            // the smrs for the site is unique. It will do as a keypath
            const objectStore = db.createObjectStore("sites", {keyPath:'smrs'});
            objectStore.createIndex('county', 'county', {unique:false});
            objectStore.createIndex('type', 'type', {unique:false});
        }



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
        filterSites();
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

        let smrsLinkTR = document.createElement('tr');
        tableElement.append(smrsLinkTR);
        let smrsLinkTH = document.createElement('th');
        smrsLinkTH.append(document.createTextNode('SMRS'));
        smrsLinkTR.append(smrsLinkTH);
        let smrsLinkTD = document.createElement('td');
        smrsLinkTR.append(smrsLinkTD);
        let smrsLinkA = document.createElement('a');
        smrsLinkA.href = `https://maps.archaeology.ie/HistoricEnvironment/?SMRS=${props.smrs}`;
        smrsLinkA.append(document.createTextNode(props.smrs));
        smrsLinkA.target = '_BLANK';
        smrsLinkTD.append(smrsLinkA);

        let linkTr = document.createElement('tr');
        let linkTd = document.createElement('td');
        linkTd.colSpan=2;
        linkTr.append(linkTd);
        let linkA = document.createElement('a');
        linkA.href=`http://maps.apple.com?ll=${props.latitude},${props.longitude}&q=${townland} ${props.classdesc}`;
        linkA.target='_BLANK';
        linkA.append(document.createTextNode('Get Directions'));
        linkTd.append(linkA);
        tableElement.append(linkTr);

        let markTr = document.createElement('tr');
        let markTd = document.createElement('td');
        markTd.colspan=2;
        markTr.append(markTd);
        let markLink = document.createElement('a');
        markLink.href='#';
        markLink.append(document.createTextNode(favourites.indexOf(props.smrs)>=0?'Unfavourite':'Favourite'));
        markLink.addEventListener('click',()=>{
            let elem = document.getElementById(`image-${props.smrs}`);
            let filename = elem.src.split('/').pop().split('.').shift();
            let newFilename;

            if(filename.endsWith('-red'))
            {
                newFilename=filename.replace('-red','');
                markLink.innerText = 'Favourite';
                favourites.splice(favourites.indexOf(props.smrs), 1);
            }
            else
            {
                newFilename = `${filename}-red`
                markLink.innerText = 'Unfavourite';
                favourites.push(props.smrs);
            }
            elem.src=`/img/${newFilename}.png`;
            localStorage.setItem('favourites', btoa(JSON.stringify(favourites)));

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

            let id = props.smrs;
            let marker = markers[id];
            if(!marker)
            {
                let el = document.createElement('div');
                el.classList.add('marker');

                let favourite = favourites.indexOf(props.smrs)>=0;

                let img = document.createElement('img');
                img.id = `image-${id}`;
                if(iconMap[props.classdesc])
                {
                    img.src = `/img/${iconMap[props.classdesc]}${favourite?'-red':''}.png`;
                }
                else
                {
                    img.src=`/img/monument${favourite?'-red':''}.png`;
                }

                el.append(img);

                marker = markers[id] = new maplibregl.Marker({element:el})
                    .setLngLat(coords);

                let popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(createTable(props, marker));

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

    function loadMap(data)
    {

        map = new maplibregl.Map({
            container: 'map',
            style:
                'https://api.maptiler.com/maps/streets/style.json?key=lftTsnOYVAyeszjYo2eP',
            center: [-7.503210, 53.44939],
            zoom: 6.5
        });

        let image = document.createElement('img');
        image.src = 'img/compass.png';

        let locationMarker = new maplibregl.Marker({
            element:image,
            rotationAlignment:'map',
        });

        let geolocate = new maplibregl.GeolocateControl({
            positionOptions: {enableHighAccuracy: true},
            showUserLocation:false,
            trackUserLocation: true
        });
        geolocate.customMarker = locationMarker;
        geolocate.needsAdding = true;
        map.addControl(geolocate);
        geolocate.on('geolocate', function(data){;
            this.customMarker.setLngLat([data.coords.longitude, data.coords.latitude]);
            let heading = data.coords.heading;
            if(heading !== null)
            {
                this.customMarker.setRotation(heading);
            }
            if(this.needsAdding)
            {
                this.customMarker.addTo(map);
                this.needsAdding = false;
            }
        });

        map.on('data', function (e) {
            if (e.sourceId !== 'sites' || !e.isSourceLoaded) return;
            console.info('Updating sites');
            map.on('move', updateMarkers);
            map.on('moveend', updateMarkers);
            updateMarkers();
        });

        map.once("load", ()=>{
            updateSites(data);
            geolocate.trigger();
        });
    }

    async function loadSites() {
        return new Promise((resolve, reject)=>
        {
            // check the last remote load
            let lastRemoteLoadDate = localStorage.getItem('lastRemoteLoad');

            // get all the sites since the last remote load
            $.ajax({
                type: 'get',
                url: '/sites/geoJSONByDate',
                data: {lastUpdated: lastRemoteLoadDate},
                dataType: 'json'
            }).done(function (data) {
                // get the local data
                let sites = data.sites;
                console.log(sites);
                const transaction = db.transaction(["sites"], 'readwrite');
                transaction.oncomplete = (evt) => {
                    readIndexedDB().then(
                        (data)=>{
                            resolve(data);
                        }
                    );
                };
                transaction.onerror = (evt) => {
                    reject(evt);
                }

                const objectStore = transaction.objectStore('sites');
                sites.forEach((site) => {
                    const request = objectStore.put(site);
                    request.onerror = (evt) => {
                        reject(evt);
                    }
                });
                transaction.commit();
                $modal.modal('hide');
            });
        });
    }

    function readIndexedDB()
    {
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(["sites"], 'readwrite');
            const objectStore = transaction.objectStore('sites');
            let response = {
                type: 'FeatureCollection',
                "crs": {
                    "type": "link",
                    "properties": {
                        "href": "http://spatialreference.org/ref/epsg/26912/esriwkt/",
                        "type": "esriwkt"
                    }
                },
                features: []
            };

            const request = objectStore.openCursor();
            request.onsuccess = (evt) => {
                const cursor = evt.target.result;
                if (cursor) {
                    let site = cursor.value;
                    let push = true;
                    // check for filtering
                    if((filters.counties.length && !filters.counties.includes(site.county)) || (filters.types.length && !filters.types.includes(site.type)))
                    {
                        push = false;
                    }

                    if(push) {
                        response.features.push({
                            type: 'Feature',
                            properties: site,
                            geometry: {
                                type: 'Point',
                                coordinates: [site.longitude, site.latitude, 0]
                            }
                        });
                    }
                    cursor.continue();
                }
                else
                {
                    resolve(response);
                }
            };
        });
    }

    function filterSites()
    {
        readIndexedDB().then((data)=>{updateSites(data)});
    }

    function updateSites(data)
    {
        if(map.getSource('sites')) {
            map.removeLayer('clusters');
            map.removeLayer('cluster-count');
            map.removeLayer('unclustered');
            map.removeSource('sites');
        }

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
    }
})(window.jQuery);