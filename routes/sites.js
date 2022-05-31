let express = require('express');
let router = express.Router();
const Controller = require('../Controllers/SiteController');

console.log("Hoisting sites router");

router.get('/all', function(req, res,next){
    Controller.getSitesAction(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

router.post('/fetch', function(req, res, next){
    Controller.getSitesForArea(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

router.get('/allTypes', function(req, res,next){
    Controller.getSiteTypesAction(req, res).catch((err)=>{
        next();
    });
});

router.get('/GeoJSON', function(req, res, next){
    Controller.getSitesForAreaAsFeatures(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

router.post('/GeoJSON', function(req, res, next){
    Controller.getSitesForAreaAsFeatures(req, res).catch((err)=>{
        console.log(err);
        next();
    });
});

module.exports = router;