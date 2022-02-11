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


## Useful info

* If you are having issues with postgres when building matchstick, delete the data/ directory from the subgraph root