import {Context, Contract, Info, Returns, Transaction} from "fabric-contract-api";
import {PointPool, UserPoint} from "./asset";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";

const utf8Decoder = new TextDecoder();

@Info({title: "AssetTransfer", description: "Smart contract for trading assets"})
export class AssetTransferContract extends Contract {
    USER_KEY = "USER_POOL"
    POOL_KEY = "POINT_POOL"
    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const pointAssets: UserPoint[] = [
            {
                customerId: "1",
                customerName: "Anna",
                companyName: "StarBucks",
                contribution: 0,
                point: 40,
            },
            {
                customerId: "2",
                customerName: "Mr. Oh",
                companyName: "Loblaws",
                contribution: 20,
                point: 10,
            },
            {
                customerId: "2",
                customerName: "Mr. Oh",
                companyName: "TimHortons",
                contribution: 0,
                point: 40,
            },
            {
                customerId: "3",
                customerName: "Kyle",
                companyName: "TimHortons",
                contribution: 10,
                point: 50,
            },
        ];

        for (const asset of pointAssets) {
            const key = ctx.stub.createCompositeKey(this.USER_KEY, [asset.customerId, asset.companyName]);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }

        const pointPool: PointPool = {total: 30}
        await ctx.stub.putState(this.POOL_KEY, Buffer.from(stringify(sortKeysRecursive(pointPool))));
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllContribution(ctx: Context): Promise<string> {
        const assetJSON = await ctx.stub.getState(this.POOL_KEY);
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllUserPoints(ctx: Context): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.USER_KEY, []);
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
    @Returns("string")
    public async GetUserPoints(ctx: Context, id: string): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.USER_KEY, [id]);
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
    @Returns("boolean")
    public async AssetExists(ctx: Context, id: string): Promise<[Uint8Array, boolean]> {
        const assetJSON = await ctx.stub.getState(id);
        return [assetJSON, assetJSON && assetJSON.length > 0];
    }

    @Transaction()
    public async CreatUserPoint(
        ctx: Context, asset: string
    ): Promise<void> {
        const data: UserPoint = JSON.parse(asset);
        const key = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyName]);
        const [userPoint, exists] = await this.AssetExists(ctx, key);
        if (exists) {
            throw new Error(`The asset ${data.customerId} and ${data.companyName} already exists`);
        }

        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
    }

    @Transaction()
    public async UpdateUserPoint(
        ctx: Context, asset: string
    ): Promise<void> {
        const data = JSON.parse(asset);
        const key = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyName]);
        const [result, exists] = await this.AssetExists(ctx, key);
        if (!exists) {
            throw new Error(`The asset ${data.customerId} and ${data.companyName} does not exist`);
        }
        const userPoint = JSON.parse(utf8Decoder.decode(result));
        userPoint.point += data.point;
        return ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));
    }

    @Transaction()
    public async LiquidUserPoint(
        ctx: Context, asset: string
    ): Promise<void> {
        const data = JSON.parse(asset);
        const key = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyName]);
        const [result, exists] = await this.AssetExists(ctx, key);
        if (!exists) {
            throw new Error(`The asset ${data.customerId} and ${data.companyName} does not exist`);
        }

        const userPoint = JSON.parse(utf8Decoder.decode(result));
        if (userPoint.point < data.contribution) {
            throw new Error('You can not contribute more than the point you hold.');
        }
        userPoint.point -= data.contribution;
        userPoint.contribution += data.contribution;
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));

        const pool = await ctx.stub.getState(this.POOL_KEY);
        const liquidityPool = JSON.parse(utf8Decoder.decode(pool));
        liquidityPool.total += data.contribution;
        await ctx.stub.putState(this.POOL_KEY, Buffer.from(stringify(sortKeysRecursive(liquidityPool))));
    }

    @Transaction()
    public async BorrowUserPoint(
        ctx: Context, asset: string
    ): Promise<void> {
        const data = JSON.parse(asset);
        const key = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyName]);
        const [result, exists] = await this.AssetExists(ctx, key);
        if (!exists) {
            throw new Error(`The asset ${data.customerId} and ${data.companyName} does not exist`);
        }

        const userPoint = JSON.parse(utf8Decoder.decode(result));
        if (userPoint.contribution < data.point) {
            throw new Error('You can not burrow point more than your contribution.');
        }
        userPoint.contribution -= data.point;
        userPoint.point += data.point;
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));

        const pool = await ctx.stub.getState(this.POOL_KEY);
        const liquidityPool = JSON.parse(utf8Decoder.decode(pool));
        liquidityPool.total -= data.point;
        await ctx.stub.putState(this.POOL_KEY, Buffer.from(stringify(sortKeysRecursive(liquidityPool))));
    }
}