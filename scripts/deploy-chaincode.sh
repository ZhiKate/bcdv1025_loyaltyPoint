#!/bin/bash

. scripts/common/utils.sh
. scripts/common/env_var.sh
. scripts/common/chaincode-utils.sh

CHAINCODE_SRC_PATH="./atcc"
CHAINCODE_SRC_LANGUAGE="typescript"
CHAINCODE_RUNTIME_LANGUAGE=node
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

#INIT_REQUIRED=""
INIT_REQUIRED="--init-required"
#CC_END_POLICY="--signature-policy $CC_END_POLICY"
CC_END_POLICY=""
#CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
CC_COLL_CONFIG=""
APPROVE_POLICY=""

#export FABRIC_CFG_PATH=$PWD/../config/
export FABRIC_CFG_PATH=$PWD/fabric-network/docker/peercfg/

function chaincodeBuild() {
  infoln "Compiling TypeScript code into JavaScript..."
  pushd $CHAINCODE_SRC_PATH
  npm install
  npm run build
  popd
  successln "Finished compiling TypeScript code into JavaScript"
}

function checkPrereqs() {
  jq --version > /dev/null 2>&1

  if [[ $? -ne 0 ]]; then
    errorln "jq command not found..."
    errorln
    errorln "Follow the instructions in the Fabric docs to install the prereqs"
    errorln "https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html"
    exit 1
  fi
  successln "check for prerequisites success.."
}

function packageChaincode() {
  set -x
  ./bin/peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
  --path ${CHAINCODE_SRC_PATH} \
  --lang ${CHAINCODE_RUNTIME_LANGUAGE} \
  --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION} >&log.txt
  res=$?
  PACKAGE_ID=$(./bin/peer lifecycle chaincode calculatepackageid ${CHAINCODE_NAME}.tar.gz)
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode packaging has failed"
  successln "Chaincode is packaged. PACKAGE_ID: $PACKAGE_ID"
}

if [ -d "./atcc/node_modules" ]; then
    rm -rf ./atcc/node_modules && rm -rf ./atcc/dist && rm -rf mychaincode.tar.gz
fi

# 1. build typescript
warnBoldln "0. chaincodeBuild"
chaincodeBuild

# 2. check for prerequisites
warnBoldln "1. checkPrereqs"
checkPrereqs

# 3. gzip chaincode
warnBoldln "2. packageChaincode"
packageChaincode

# 4. Install chaincode on peers
warnBoldln "3. installChaincode 1"
installChaincode 1 localhost:7051
installChaincode 1 localhost:7054
warnBoldln "3. installChaincode 2"
installChaincode 2 localhost:9051

# 5. query whether the chaincode is installed
warnBoldln "4. queryInstalled 1"
queryInstalled 1 localhost:7051
queryInstalled 1 localhost:7054
warnBoldln "4. queryInstalled 2"
queryInstalled 2 localhost:9051

# 6. approve the definition for org1
warnBoldln "5. approveForMyOrg 1"
approveForMyOrg 1
# check whether the chaincode definition is ready to be committed
# expect them both to have approved
warnBoldln "5. checkCommitReadiness 1"
checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": false"
warnBoldln "5. checkCommitReadiness 2"
checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": false"

# 7. now approve also for org2
warnBoldln "6. approveForMyOrg 2"
approveForMyOrg 2
# check whether the chaincode definition is ready to be committed
# expect them both to have approved
warnBoldln "6. checkCommitReadiness 1"
checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": true"
warnBoldln "6. checkCommitReadiness 2"
checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": true"

# 8. now that we know for sure both orgs have approved, commit the definition
warnBoldln "7. commitChaincodeDefinition 1 2"
commitChaincodeDefinition 1 2
# query on both orgs to see that the definition committed successfully
warnBoldln "7. queryCommitted 1"
queryCommitted 1
warnBoldln "7. queryCommitted 2"
queryCommitted 2

# 9. Invoke the chaincode - this does require that the chaincode have the 'initLedger'
warnBoldln "8. chaincodeInvokeInit 2"
CHAINCODE_INIT_FUNCTION="InitLedger"
FCN_CALL='{"function":"'${CHAINCODE_INIT_FUNCTION}'","Args":[]}'
chaincodeInvoke 1 2 true
# Check the Initial chaincode data
#warnBoldln "8. chaincodeQuery 1"
#chaincodeQuery 1 '{"Args":["GetAllAssets"]}' localhost:7051
#chaincodeQuery 1 '{"Args":["GetAllAssets"]}' localhost:7054
#warnBoldln "8. chaincodeQuery 2"
#chaincodeQuery 2 '{"Args":["GetAllAssets"]}' localhost:9051
#
#warnBoldln "9.(Get asset by customerId) chaincodeQuery 1"
#chaincodeQuery 1 '{"function":"ReadAssetByCustomer","Args":["1"]}' localhost:7051
#chaincodeQuery 1 '{"function":"ReadAssetByCustomer","Args":["1"]}' localhost:7054
#warnBoldln "9.(Get asset by customerId) chaincodeQuery 2"
#chaincodeQuery 2 '{"function":"ReadAssetByCustomer","Args":["1"]}' localhost:9051
#
#warnBoldln "9.(Get asset by orderId) chaincodeQuery 1"
#chaincodeQuery 1 '{"function":"ReadAssetByOrder","Args":["1"]}' localhost:7051
#chaincodeQuery 1 '{"function":"ReadAssetByOrder","Args":["1"]}' localhost:7054
#warnBoldln "9.(Get asset by orderId) chaincodeQuery 2"
#chaincodeQuery 2 '{"function":"ReadAssetByOrder","Args":["1"]}' localhost:9051
#
#warnBoldln "10.(Get asset by key: customerId, orderId and status) chaincodeQuery 1"
#chaincodeQuery 1 '{"function":"ReadAssetByKey","Args":["1","1","COMPLETE_REFUND"]}' localhost:7051
#chaincodeQuery 1 '{"function":"ReadAssetByKey","Args":["1","1","COMPLETE_REFUND"]}' localhost:7054
#warnBoldln "10.(Get asset by customerId, orderId and status) chaincodeQuery 2"
#chaincodeQuery 2 '{"function":"ReadAssetByKey","Args":["1","1","COMPLETE_REFUND"]}' localhost:9051

exit 0
