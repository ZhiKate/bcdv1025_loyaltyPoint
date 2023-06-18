#!/bin/bash

set -euo pipefail

. scripts/common/env_var.sh

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $3)
    local CP=$(one_line_pem $4)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        -e "s/\${ORG_NAME}/$5/" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $3)
    local CP=$(one_line_pem $4)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        -e "s/\${ORG_NAME}/$5/" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=1
P0PORT=7051
ORG_NAME=${PEER_ORG1}.${EXAMPLE_DOMAIN}
PEERPEM=organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/tlsca/tlsca.${PEER_ORG1}.${EXAMPLE_DOMAIN}-cert.pem
CAPEM=organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/ca/ca.${PEER_ORG1}.${EXAMPLE_DOMAIN}-cert.pem
echo "$(json_ccp $ORG $P0PORT $PEERPEM $CAPEM $ORG_NAME)" > organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/connection-org1.json
echo "$(yaml_ccp $ORG $P0PORT $PEERPEM $CAPEM $ORG_NAME)" > organizations/peerOrganizations/${PEER_ORG1}.${EXAMPLE_DOMAIN}/connection-org1.yaml

ORG=2
P0PORT=9051
ORG_NAME=${PEER_ORG2}.${EXAMPLE_DOMAIN}
PEERPEM=organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/tlsca/tlsca.${PEER_ORG2}.${EXAMPLE_DOMAIN}-cert.pem
CAPEM=organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/ca/ca.${PEER_ORG2}.${EXAMPLE_DOMAIN}-cert.pem
echo "$(json_ccp $ORG $P0PORT $PEERPEM $CAPEM $ORG_NAME)" > organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/connection-org2.json
echo "$(yaml_ccp $ORG $P0PORT $PEERPEM $CAPEM $ORG_NAME)" > organizations/peerOrganizations/${PEER_ORG2}.${EXAMPLE_DOMAIN}/connection-org2.yaml
