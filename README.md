### Required installation.
1. curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
2. ./install-fabric.sh binary | ./install-fabric.sh --fabric-version 2.5.0 docker
3. brew install jq

### Up fabric network
7. ./scripts/network.sh up/down
8. ./scripts/create-channel.sh
9. ./scripts/deploy-chaincode.sh

# Backend dApp
cd backend  
npm install  
npm run build  
npm run dev  
swagger: http://localhost:8000/api-docs

# Frontend
cd frontend  
npm install  
npm run build  
npm run start  

### Access CouchDB GUI
GUI url: http://127.0.0.1:5984/_utils (check peer's port in docker compose file)
