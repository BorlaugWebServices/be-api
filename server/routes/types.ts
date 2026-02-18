import {TransactionRow} from "be-datastore/lib/dbTypes";

export interface Activity extends TransactionRow {
  isSuccess?: boolean;
}