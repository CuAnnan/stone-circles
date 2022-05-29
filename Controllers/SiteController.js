const Controller = require('./Controller');

class SiteController extends Controller
{
    static async getSitesAction(req, res)
    {
        let db=this.getDB(req, res);
        let types = await this.getSiteTypes(req, res);
        let sites = await db.collection('sites').find({'classdesc':{'$in':types}}).toArray();

        res.json({status:"success",sites:sites});
    }

    static async getSites(req, res)
    {
        let db=this.getDB(req, res);
        let types = await this.getSiteTypes(req, res);
        let qry = {'classdesc':{'$in':types}};
        let sites = await db.collection('sites').find(qry, {projection:{ _id: 0 }}).toArray();
        return sites;
    }

    static async getSitesForArea(req, res)
    {
        let sites = await this.getSites(req, res);
        res.json({status:"success", sites:sites});
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
        let typesJSON = await db.collection('types').find(
            {
                "$or":[
                    {"name":{"$regex":"Stone circle.*"}},
                    //{"name":{"$regex":"Ringfort.*"}}
                ]
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