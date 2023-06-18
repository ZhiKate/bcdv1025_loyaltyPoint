#!/bin/bash

DELAY="3"
MAX_RETRY="5"
VERBOSE="false"
TIMEOUT="10"

EXAMPLE_DOMAIN="example.com"
ORDERER="orderer-userlog"
PEER_ORG1="userlog-org1"
PEER_ORG2="userlog-org2"
CHANNEL_NAME="userlog-channel"
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"
CHAINCODE_NAME="mychaincode"

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/${EXAMPLE_DOMAIN}/tlsca/tlsca.${EXAMPLE_DOMAIN}-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/${EXAMPLE_DOMAIN}/orderers/${ORDERER}.${EXAMPLE_DOMAIN}/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/${EXAMPLE_DOMAIN}/orderers/${ORDERER}.${EXAMPLE_DOMAIN}/tls/server.key
export CORE_PEER_TLS_ROOTCERT_FILE_ORG1_PEER0=${PWD}/organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/peers/peer0.${PEER_ORG1}.${EXAMPLE_DOMAIN}/tls/ca.crt
export CORE_PEER_TLS_ROOTCERT_FILE_ORG1_PEER1=${PWD}/organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/peers/peer1.${PEER_ORG1}.${EXAMPLE_DOMAIN}/tls/ca.crt
export CORE_PEER_TLS_ROOTCERT_FILE_ORG2_PEER0=${PWD}/organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/peers/peer0.${PEER_ORG2}.${EXAMPLE_DOMAIN}/tls/ca.crt

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=$1
  infoln "Using organization ${USING_ORG}"
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE_ORG1_PEER0}
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/users/Admin@${PEER_ORG1}.${EXAMPLE_DOMAIN}/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE_ORG2_PEER0}
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/users/Admin@${PEER_ORG2}.${EXAMPLE_DOMAIN}/msp
    export CORE_PEER_ADDRESS=localhost:9051
  else
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
  local USING_ORG=$1

  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_ADDRESS=peer0.${PEER_ORG1}.${EXAMPLE_DOMAIN}:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_ADDRESS=peer0.${PEER_ORG2}.${EXAMPLE_DOMAIN}:9051
  else
    errorln "ORG Unknown"
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer0.userlog-org$1"
    ## Set peer addresses
    if [ -z "$PEERS" ]; then
	    PEERS="$PEER"
    else
	    PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
#    CA=PEER0_ORG$1_CA
    CA=CORE_PEER_TLS_ROOTCERT_FILE_ORG$1_PEER0
    TLSINFO=(--tlsRootCertFiles "${!CA}")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}
