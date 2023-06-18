import {Express, Request, Response} from "express";
import {Connection} from "../fabric/connection";
import {EndorseError, GatewayError} from "@hyperledger/fabric-gateway";
import {classToPlain, instanceToPlain, plainToClass, plainToInstance} from "class-transformer";
import {AssetSchema} from "../schema/asset.schema";
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
         * /assets:
         *   get:
         *     tags:
         *       - "Assets"
         *     summary: "Get all assets"
         *     description: Return all assets
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successfull retrieval
         */
        app.route('/assets')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllAssets');
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })
        /**
         * @swagger
         *
         * /asset/{id}:
         *   get:
         *     tags:
         *       - "Assets"
         *     summary: "Get an asset by id"
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
        app.route('/asset/:id')
            .get(async (req: Request<{id: string}>, res: Response) => {
                let status = 200;
                let response;
                try {
                    const resultBytes = Connection.contract.evaluateTransaction('ReadAsset', req.params.id);
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
         * /asset:
         *   post:
         *     tags:
         *       - "Assets"
         *     summary: "Create an asset"
         *     description: Create the asset
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - ID
         *             - AppraisedValue
         *             - Color
         *             - Owner
         *             - Size
         *             - docType
         *           properties:
         *             ID:
         *               type: string
         *             AppraisedValue:
         *               type: integer
         *             Color:
         *               type: string
         *             Owner:
         *               type: string
         *             Size:
         *               type: integer
         *             docType:
         *               type: string
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/asset')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    const assetInstance = plainToInstance(AssetSchema, req.body);
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
        /**
         * @swagger
         *
         * /asset/{id}:
         *   put:
         *     tags:
         *       - "Assets"
         *     summary: "Update an asset by id"
         *     description: Update the asset
         *     parameters:
         *       - in: path
         *         name: id
         *         description: Asset id
         *         schema:
         *           type: string
         *         required: true
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - AppraisedValue
         *             - Color
         *             - Owner
         *             - Size
         *             - docType
         *           properties:
         *             AppraisedValue:
         *               type: integer
         *             Color:
         *               type: string
         *             Owner:
         *               type: string
         *             Size:
         *               type: integer
         *             docType:
         *               type: string
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/asset/:id')
            .put(async (req: Request<{id: string}>, res: Response) => {
                let response;
                let status = 200;
                try {
                    const assetInstance = plainToInstance(AssetSchema, req.body);
                    assetInstance.ID = req.params.id;
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));
                    await Connection.contract.submitTransaction('UpdateAsset', asset);
                    status = 200;
                    response = ({"message": "Update success" })
                } catch (error) {
                    status = 500;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })
        /**
         * @swagger
         *
         * /asset/{id}:
         *   delete:
         *     tags:
         *       - "Assets"
         *     summary: "Delete an asset by id"
         *     description: Delete the asset
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
        app.route('/asset/:id')
            .delete(async (req: Request<{id: string}>, res: Response) => {
                let response;
                let status = 200;
                try {
                    await Connection.contract.submitTransaction('DeleteAsset', req.params.id);
                    response = ({"message": "Delete success"})
                } catch (error) {
                    status = 500;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })
    }
}