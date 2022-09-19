CREATE VIEW core_protocol_fees as 
 SELECT fees.token,
    tokens.symbol,
    fees.amount,
    fees.amount * tokens.usd_price AS usd_amount,
    fees.date,
    fees.type
   FROM ( SELECT t1.token,
            sum(t1.amount) AS amount,
            t1."timestamp" AS date,
            t1.type
           FROM ( SELECT concat('0x', encode(pay_lending_fee.token, 'hex'::text)) AS token,
                    pay_lending_fee.amount,
                    date(to_timestamp(pay_lending_fee."timestamp"::double precision)) AS "timestamp",
                    'Lending'::text AS type
                   FROM sgd1.pay_lending_fee
                UNION ALL
                 SELECT concat('0x', encode(pay_borrowing_fee.token, 'hex'::text)) AS token,
                    pay_borrowing_fee.amount,
                    date(to_timestamp(pay_borrowing_fee."timestamp"::double precision)) AS "timestamp",
                    'Borrowing'::text AS type
                   FROM sgd1.pay_borrowing_fee
                UNION ALL
                 SELECT concat('0x', encode(pay_trading_fee.token, 'hex'::text)) AS token,
                    pay_trading_fee.amount,
                    date(to_timestamp(pay_trading_fee."timestamp"::double precision)) AS "timestamp",
                    'Trading'::text AS type
                   FROM sgd1.pay_trading_fee
                UNION ALL
                 SELECT conversion.to_token AS token,
                    conversion.protocol_fee AS amount,
                    date(to_timestamp(conversion."timestamp"::double precision)) AS "timestamp",
                    'SwapProtocolFee'::text AS type
                   FROM sgd1.conversion
                  WHERE conversion.protocol_fee > 0::numeric) t1
          GROUP BY t1.token, t1."timestamp", t1.type) fees
     JOIN ( SELECT round(avg(t2.price), 2) AS usd_price,
            t2.date,
            t2.token,
            t2.symbol
           FROM ( SELECT a.id AS token,
                    a.symbol,
                    a.last_price_usd AS price,
                    lower(a.block_range) AS lower,
                    date(to_timestamp(b."timestamp"::double precision)) AS date
                   FROM sgd1.token a
                     JOIN sgd1.transaction b ON b.block_number = lower(a.block_range)
                  ORDER BY a.vid) t2
          GROUP BY t2.token, t2.symbol, t2.date) tokens ON fees.date = tokens.date AND tokens.token = fees.token
  ORDER BY tokens.date DESC;