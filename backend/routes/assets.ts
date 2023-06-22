import {Express, Request, Response} from "express";
import {Connection} from "../fabric/connection";
import {EndorseError, GatewayError} from "@hyperledger/fabric-gateway";
import {instanceToPlain, plainToInstance} from "class-transformer";
import {ContributePointSchema, CreatePointSchema, TradePointSchema, UpdatePointSchema} from "../schema/asset.schema";
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
         * /timhorton/contribution:
         *   get:
         *     tags:
         *       - "Contribution"
         *     summary: "Get total contribution"
         *     description: Get total contribution
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/timhorton/contribution')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllTimhortonContribution');
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
        })

        /**
         * @swagger
         *
         * /starbucks/contribution:
         *   get:
         *     tags:
         *       - "Contribution"
         *     summary: "Get total contribution"
         *     description: Get total contribution
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/starbucks/contribution')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllStarbucksContribution');
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })

        /**
         * @swagger
         *
         * /pcoptimum/contribution:
         *   get:
         *     tags:
         *       - "Contribution"
         *     summary: "Get total contribution"
         *     description: Get total contribution
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/pcoptimum/contribution')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllPcoptimumContribution');
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })

        /**
         * @swagger
         *
         * /user/contribution:
         *   post:
         *     tags:
         *       - "Contribution"
         *     summary: "Liquid user point"
         *     description: Liquid user point
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - customerId
         *             - companyName
         *             - contribution
         *           properties:
         *             customerId:
         *               type: string
         *             companyName:
         *               type: string
         *             contribution:
         *               type: integer
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/user/contribution')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(ContributePointSchema, req.body);
                    assetInstance.createdDate = Date.now();
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));
                    await Connection.contract.submitTransaction('LiquidUserPoint', asset);

                    let resultBytes;
                    if (assetInstance.companyName == "timhorton") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllTimhortonContribution');
                    } else if (assetInstance.companyName == "starbucks") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllStarbucksContribution');
                    } else if (assetInstance.companyName == "loblaws" || assetInstance.companyName == "shoppers") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllPcoptimumContribution');
                    }
                    const resultJson = utf8Decoder.decode(await resultBytes);
                    const result = JSON.parse(resultJson);

                    response = ({"message": "Liquidity success", "total": result.total})
                } catch (error) {
                    status = 400;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })

        /**
         * @swagger
         *
         * /user/trade:
         *   post:
         *     tags:
         *       - "Contribution"
         *     summary: "Borrow user point"
         *     description: Borrow user point
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - customerId
         *             - companyNameFrom
         *             - pointFrom
         *             - companyNameTo
         *             - pointTo
         *           properties:
         *             customerId:
         *               type: string
         *             companyNameFrom:
         *               type: string
         *             pointFrom:
         *               type: integer
         *             companyNameTo:
         *               type: string
         *             pointTo:
         *               type: integer
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/user/trade')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(TradePointSchema, req.body);
                    assetInstance.createdDate = Date.now();;
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));

                    await Connection.contract.submitTransaction('TradeUserPoint', asset);

                    let resultBytes;
                    let responseData: Record<string, any> = {"message": "Borrow success"}
                    if (assetInstance.companyNameFrom == "timhorton") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllTimhortonContribution');
                    } else if (assetInstance.companyNameFrom == "starbucks") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllStarbucksContribution');
                    } else if (assetInstance.companyNameFrom == "loblaws" || assetInstance.companyNameFrom == "shoppers") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllPcoptimumContribution');
                    }
                    let resultJson = utf8Decoder.decode(await resultBytes);
                    let result = JSON.parse(resultJson);
                    let totalKey = assetInstance.companyNameFrom + "total";
                    responseData[totalKey] = result.total;

                    if (assetInstance.companyNameTo == "timhorton") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllTimhortonContribution');
                    } else if (assetInstance.companyNameTo == "starbucks") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllStarbucksContribution');
                    } else if (assetInstance.companyNameTo == "loblaws" || assetInstance.companyNameTo == "shoppers") {
                        resultBytes = Connection.contract.evaluateTransaction('GetAllPcoptimumContribution');
                    }
                    resultJson = utf8Decoder.decode(await resultBytes);
                    result = JSON.parse(resultJson);
                    totalKey = assetInstance.companyNameTo + "total";
                    responseData[totalKey] = result.total;
                    response = (responseData)
                } catch (error) {
                    status = 400;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })

        /**
         * @swagger
         *
         * /users/point:
         *   get:
         *     tags:
         *       - "Point"
         *     summary: "Get all users with their point information"
         *     description: Get all users
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Successful retrieval
         */
        app.route('/users/point')
            .get(async (req: Request, res: Response) => {
            const resultBytes = Connection.contract.evaluateTransaction('GetAllUserPoints');
            const resultJson = utf8Decoder.decode(await resultBytes);
            const result = JSON.parse(resultJson);
            res.send(result);
        })

        /**
         * @swagger
         *
         * /users/{id}/point:
         *   get:
         *     tags:
         *       - "Point"
         *     summary: "Get user's point information"
         *     description: Get user point information
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
        app.route('/users/:id/point')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetUserPoints', req.params.id);
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })

        /**
         * @swagger
         *
         * /user/point:
         *   put:
         *     tags:
         *       - "Point"
         *     summary: "Update user point"
         *     description: Update user point
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - customerId
         *             - companyName
         *             - point
         *           properties:
         *             customerId:
         *               type: string
         *             companyName:
         *               type: string
         *             point:
         *               type: integer
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/user/point')
            .put(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(UpdatePointSchema, req.body);
                    assetInstance.createdDate = Date.now()
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));

                    await Connection.contract.submitTransaction('UpdateUserPoint', asset);
                    response = ({"message": "Update success" })
                } catch (error) {
                    status = 400;
                    response = this.errorHandler(error);
                }
                res.status(status).send(response);
            })

        /**
         * @swagger
         *
         * /user/point:
         *   post:
         *     tags:
         *       - "Point"
         *     summary: "Create user point"
         *     description: Create user point
         *     parameters:
         *       - in: body
         *         name: body
         *         description: Asset data
         *         schema:
         *           type: object
         *           required:
         *             - customerId
         *             - customerName
         *             - companyName
         *             - point
         *           properties:
         *             customerId:
         *               type: string
         *             customerName:
         *               type: string
         *             companyName:
         *               type: string
         *             point:
         *               type: integer
         *     produces:
         *       - application/json
         *     responses:
         *       200:
         *         description: Success
         */
        app.route('/user/point')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(CreatePointSchema, req.body);
                    assetInstance.contribution = 0;
                    assetInstance.createdDate = Date.now();
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));

                    await Connection.contract.submitTransaction('CreatUserPoint', asset);
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
         * /users/{id}/history:
         *   get:
         *     tags:
         *       - "Point"
         *     summary: "Get user's point history"
         *     description: Get user point history
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
        app.route('/users/:id/history')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetUserTxHistory', req.params.id);
                const resultJson = utf8Decoder.decode(await resultBytes);
                const result = JSON.parse(resultJson);
                res.send(result);
            })
    }
}