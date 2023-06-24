
############################  Project Description ################################################################

Our project is to use hyperledger fabric to provide liquidity to loyalty point. 
To solve fix dilemma of Current Loyalty Points System (low liquidity).

#############################   MEMBER IN GROUP  ##################################################################

1. Jayesh Desai
2. Ritwik Singh
3. Jigar Desai
4. Heegyoung Choi
5. Cuimei Zhi

################################## REQUIRMENT TO RUN PROGRAM #######################################################
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



#############################################  STATE DIAGRAM  ############################################################
diagram.jpg in the same path of this README.md.

#############################################  Sequence Diagram  #########################################################
all Sequence Diagrams are in the folder 'SequenceDiagram'

#############################################   Roles #######################################################
In the channel:
Organizations: We need 3 organizations for each of the 3 different types of loyalty points.
        -- Org1: 2 peers
        -- Org2: 1 peer
        -- Org3: 2 peers

Order: 1 order

Database: CouchDB 
         -- because we can use compound key to get the arrange of "point cards". One user can apply multipul "point cards"

