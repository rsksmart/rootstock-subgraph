# Sovryn Subgraph

## Description

Subgraph for the Sovryn Core Protocol contracts including AMM, Staking, Vesting, Governance, FastBTC, Margin Trading and Borrowing. Other products like Perpetual Swaps and Zero have their own subgraphs.

This subgraph contains logic for transforming and storing blockchain events in the Sovryn Protocol, and serving up a publicly available graphQL API for this data. The iGraphQL explorer is deployed [here](https://subgraph.sovryn.app/subgraphs/name/DistributedCollective/sovryn-subgraph/graphql), and you can find detailed schema documentation there or in the ./schema directory in this repo.

Please note that this is still an early version of the subgraph. While it has undergone testing, we are aware there may be some bugs. If you wish to report a bug, please contact us on discord through the [tech-support](https://discord.com/channels/729675474665603133/813119624098611260) or [user-feedback](https://discord.com/channels/729675474665603133/750376232771780608) channels to let us know.

For more information on The Graph protocol, head to the Graph documentation here: https://thegraph.com/docs/.

## Prerequisites

* have node v12 or above installed
* have Docker and Docker Compose installed

## Start running

* clone repo
  
* Run ``npm install``

* Add a ``.env.dev`` file in the root of the project. Copy the contents of ``.env.example`` into this file (you can change the password to your own password if you wish)

* Run ``npm run schema`` to generate the schema.graphql file from the ./schema directory

* Run ``npm run prepare:RSK:testnet``. This will create the docker-compose.yml file and the subgraph.yaml file from the template files.
  
* Run ``npm run dev:up``. This will run docker compose up -d and pass in your environment file.
  
* Run ``npm run codegen``. This will generate the ./generated folder with types and contract objects.
  
* Run ``npm run build`` to generate the build folder
  
* Run ``npm run create-local`` to start running the graph node locally
  
* Run ``npm run deploy-local`` to deploy the contents of the build folder locally
  
* Go to http://localhost:8000/subgraphs/name/DistributedCollective/sovryn-subgraph/graphql to see the iGraphQL GUI for your local subgraph


## Scaffolding:

When adding a new abi to the subgraph, you can s

* ``npm run scaffold -- -fp <ABI_FILE_PATH> -gm -gs -a <CONTRACT_ADDRESS>``
This will generate a mapping file in ./src with the name of the abi, a schema file in ./schema with 

* ``npm run scaffold -- --help`` for more options

## Test subgraph from a later block

If you want to start the subgraph from a later block, you can run the following script to change all the start blocks of all data sources to the desired block. Note that this will mean that all data before that block will be absent from the subgraph.

To temporarily change the start block for testing:
* ``npm run test-start-block -b [ BLOCK_NUMBER ]``

To reset start blocks back to original state:
* ``npm run prepare:RSK:testnet``

## Build a partial subgraph

While developing, you can partially build a subgraph if you don't need data to sync from all the contracts.

To build a partial manifest run:
* ``npm run partial-manifest -- -sect [ SUBSECTION_NAME ]``

To add a new manifest subsection (eg vesting, governance, bridges), go to ``utils/buildPartialManifest.js`` and add an array of the contracts you want in your subsection to the manifestSections array.

You can also add to the keywords array if you want to filter the contracts by keyword, for example only keeping contracts that contain 'Vesting'.

## Useful info

* If you are having issues with postgres, delete the ``data/`` directory from the subgraph root
* The block numbers for Orderbook contracts on mainnet are set to blocks far in the future, because these contracts only exist on testnet

## Acknowledgments

Thanks to creators/contributors of the following repos for inspiration and code snippets:
- Bancor Blocklytics
- Uniswap
- Protofire library