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

    static async getSitesForArea(req, res)
    {
        let db=this.getDB(req, res);
        let types = await this.getSiteTypes(req, res);
        let bounds = JSON.parse(req.body.bounds);
        let qry = {
            '$and':[
                {'classdesc':{'$in':types}},
                {'latitude':{'$gt':Math.min(...bounds.lats)}},
                {'latitude':{'$lt':Math.max(...bounds.lats)}},
                {'longitude':{'$gt':Math.min(...bounds.lngs)}},
                {'longitude':{'$lt':Math.max(...bounds.lngs)}}
            ]};
        let sites = await db.collection('sites').find(qry, {projection:{ _id: 0 }}).toArray();
        res.json({status:"success",requestedBounds:bounds, sites:sites});
    }

    static async getSiteTypes(req, res)
    {
        let db=this.getDB(req, res);
        let typesJSON = await db.collection('types').find({}, {projection:{ _id: 0 }}).toArray();
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