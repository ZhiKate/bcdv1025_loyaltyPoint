#!/bin/bash

. scripts/common/utils.sh
. scripts/generate-crypto.sh

set -euo pipefail

# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

if [ -d "organizations/peerOrganizations" ]; then
    rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
fi
if [ -d "organizations/fabric-ca" ]; then
    rm -Rf organizations/fabric-ca
fi


#./bin/cryptogen generate --config=./organizations/cryptogen/crypto-config-org1.yaml --output="organizations"
#./bin/cryptogen generate --config=./organizations/cryptogen/crypto-config-org2.yaml --output="organizations"
#./bin/cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"

DOCKER_SOCK="${DOCKER_SOCK}" docker-compose -f fabric-network/docker-compose-ca.yaml up -d 2>&1

createOrg userlog-org1 2054 org1 2
createOrg userlog-org2 3054 org2 1
createOrderer

echo "Generating CCP files for Org1 and Org2"
scripts/ccp-generator.sh

DOCKER_SOCK="${DOCKER_SOCK}" docker-compose -f fabric-network/docker-compose-local-couchdb.yaml \
-f fabric-network/docker-compose-local-org1.yaml \
-f fabric-network/docker-compose-local-org2.yaml \
-f fabric-network/docker-compose-local-orderer.yaml \
-f fabric-network/docker-compose-local-cli.yaml up -d 2>&1

docker ps -a