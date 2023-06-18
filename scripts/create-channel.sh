#!/bin/bash

. scripts/common/channel-utils.sh

if [ -d "channel-artifacts" ]; then
  rm -Rf channel-artifacts
fi
mkdir channel-artifacts

#export FABRIC_CFG_PATH=$PWD/../config/
export FABRIC_CFG_PATH=$PWD/fabric-network/docker/peercfg/

# Create channel genesis block
infoln "Generating channel genesis block '${CHANNEL_NAME}.block'"
createChannelGenesisBlock

# Create channel
infoln "Creating channel ${CHANNEL_NAME}"
createChannel

# Join all the peers to the channel (org is joined the channel)
infoln "Joining org1 peer to the channel..."
joinChannel 1 localhost:7051
joinChannel 1 localhost:7054
infoln "Joining org2 peer to the channel..."
joinChannel 2 localhost:9051

## Set the anchor peers for each org in the channel
infoln "Setting anchor peer for org1..."
setAnchorPeer 1
#infoln "Setting anchor peer for org2..."
setAnchorPeer 2

successln "Channel '$CHANNEL_NAME' joined"