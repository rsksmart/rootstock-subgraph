# Migrating the /datafeed/price/ endpoint

The https://backend.sovryn.app/datafeed/price/ endpoint has now been deprecated as part of our migration to the Graph.

The Sovryn Subgraph provides more reliable and accessible data to the Sovryn community, and will make it easier for third parties to integrate with our data.

## How to use our pricing data

You can access the data that you were previously receiving this endpoint point in the following way:

1. Navigate to https://subgraph.sovryn.app/subgraphs/name/DistributedCollective/sovryn-subgraph/graphql. This will take you to the Subgraph GUI playground where you can see the data schema and run queries.
2. If you want to return candlestick data for a token pair, you can run this query:

```
{
  candleStickFifteenMinutes
  (where: {
    baseToken: "0xefc78fc7d48b64958315949279ba181c2114abbd", # SOV token address
    quoteToken: "0xb5999795be0ebb5bab23144aa5fd6a02d080299f",# WRBTC token address
    periodStartUnix_lte: 1681887600,# 19/04/23 12:00 UTC
    periodStartUnix_gte: 1681866000 # 19/04/23 06:00 UTC

  }, orderBy: periodStartUnix) {
    open
    high
    low
    close
    totalVolume
  }
}

```

3. If you want to just return the last traded price of all tokens in BTC or in USD, you can run this query:

```
{
  tokens {
    symbol
    id
    lastPriceBtc
    lastPriceUsd
  }
}
```

4. You can use these queries in your application by using the GraphQL query language (docs [here](https://graphql.org/)), and any additional libraries for working with GraphQL in your chosen language. For example, if you are using Javascript, we recommend using [Apollo Client](https://www.apollographql.com/docs/)

## Things to note

- For candlestick data, the only available options for the quote token are RBTC and XUSD. So, you can get candlestick data for SOV/RBTC and SOV/XUSD, but you cannot get candlestick data for SOV/ETH
- If you want pricing data for non-RBTC and non-XUSD token pairs, you can calculate it in the following way: `SOV-ETH price = SOV-BTC price * 1/ETH-BTC price`

If you need have any questions, please reach out to the Sovryn team via Discord.
