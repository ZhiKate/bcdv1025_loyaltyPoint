import {Context, Contract, Info, Returns, Transaction} from "fabric-contract-api";
import {Asset} from "./asset";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";

@Info({title: "AssetTransfer", description: "Smart contract for trading assets"})
export class AssetTransferContract extends Contract {
    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const assets: Asset[] = [
            {
                ID: "asset1",
                Color: "blue",
                Size: 5,
                Owner: "Tomoko",
                AppraisedValue: 300,
            },
            {
                ID: "asset2",
                Color: "red",
                Size: 5,
                Owner: "Brad",
                AppraisedValue: 400,
            },
            {
                ID: "asset3",
                Color: "greend",
                Size: 10,
                Owner: "Jin Soo",
                AppraisedValue: 500,
            },
            {
                ID: "asset4",
                Color: "black",
                Size: 15,
                Owner: "Adriana",
                AppraisedValue: 700,
            },
            {
                ID: "asset6",
                Color: "white",
                Size: 15,
                Owner: "Michel",
                AppraisedValue: 800,
            }
        ];

        for (const asset of assets) {
            asset.docType = "asset";
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.log(`Asset ${asset.ID} initialized`);
        }
    }

    @Transaction(false)
    @Returns("boolean")
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length == 0) {
            throw new Error(`the asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // When test update chaincode
    @Transaction(false)
    public async UpdateChaincodeTest(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length == 0) {
            throw new Error(`the asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    @Transaction()
    public async CreatAsset(
        ctx: Context, asset: string
    ): Promise<void> {
        const data: Asset = JSON.parse(asset);
        const exists = await this.AssetExists(ctx, data.ID);
        if (exists) {
            throw new Error(`The asset ${data.ID} already exists`);
        }

        await ctx.stub.putState(data.ID, Buffer.from(stringify(sortKeysRecursive(data))));
    }

    @Transaction()
    public async UpdateAsset(
        ctx: Context, asset: string
    ): Promise<void> {
        const data: Asset = JSON.parse(asset);
        const exists = await this.AssetExists(ctx, data.ID);
        if (!exists) {
            throw new Error(`The asset ${data.ID} does not exist`);
        }
        return ctx.stub.putState(data.ID, Buffer.from(stringify(sortKeysRecursive(data))));
    }

    @Transaction()
    public async DeleteAsset(ctx: Context, id: string): Promise<void> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    @Transaction()
    public async TransferAsset(ctx: Context, id: string, newOwner: string): Promise<string> {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
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
}