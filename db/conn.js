const { MongoClient } = require("mongodb");
const {mongo} = require('./conf.js');


const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;


module.exports = {
    connect: function (callback) {
        if(dbConnection)
        {
            console.log('Already connected to MongoDB.');
        }

        client.connect(function (err, db) {
            if (err || !db) {
                return callback(err);
            }

            dbConnection = db.db("stoneCircles");
            console.log("Successfully connected to MongoDB.");

            return callback();
        });
    },

    getDb: function () {
        return dbConnection;
    },
};