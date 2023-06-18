import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Chaincode app",
            version: "1.0.0",
            description: "chaincode dapp"
        },
        basePath: '/'
    },
    apis: ["./dist/routes/*.js"]
}
export const swaggerSpec = swaggerJSDoc(swaggerOptions);