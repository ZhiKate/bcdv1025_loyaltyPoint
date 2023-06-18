import * as grpc from '@grpc/grpc-js';
import {connect, Contract, Identity, Signer, signers} from "@hyperledger/fabric-gateway";
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from "path";

const mspId = 'Org1MSP';
const channelName = 'userlog-channel';
const chaincodeName = 'mychaincode';
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'userlog-org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@userlog-org1.example.com', 'msp', 'keystore'));

// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@userlog-org1.example.com', 'msp', 'signcerts', 'cert.pem'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.userlog-org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.userlog-org1.example.com');

export class Connection {
    public static contract: Contract;
    public init() {
        initFabric();
    }
}

async function initFabric(): Promise<void> {
    const client = await getGrpcClient();

    const gateway = connect({
        client,
        identity: await getIdentity(),
        signer: await getSigner(),
    });

    try {
        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        Connection.contract = contract;
    } catch(e: any) {
        console.log(e)
    } finally {
        // gateway.close();
        // client.close();
    }
}

async function getGrpcClient() : Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    })
}

async function getIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath);
    return {mspId, credentials};
}

async function getSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}