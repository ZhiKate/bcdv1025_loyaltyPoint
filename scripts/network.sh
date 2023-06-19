#!/bin/bash

. scripts/common/utils.sh
. scripts/generate-crypto.sh

set -euo pipefail

# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

function networkUp() {
  if [ -d "organizations/peerOrganizations" ]; then
      rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
  fi
  if [ -d "organizations/fabric-ca" ]; then
      rm -Rf organizations/fabric-ca
  fi

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
}

function clearContainers() {
  infoln "Removing remaining containers"
  docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
  docker rm -f $(docker ps -aq --filter name='dev-peer*') 2>/dev/null || true
}

function removeUnwantedImages() {
  infoln "Removing generated chaincode docker images"
  docker image rm -f $(docker images -aq --filter reference='dev-peer*') 2>/dev/null || true
}

function networkDown() {
  DOCKER_SOCK=${DOCKER_SOCK} docker-compose -f fabric-network/docker-compose-local-couchdb.yaml \
    -f fabric-network/docker-compose-local-org1.yaml \
    -f fabric-network/docker-compose-local-org2.yaml \
    -f fabric-network/docker-compose-local-orderer.yaml \
    -f fabric-network/docker-compose-local-cli.yaml down --volumes --remove-orphans

  # Don't remove the generated artifacts -- note, the ledgers are always removed
  if [ "$MODE" != "restart" ]; then
    # Bring down the network, deleting the volumes
    docker volume rm fabric-network_orderer-userlog.example.com fabric-network_peer0.userlog-org1.example.com fabric-network_peer1.userlog-org1.example.com fabric-network_peer0.userlog-org2.example.com
    #Cleanup the chaincode containers
    clearContainers
    #Cleanup images
    removeUnwantedImages
    #
    docker kill $(docker ps -q --filter name=ccaas) || true
    # remove orderer block and other channel configuration transactions and certs
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf system-genesis-block/*.block organizations/peerOrganizations organizations/ordererOrganizations'
    ## remove fabric ca artifacts
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org1/msp organizations/fabric-ca/org1/tls-cert.pem organizations/fabric-ca/org1/ca-cert.pem organizations/fabric-ca/org1/IssuerPublicKey organizations/fabric-ca/org1/IssuerRevocationPublicKey organizations/fabric-ca/org1/fabric-ca-server.db'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/org2/msp organizations/fabric-ca/org2/tls-cert.pem organizations/fabric-ca/org2/ca-cert.pem organizations/fabric-ca/org2/IssuerPublicKey organizations/fabric-ca/org2/IssuerRevocationPublicKey organizations/fabric-ca/org2/fabric-ca-server.db'
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf organizations/fabric-ca/ordererOrg/msp organizations/fabric-ca/ordererOrg/tls-cert.pem organizations/fabric-ca/ordererOrg/ca-cert.pem organizations/fabric-ca/ordererOrg/IssuerPublicKey organizations/fabric-ca/ordererOrg/IssuerRevocationPublicKey organizations/fabric-ca/ordererOrg/fabric-ca-server.db'
    # remove channel and script artifacts
    docker run --rm -v "$(pwd):/data" busybox sh -c 'cd /data && rm -rf channel-artifacts log.txt *.tar.gz'
  fi
}

MODE=$1
shift

if [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "down" ]; then
  networkDown
fi