import {Express, Request, Response} from "express";
import {Connection} from "../fabric/connection";
import {EndorseError, GatewayError} from "@hyperledger/fabric-gateway";
import {instanceToPlain, plainToInstance} from "class-transformer";
import {ContributePointSchema, CreatePointSchema, UpdatePointSchema} from "../schema/asset.schema";
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
         * /contribution:
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
        app.route('/contribution')
            .get(async (req: Request, res: Response) => {
                const resultBytes = Connection.contract.evaluateTransaction('GetAllContribution');
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
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));
                    await Connection.contract.submitTransaction('LiquidUserPoint', asset);

                    const resultBytes = Connection.contract.evaluateTransaction('GetAllContribution');
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
         * /user/borrow:
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
        app.route('/user/borrow')
            .post(async (req: Request, res: Response) => {
                let response;
                let status = 200;
                try {
                    let assetInstance = plainToInstance(UpdatePointSchema, req.body);
                    const validateError: ValidationError[] = await validate(assetInstance);
                    if (validateError.length > 0) {
                        res.status(400).send(validateError[0].constraints);
                        return;
                    }
                    const asset = JSON.stringify(instanceToPlain(assetInstance));

                    await Connection.contract.submitTransaction('BorrowUserPoint', asset);

                    const resultBytes = Connection.contract.evaluateTransaction('GetAllContribution');
                    const resultJson = utf8Decoder.decode(await resultBytes);
                    const result = JSON.parse(resultJson);
                    response = ({"message": "Borrow success", "total": result.total })
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
    }
}