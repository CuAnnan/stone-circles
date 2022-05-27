const { MongoClient } = require("mongodb");
const {mongo} = require('../conf.js');
const connectionString = `mongodb://${mongo.user}:${mongo.pass}@${mongo.host}`;


const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;


module.exports = {
    connect: function ()
    {
        return new Promise((resolve, reject)=>{
            try
            {
                client.connect().then(()=>{
                    resolve(client.db('stoneCircles'));
                });
            }
            catch(e)
            {
                reject(e)
            }
        });
    }
};