import express, {Express} from 'express';
import {AssetRouter} from "./routes/assets";
import * as dotenv from 'dotenv';
import {Connection} from "./fabric/connection";
import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from "./swagger";

class App {
    public app: Express;
    public assetRouter: AssetRouter = new AssetRouter();

    constructor() {
        new Connection().init();
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerSpec)
        );
        this.assetRouter.routes(this.app);
        dotenv.config();
    }
}

export default new App().app;