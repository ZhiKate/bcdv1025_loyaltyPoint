import {Context, Contract, Info, Returns, Transaction} from "fabric-contract-api";
import {Order} from "./asset";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";

@Info({title: "AssetTransfer", description: "Smart contract for trading assets"})
export class AssetTransferContract extends Contract {
    KEY_PREFIX = "idx";
    private getCompositeKey(ctx: Context, customerId: string, orderId: string, status: string): string {
        return ctx.stub.createCompositeKey(
            this.KEY_PREFIX, [customerId, orderId, status]
        );
    }

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const ondDay = 60*60*24*1000;
        const now = 1687200377255; // 2023-06-19 14:46:00
        const orderAssets: Order[] = [
            {
                customerId: "1",
                orderId: "1",
                status: "COMPLETE",
                price: 100,
                createdDate: 1687200377255 - 2*ondDay,
            },
            {
                customerId: "1",
                orderId: "1",
                status: "REQUEST_REFUND",
                price: 100,
                createdDate: 1687200377255 - ondDay,
            },
            {
                customerId: "1",
                orderId: "1",
                status: "COMPLETE_REFUND",
                price: 100,
                createdDate: 1687200377255 - ondDay,
            },
            {
                customerId: "2",
                orderId: "2",
                status: "COMPLETE",
                price: 150,
                createdDate: 1687200377255 - ondDay,
            },
            {
                customerId: "3",
                orderId: "3",
                status: "COMPLETE",
                price: 200,
                createdDate: 1687200377255 - ondDay,
            },
        ];

        for (const asset of orderAssets) {
            const key = this.getCompositeKey(ctx, asset.customerId, asset.orderId, asset.status);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.log(`Asset ${asset.orderId} initialized`);
        }
    }

    @Transaction(false)
    @Returns("boolean")
    private async AssetExists(ctx: Context, customerId: string, orderId: string, status: string): Promise<boolean> {
        const key = this.getCompositeKey(ctx, customerId, orderId, status);
        const assetJSON = await ctx.stub.getState(key);
        return assetJSON && assetJSON.length > 0;
    }

    @Transaction()
    public async CreatAsset(
        ctx: Context, asset: string
    ): Promise<void> {
        const data: Order = JSON.parse(asset);
        const exists = await this.AssetExists(ctx, data.customerId, data.orderId, data.status);
        if (exists) {
            throw new Error(`The asset ${data.customerId}, ${data.orderId}, and ${data.status} pair of data already exists`);
        }
        const key = this.getCompositeKey(ctx, data.customerId, data.orderId, data.status);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
    }

    private async getAllResults(iterator): Promise<string> {
        const allResults = [];
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString("utf8");
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    @Transaction(false)
    public async ReadAssetByCustomer(ctx: Context, id: string): Promise<string> {
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.KEY_PREFIX, [id]);
        if (!iterator || iterator == null) {
            throw new Error(`the asset ${id} does not exist`);
        }
        return this.getAllResults(iterator);
    }

    @Transaction(false)
    public async ReadAssetByOrder(ctx: Context, id: string): Promise<string> {
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.KEY_PREFIX, [id]);
        if (!iterator || iterator == null) {
            throw new Error(`the asset ${id} does not exist`);
        }
        return this.getAllResults(iterator);
    }

    @Transaction(false)
    public async ReadAssetByKey(ctx: Context, customerId: string, orderId: string, status: string): Promise<string> {
        const key = this.getCompositeKey(ctx, customerId, orderId, status);
        const assetJSON = await ctx.stub.getState(key);
        if (!assetJSON || assetJSON.length == 0) {
            throw new Error(`the asset ${key} does not exist`);
        }
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllAssets(ctx: Context): Promise<string> {
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.KEY_PREFIX, []);
        return this.getAllResults(iterator);
    }
}