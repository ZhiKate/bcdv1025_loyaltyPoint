#!/bin/bash

function changeGlobals() {
  if [ "$1" = "localhost:7054" ]; then
    export CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE_ORG1_PEER1}
  fi
}

function installChaincode() {
  ORG=$1
  CORE_PEER_ADDR=$2
  setGlobals $ORG
  export CORE_PEER_ADDRESS=${CORE_PEER_ADDR}
  changeGlobals ${CORE_PEER_ADDR}
  ./bin/peer lifecycle chaincode queryinstalled --output json | jq -r 'try (.installed_chaincodes[].package_id)' | grep ^${PACKAGE_ID}$ >&log.txt
  if test $? -ne 0; then
    ./bin/peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz >&log.txt
    res=$?
  fi
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode installation on peer0.org${ORG} has failed"
  successln "Chaincode is installed on peer0.org${ORG}"
}

function queryInstalled() {
  ORG=$1
  CORE_PEER_ADDR=$2
  setGlobals $ORG
  set -x
  export CORE_PEER_ADDRESS=${CORE_PEER_ADDR}
  changeGlobals ${CORE_PEER_ADDR}
  ./bin/peer lifecycle chaincode queryinstalled --output json | jq -r 'try (.installed_chaincodes[].package_id)' | grep ^${PACKAGE_ID}$ >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Query installed on peer0.org${ORG} has failed"
  successln "Query installed successful on peer0.org${ORG} on channel"
}

function approveForMyOrg() {
  ORG=$1
  setGlobals $ORG
  set -x
  ./bin/peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride ${ORDERER}.${EXAMPLE_DOMAIN} \
  --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME \
  --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id ${PACKAGE_ID} \
  --sequence ${CHAINCODE_SEQUENCE} ${INIT_REQUIRED} ${CC_END_POLICY} ${CC_COLL_CONFIG} >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition approved on peer0.org${ORG} on channel '$CHANNEL_NAME' failed"
  successln "Chaincode definition approved on peer0.org${ORG} on channel '$CHANNEL_NAME'"
}

function checkCommitReadiness() {
  ORG=$1
  shift 1
  setGlobals $ORG
  infoln "Checking the commit readiness of the chaincode definition on peer0.org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to check the commit readiness of the chaincode definition on peer0.org${ORG}, Retry after $DELAY seconds."
    set -x
    ./bin/peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
    --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} \
    --sequence ${CHAINCODE_SEQUENCE} ${INIT_REQUIRED} ${CC_END_POLICY} ${CC_COLL_CONFIG} --output json >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    let rc=0
    for var in "$@"; do
      grep "$var" log.txt &>/dev/null || let rc=1
    done
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    infoln "Checking the commit readiness of the chaincode definition successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    fatalln "After $MAX_RETRY attempts, Check commit readiness result on peer0.org${ORG} is INVALID!"
  fi
}

function commitChaincodeDefinition() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  set -x
  ./bin/peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride ${ORDERER}.${EXAMPLE_DOMAIN} \
  --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name ${CHAINCODE_NAME} "${PEER_CONN_PARMS[@]}" \
  --version ${CHAINCODE_VERSION} --sequence ${CHAINCODE_SEQUENCE} ${INIT_REQUIRED} ${CC_END_POLICY} ${CC_COLL_CONFIG} >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition commit failed on peer0.org${ORG} on channel '$CHANNEL_NAME' failed"
  successln "Chaincode definition committed on channel '$CHANNEL_NAME'"
}

function queryCommitted() {
  ORG=$1
  setGlobals $ORG
  EXPECTED_RESULT="Version: ${CHAINCODE_VERSION}, Sequence: ${CHAINCODE_SEQUENCE}, Endorsement Plugin: escc, Validation Plugin: vscc"
  infoln "Querying chaincode definition on peer0.userlog-org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to Query committed status on peer0.userlog-org${ORG}, Retry after $DELAY seconds."
    set -x
    ./bin/peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CHAINCODE_NAME} >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    test $res -eq 0 && VALUE=$(cat log.txt | grep -o '^Version: '$CHAINCODE_VERSION', Sequence: [0-9]*, Endorsement Plugin: escc, Validation Plugin: vscc')
    test "$VALUE" = "$EXPECTED_RESULT" && let rc=0
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    successln "Query chaincode definition successful on peer0.userlog-org${ORG} on channel '$CHANNEL_NAME'"
  else
    fatalln "After $MAX_RETRY attempts, Query chaincode definition result on peer0.userlog-org${ORG} is INVALID!"
  fi
}

function chaincodeInvoke() {
  orgs=${*%${!#}}
  isInit=${@:$#}
  parsePeerConnectionParameters ${orgs}
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  IS_INIT=""
  if [ "$isInit" = true ] ; then
      IS_INIT="--isInit"
  fi

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  set -x
  infoln "invoke fcn call: ${FCN_CALL}"
  ./bin/peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride ${ORDERER}.${EXAMPLE_DOMAIN} \
  --tls --cafile "$ORDERER_CA" -C $CHANNEL_NAME -n ${CHAINCODE_NAME} "${PEER_CONN_PARMS[@]}" \
  ${IS_INIT} -c ${FCN_CALL} >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  successln "Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME'"
}

function chaincodeQuery() {
  ORG=$1
  ARGS=$2
  CORE_PEER_ADDR=$3
  setGlobals $ORG

  infoln "Querying on peer${ORG}.userlog-org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to Query peer${ORG}.userlog-org${ORG}(${CORE_PEER_ADDRESS}), Retry after $DELAY seconds."
    export CORE_PEER_ADDRESS=${CORE_PEER_ADDR}
    changeGlobals ${CORE_PEER_ADDR}
    set -x
    ./bin/peer chaincode query -C $CHANNEL_NAME -n ${CHAINCODE_NAME} -c ${ARGS} >&log.txt
    res=$?
    { set +x; } 2>/dev/null
    let rc=$res
    COUNTER=$(expr $COUNTER + 1)
  done
  cat log.txt
  if test $rc -eq 0; then
    successln "Query successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    fatalln "After $MAX_RETRY attempts, Query result on peer0.org${ORG} is INVALID!"
  fi
}
