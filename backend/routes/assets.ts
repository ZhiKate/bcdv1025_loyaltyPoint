import {Express, Request, Response} from "express";
import {Connection} from "../fabric/connection";
import {EndorseError, GatewayError} from "@hyperledger/fabric-gateway";
import {instanceToPlain, plainToInstance} from "class-transformer";
import {OrderSchema} from "../schema/asset.schema";
import {validate, ValidationError} from "class-validator";

const utf8Decoder = new TextDecoder();
export class AssetRouter {

    private errorHandler(error: any) {
        if (error instanceof EndorseError || error instanceof GatewayError) {
            const details = error.details.map(detail => {
                return {
                    "address": detail.address,
                    "message": detail.message,
                    "mspId": detail.mspId
                }
            });
            return ({
                "message": `${error}`,
                "details": details
            })
        }
        console.log(error);
        return ({"message": `${error}`});
    }
    public routes(app: Express) {
        app.route('/')
            .get(async (req: Request, res: Response) => {
                res.send('Typescript Node.js server');
            })
        /**
         * @swagger
         *
         * /orders:
         *   get:
         *     tags:
         *       - "Order"
         *     summary: "Get all assets"
         *     description: Return all assets
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successfull retrieval
         */
        app.route('/orders')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllAssets');
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })
        /**
         * @swagger
         *
         * /order/customer/{id}:
         *   get:
         *     tags:
         *       - "Order"
         *     summary: "Get an asset by customerId"
         *     description: Return the asset
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/order/customer/:id')
            .get(async (req: Request<{id: string}>, res: Response) => {
                let status = 200;
                let response;
                try {
                    const resultBytes = Connection.contract.evaluateTransaction('ReadAssetByCustomer', req.params.id);
                    const resultJson = utf8Decoder.decode(await resultBytes);
                    response = JSON.parse(resultJson);
                } catch (error) {
                    status = 500;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })
        /**
         * @swagger
         *
         * /order/{id}:
         *   get:
         *     tags:
         *       - "Order"
         *     summary: "Get an asset by orderId"
         *     description: Return the asset
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/order/:id')
            .get(async (req: Request<{id: string}>, res: Response) => {
                let status = 200;
                let response;
                try {
                    const resultBytes = Connection.contract.evaluateTransaction('ReadAssetByOrder', req.params.id);
                    const resultJson = utf8Decoder.decode(await resultBytes);
                    response = JSON.parse(resultJson);
                } catch (error) {
                    status = 500;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })
        /**
         * @swagger
         *
         * /order:
         *   post:
         *     tags:
         *       - "Order"
         *     summary: "Create an order"
         *     description: Create the order
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - customerId
         *             - orderId
         *             - status
         *             - price
         *           properties:
         *             customerId:
         *               type: string
         *             orderId:
         *               type: string
         *             status:
         *               type: string
         *             price:
         *               type: integer
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/order')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(OrderSchema, req.body);
                    assetInstance.createdDate = Date.now();
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));

                    await Connection.contract.submitTransaction('CreatAsset', asset);
                    response = ({"message": "Create success" })
                } catch (error) {
                    status = 400;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })
    }
}