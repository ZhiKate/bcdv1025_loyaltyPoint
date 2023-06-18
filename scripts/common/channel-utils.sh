#!/bin/bash

. scripts/common/utils.sh
. scripts/common/env_var.sh

createChannelGenesisBlock() {
	set -x
	./bin/configtxgen -profile TwoOrgsApplicationGenesis \
	-outputBlock $BLOCKFILE \
	-channelID $CHANNEL_NAME \
	-configPath ${PWD}/configtx
	res=$?
	{ set +x; } 2>/dev/null
  verifyResult $res "Failed to generate channel configuration transaction..."
}

createChannel() {
  setGlobals 1
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x
		./bin/osnadmin channel join --channelID $CHANNEL_NAME \
		--config-block $BLOCKFILE \
		-o localhost:7053 --ca-file "$ORDERER_CA" \
		--client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" \
		--client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" >&log.txt
		res=$?
		{ set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $res "Channel creation failed"
}

# joinChannel ORG
joinChannel() {
  ORG=$1
  CORE_PEER_ADDR=$2
  setGlobals $ORG
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    export CORE_PEER_ADDRESS=${CORE_PEER_ADDR}
    if [ ${CORE_PEER_ADDR} = "localhost:7054" ]; then
      export CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE_ORG1_PEER1}
    fi
    set -x
    ./bin/peer channel join -b $BLOCKFILE >&log.txt
    res=$?
    { set +x; } 2>/dev/null
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $res "After $MAX_RETRY attempts, peer0.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

setAnchorPeer() {
  ORG=$1
  docker exec cli ./scripts/set-anchor-peer.sh $ORG $CHANNEL_NAME
}
