 CREATE VIEW tokens_current as
 SELECT DISTINCT ON (token.id) token.id,
    token.symbol,
    token.last_price_usd,
    token.last_price_btc
   FROM sgd1.token
  ORDER BY token.id, token.vid DESC;