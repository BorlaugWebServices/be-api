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
      logs         = require("./routes/logs"),
      leases       = require("./routes/leases"),
      identities   = require("./routes/identities"),
      audits       = require("./routes/audits"),
      provenance   = require("./routes/provenance"),
      account       = require("./routes/account"),
      email = require("./routes/email");

app.use("/", require("./routes"));
app.use("/search", require("./routes/search"));
app.use("/blocks", blocks);
app.use("/transactions", transactions);
app.use("/inherents", inherents);
app.use("/events", events);
app.use("/logs", logs);
app.use("/leases", leases);
app.use("/identities", identities);
app.use("/audits", audits);
app.use("/sequences", provenance),
app.use("/accounts", account);
app.use("/email", email);

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json(err);
    next(err);
});

module.exports = app;
