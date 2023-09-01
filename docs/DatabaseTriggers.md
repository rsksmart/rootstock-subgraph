# Database Triggers

In the Sovryn Subgraph, we use database triggers for the candlestick tables. This is to improve the performance of these tables by making these tables update rows rather than being write-only.

`scripts/db_triggers.js` is run after the subgraph has been deployed, and it runs the sql scripts `db_triggers.sql` and `candle_cleanup.sql`.

These scripts are important as they reduce the table size of all of the candlestick tables. For the larger interval candles (eg 1 day), the table size is reduced by >100x.

## Views

The sql files in directory `scripts/sql/views` create database views used by the data warehouse subgraph. They will not impact performance, and so can be safely added to all subgraphs.

## Improvements

As a future performance improvement, you may decide that you no longer wish to keep candles older than eg 1 month for minute candles. You could write a similar sql script to clean up old candles periodically.
