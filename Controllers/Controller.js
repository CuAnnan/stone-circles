class Controller
{
    static getDB(req, res)
    {
        return req.app.locals.db;
    }
}

module.exports = Controller;