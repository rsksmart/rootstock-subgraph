# This script concatenates all the files in the schema directory into the schema.graphql file

red=`tput setaf 1`
yellow=`tput setaf 3`
green=`tput setaf 2`
reset=`tput sgr0`

# If schema/* does not exist return error
[ ! -d "schema/" ] && echo "❌ Error: schema/ directory does not exist - please create it" && exit 1;

# If schema/* exists but is empty return error
[ ! "$(ls -A schema/)" ] && echo "❌ Error: schema/ directory is empty. Please add some .graphql schema files." && exit 1;

# Else if schema.graphql exists, delete it
[ -f "schema.graphql" ] && rm schema.graphql;

# Rewrite schema.graphql
for f in schema/*.graphql; do (cat "${f}"; echo; echo) >> schema.graphql;
echo "${green}✔ ${reset}Schema for ${yellow}$f${reset} has been written to schema.graphql";
done;
echo; echo "Schema.graphql is ready";