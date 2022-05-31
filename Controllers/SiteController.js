const Controller = require('./Controller');

/*
 * This code sets up the matches for what the text searches provided look for in the database.
 * The simple query variables are just name:<provided value> but the simple fix types are name:<regex matching>
 */
let simpleQryVariables = ["Anomalous stone group",
    "Boulder-burial",
    "Cliff-edge fort",
    "Henge",
    "Hillfort",
    "Hilltop enclosure",
    "Megalithic structure",
    "Stone row",
    "Stone sculpture - aniconic",
    "Stone sculpture - iconic"];

let allQryTypes = {};

for(let simpleQryVariable of simpleQryVariables)
{
    allQryTypes[simpleQryVariable] = {'name':simpleQryVariable};
}

const simpleFixes = ["Bullaun stone","Cairn","Megalithic structure","Megalithic tomb","Ogham stone","Ringfort","Rock art","Standing stone","Stone circle"];
for(let fix of simpleFixes)
{
    allQryTypes[fix]={"name":{"$regex":`${fix}.*`}};
}


class SiteController extends Controller
{
    static async getSites(req, res)
    {
        let db=this.getDB(req, res);
        let types = await this.getSiteTypes(req, res);
        let qry = {
            '$and':[
                {'classdesc':{'$in':types}},
                {"longitude":{"$gte":-15}}
            ]
        };

        let rCounties = req.body['counties[]'];

        if(rCounties)
        {
            if(typeof rCounties === 'object') {
                let counties = [];
                for (let county of rCounties) {
                    counties.push(county.toUpperCase());
                }
                qry.$and.push({'county':{'$in':counties}});
            }
            else
            {
                qry.$and.push({'county':rCounties.toUpperCase()});
            }
        }

        let sites = await db.collection('sites').find(qry, {projection:{ _id: 0 }}).toArray();
        return sites;
    }

    static async getSitesForAreaAsFeatures(req, res)
    {
        let sites = await this.getSites(req, res);

        let response = {
            type:'FeatureColelction',
            "crs": {
                "type": "link",
                "properties": {
                    "href": "http://spatialreference.org/ref/epsg/26912/esriwkt/",
                    "type": "esriwkt"
                }
            },
            features:[]
        };

        for(let site of sites)
        {
            response.features.push({
                type:'Feature',
                properties:site,
                geometry:{
                    type:'Point',
                    coordinates:[site.longitude, site.latitude, 0]
                }
            });
        }

        res.json(response);
    }

    static async getSiteTypes(req, res)
    {
        let db=this.getDB(req, res);
        let $orFilter = [];
        let bTypes =req.body['types[]'];

        if(bTypes)
        {
            if(typeof bTypes === 'object') {
                for (let type of bTypes) {
                    let qryType = allQryTypes[type];
                    if (!qryType) {
                        console.log(`${type} not found`);
                    }
                    $orFilter.push(qryType);
                }
            }
            else
            {
                $orFilter.push(allQryTypes[bTypes]);
            }
        }
        else
        {
            $orFilter = Object.values(allQryTypes);
        }

        let typesJSON = await db.collection('types').find(
            {
                "$or":$orFilter
            },
            {projection:{ _id: 0 }}
        ).toArray();

        let types = [];
        for(let val of typesJSON)
        {
            types.push(val.name);
        }
        return types;
    }

    static async getSiteTypesAction(req, res)
    {
        let types = await this.getSiteTypes(req, res);
        res.json({success:true, types:types});
    }

    static async indexAction(req, res)
    {

    }
}

module.exports = SiteController;