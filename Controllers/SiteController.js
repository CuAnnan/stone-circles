const Controller = require('./Controller');

/*
 * This code sets up the matches for what the text searches provided look for in the database.
 * The simple query variables are just name:<provided value> but the simple fix types are name:<regex matching>
 */
let simpleQryVariables = ["Anomalous stone group",
    "Boulder-burial",
    "Ceremonial enclosure",
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

const simpleFixes = ["Bullaun stone","Cairn","Megalithic structure","Megalithic tomb", "Ogham stone","Ringfort","Rock art","Standing stone","Stone circle", "motte"];
for(let fix of simpleFixes)
{
    allQryTypes[fix]={"name":{"$regex":`${fix}.*`}};
}

class SiteController extends Controller
{
    static async getGeoJSONByDate(req, res)
    {
        let db=this.getDB(req, res);

        let types = await this.getSiteTypes(req, res);
        let qry = {
            '$and':[
                {'classdesc':{'$in':types}},
                {"longitude":{"$gte":-15}}
            ]
        };
        if(req.query.lastUpdated)
        {
            qry.$and.push({'lastUpdate':{"$gte":parseInt(req.query.lastUpdated)}});
            console.log(JSON.stringify(qry));
        }

        let sites = await db.collection('sites').find(qry, {projection:{ _id: 0 }}).toArray();
        let response = {sites:sites};

        console.log(response);

        res.json(response);
    }

    static async getSiteTypes(req, res)
    {
        let db=this.getDB(req, res);

        let typesJSON = await db.collection('types').find({"$or":Object.values(allQryTypes)},{projection:{ _id: 0 }}).toArray();

        let types = [];
        for(let val of typesJSON)
        {
            types.push(val.name);
        }
        console.log(types);
        return types;
    }

    static async getSiteTypesAction(req, res)
    {
        let types = await this.getSiteTypes(req, res);
        res.json({success:true, types:types});
    }

    static async getQryTypeFixes(req, res)
    {
        res.json(allQryTypes);
    }

    static async indexAction(req, res)
    {

    }
}

module.exports = SiteController;