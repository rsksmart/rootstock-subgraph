# Rootstock Subgraph

## Description

Subgraph Boilerplate for Rootstock. This solution is forked from [Sovryn Subgraph](https://github.com/DistributedCollective/Sovryn-subgraph)). This project aims to set up the bricks for helping the comunity to have their subgraph implementation. 

Subgraph for Rootstock contains an example contract, RootstockEvent. It is deployed on Tesnet [here](https://explorer.testnet.rsk.co/address/0x8b73111467242aa8829bb17765718c3749df472b)

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract RootstockEvent {    
    event Log(address indexed sender, string message);

    function test() public {
        emit Log(msg.sender, "Hello Rootstockers!");        
    }
}
```

This subgraph contains logic for transforming and storing blockchain events, and serving up a publicly available graphQL API for this data. The iGraphQL explorer can be deployed locally [here](http://127.0.0.1:8000/subgraphs/name/rsksmart/rootstock-subgraph/graphql), and you can find detailed schema documentation there or in the ./schema directory in this repo.

Please note that this is still an early version of the subgraph. While it has undergone testing, we are aware there may be some bugs.

For more information on The Graph protocol, head to the Graph documentation here: https://thegraph.com/docs/.

## Prerequisites

- have node v16 installed (higher versions may fail to deploy to the ipfs node)
- have Docker and Docker Compose installed

## Start running

- clone repo
- Run `npm install`
- Add a `.env.dev` file in the root of the project. Copy the contents of `.env.example` into this file (you can change the password to your own password if you wish)
- Run `npm run schema` to generate the schema.graphql file from the ./schema directory
- Run `npm run prepare:RSK:testnet`. This will create the docker-compose.yml file and the subgraph.yaml file from the template files.
- Run `npm run dev:up`. This will run docker compose up -d and pass in your environment file. (might need to run `docker pull arm64v8/docker` for M1 Macs)
- Run `npm run codegen`. This will generate the ./generated folder with types and contract objects.
- Run `npm run build` to generate the build folder
- Run `npm run create-local` to start running the graph node locally
- Run `npm run deploy-local` to deploy the contents of the build folder locally
- Go to http://localhost:8000/subgraphs/name/rsksmart/rootstock-subgraph/graphql to see the iGraphQL GUI for your local subgraph

## Scaffolding:

When adding a new abi to the subgraph, you can auto-generate the subgraph.yaml and initial mapping file by running a scaffold script:

- `npm run scaffold -- -fp <ABI_FILE_PATH> -gm -gs -a <CONTRACT_ADDRESS>`
  This will generate a mapping file in ./src with the name of the abi, a schema file in ./schema with an entity for each event, and a datasource in the subgraph.template.yml

- `npm run scaffold -- --help` for more options

## Test subgraph from a later block

If you want to start the subgraph from a later block, you can run the following script to change all the start blocks of all data sources to the desired block. Note that this will mean that all data before that block will be absent from the subgraph.

To temporarily change the start block for testing:

- `npm run test-start-block -- -b [ BLOCK_NUMBER ]`

To reset start blocks back to original state:

- `npm run prepare:RSK:testnet`

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Licence

The Sovryn DApp is open-sourced software licensed under the [MIT license](LICENSE).