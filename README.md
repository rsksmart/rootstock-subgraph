# Example Subgraph

## Prerequisites

* have node v12 or above installed
* have Docker and Docker Compose installed

## Start running

* clone repo
  
* npm install

* npm run prepare:RSK:testnet (this will create the docker compose file and the subgraph.yaml from the template files)
  
* docker-compose up -d
  
* npm run codegen
  
* npm run build
  
* npm run create-local
  
* npm run deploy-local
  
* go to http://localhost:8000/subgraphs/name/DistributedCollective/sovryn-subgraph/graphql


## Scaffolding:

* npm run scaffold -- -fp <abi file path> -gm -gs -a <contract address>

* npm run scaffold -- --help for more options


An example to help you get started with The Graph. For more information see the docs on https://thegraph.com/docs/.

## Deploy Subgraph to locally hosted service

1. Add a tag with command git tag [ TAG_NAME ] . The tag should be consistent with the graph versioning
2. Run git push origin [ TAG_NAME ]
3. Go to Jenkins site: 172.20.2.229:8080
4. Select create-graphql-cluster and build with parameters
5. Log in to aws console to check that new cluster is up
6. Get GraphiQL url from aws console and add to Postman in subgrap syn environment
7. When the new subgraph has synced, we need to change the dns to new subgraph: switching DNS name to new ELB: http://172.20.2.229:8080/job/change-dns-entry-graphql/. Use dns name for new subgraph from aws console as parameter for jenkins.
8. Check that dns has switched over successfully: "prod" address: https://graphql.sovryn.app/subgraphs/name/DistributedCollective/Sovryn-subgraph/graphql

## Unit Testing

* Build a matchstick docker image following these instructions: https://github.com/LimeChain/matchstick/blob/main/README.md

* To build the tests run: ``sudo docker build -t matchstick .``

* To run the tests run: ``docker run --rm matchstick``

## Test subgraph from a later block

If you want to start the subgraph from a later block, you can run the following script to change all the start blocks of all data sources to the desired block. Note that this will mean that all data before that block will be absent from the subgraph.

To temporarily change the start block for testing:
* ``npm run test-start-block -b [ BLOCK_NUMBER ]``
* ``npm run prepare:RSK:testnet``

To set start blocks back to original state:
* ``npm run test-start-block -reset``
* ``npm run prepare:RSK:testnet``

## Build a partial subgraph

While developing, you can partially build a subgraph if you don't need data from all the contracts.

To build a partial manifest run:
* ``npm run partial-manifest -- -sect [ SUBSECTION NAME ]``

To add a new manifest subsection (eg vesting, governance, bridges), go to utils/buildPartialManifest.js and add a list of the contracts you want in your subsection to the manifestSections array.

## Useful info

* If you are having issues with postgres when building matchstick, delete the data/ directory from the subgraph root
* The block numbers for Orderbook contracts on mainnet are set to blocks far in the future, because these contracts only exist on testnet