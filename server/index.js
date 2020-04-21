/**
 * Application starts here.
 */
const cors       = require("cors"),
      express    = require("express"),
      bodyParser = require("body-parser");

require('express-async-errors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('downloads'));

const blocks       = require("./routes/blocks"),
      transactions = require("./routes/transactions"),
      inherents    = require("./routes/inherents"),
      events       = require("./routes/events"),
      leases       = require("./routes/leases");

app.use("/", require("./routes"));
app.use("/search", require("./routes/search"));
app.use("/blocks", blocks.router);
app.use("/transactions", transactions.router);
app.use("/inherents", inherents);
app.use("/events", events);
app.use("/leases", leases.router);

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json(err);
    next(err);
});

module.exports = app;
