import cors from 'cors';
import express, {Application, NextFunction, Request, Response} from 'express';
import bodyParser from 'body-parser';
import 'express-async-errors';

import routes from './routes';
import searchRoutes from './routes/search';
import blocks from './routes/blocks';
import transactions from './routes/transactions';
import inherents from './routes/inherents';
import events from './routes/events';
import logs from './routes/logs';
import leases from './routes/leases';
import identities from './routes/identities';
import audits from './routes/audits';
import provenance from './routes/provenance';
import proposal from './routes/proposal';
import groups from './routes/groups';
import account from './routes/account';
import email from './routes/email';

const app: Application = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('downloads'));

// Routes
app.use("/", routes);
app.use("/search", searchRoutes);
app.use("/blocks", blocks);
app.use("/transactions", transactions);
app.use("/inherents", inherents);
app.use("/events", events);
app.use("/logs", logs);
app.use("/assetregistry", leases);
app.use("/identities", identities);
app.use("/audits", audits);
app.use("/sequences", provenance);
app.use("/accounts", account);
app.use("/proposals", proposal);
app.use("/groups", groups);
app.use("/email", email);


interface HttpError extends Error {
  status?: number;
}


app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json(err);
  next(err);
});

export default app;