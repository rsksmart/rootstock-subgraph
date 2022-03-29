export NETWORK=mainnet;
red=`tput setaf 1`
yellow=`tput setaf 3`
green=`tput setaf 2`
reset=`tput sgr0`
echo "Preparing subgraph for ${yellow}$NETWORK${reset} network" && echo;
npx mustache config/RSK.mainnet.json subgraph.template.yaml > subgraph.yaml;
echo "File: ${green}subgraph.yaml${reset} has been mustached";
npx mustache config/RSK.mainnet.json docker-compose.template.yml > docker-compose.yml;
echo "File: ${green}docker-compose.yml${reset} has been mustached";
npx mustache config/RSK.mainnet.json src/contracts/contracts.template > src/contracts/contracts.ts;
echo "File: ${green}src/contracts/contracts.ts${reset} has been mustached";
npx mustache config/RSK.mainnet.json src/blockNumbers/blockNumbers.template.ts > src/blockNumbers/blockNumbers.ts;
echo "File: ${green}src/blockNumbers/blockNumbers.ts${reset} has been mustached" && echo;
echo "Scaffolding data sources for backwards compatibility...";
node utils/backwardsCompatibility/scaffoldChangeBlocks.js;