let express = require('express');
let router = express.Router();
const Controller = require('../Controllers/SiteController');

console.log("Hoisting sites router");

router.get('/geoJSONByDate', function(req, res, next){
    Controller.getGeoJSONByDate(req, res).catch((err)=>{
        console.log(err);
        next();
    })
});

router.get('/allTypes', function(req, res,next){
    Controller.getSiteTypesAction(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

router.get('/qryTypes', function(req, res, next){
    Controller.getQryTypeFixes(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

module.exports = router;