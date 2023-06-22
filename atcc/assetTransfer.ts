import {Context, Contract, Info, Returns, Transaction} from "fabric-contract-api";
import {PointPool, UserPoint} from "./asset";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import {loblawsAssets, shoppersAssets, starbucksAssets, timhortonsAssets, txHistoryAssets} from "./mockData";

const utf8Decoder = new TextDecoder();

@Info({title: "AssetTransfer", description: "Smart contract for trading assets"})
export class AssetTransferContract extends Contract {
    USER_KEY = "USER_POOL"
    TIMHORTON_KEY = "TIMHORTON_POOL"
    STARBUCKS_KEY = "STARBUCKS_POOL"
    PCOPTIMUM_KEY = "PCOPTIMUM_POOL"
    HISTORY_KEY = "HISTORY_POOL"
    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const starbucks: UserPoint[] = starbucksAssets;
        for (const asset of starbucks) {
            const key = ctx.stub.createCompositeKey(this.USER_KEY, [asset.customerId, asset.companyName]);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        const loblaws: UserPoint[] = loblawsAssets;
        for (const asset of loblaws) {
            const key = ctx.stub.createCompositeKey(this.USER_KEY, [asset.customerId, asset.companyName]);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        const timhortons: UserPoint[] = timhortonsAssets;
        for (const asset of timhortons) {
            const key = ctx.stub.createCompositeKey(this.USER_KEY, [asset.customerId, asset.companyName]);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        const shoppers: UserPoint[] = shoppersAssets;
        for (const asset of shoppers) {
            const key = ctx.stub.createCompositeKey(this.USER_KEY, [asset.customerId, asset.companyName]);
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }

        const history = txHistoryAssets;
        let i = 0
        for (const asset of history) {
            const key = ctx.stub.createCompositeKey(this.HISTORY_KEY, [asset.customerId, "-", i.toString()])
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(asset))));
            i += 1;
        }

        const timhortonPool: PointPool = {total: 10}
        await ctx.stub.putState(this.TIMHORTON_KEY, Buffer.from(stringify(sortKeysRecursive(timhortonPool))));

        const pcoptimumPool: PointPool = {total: 40}
        await ctx.stub.putState(this.PCOPTIMUM_KEY, Buffer.from(stringify(sortKeysRecursive(pcoptimumPool))));

        const starbucksPool: PointPool = {total: 10}
        await ctx.stub.putState(this.STARBUCKS_KEY, Buffer.from(stringify(sortKeysRecursive(starbucksPool))));
    }

    private async getAllResult(iterator) {
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
    @Returns("string")
    public async GetAllTimhortonContribution(ctx: Context): Promise<string> {
        const assetJSON = await ctx.stub.getState(this.TIMHORTON_KEY);
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllStarbucksContribution(ctx: Context): Promise<string> {
        const assetJSON = await ctx.stub.getState(this.STARBUCKS_KEY);
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllPcoptimumContribution(ctx: Context): Promise<string> {
        const assetJSON = await ctx.stub.getState(this.PCOPTIMUM_KEY);
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("string")
    public async GetAllUserPoints(ctx: Context): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.USER_KEY, []);
        return this.getAllResult(iterator);
    }

    @Transaction(false)
    @Returns("string")
    public async GetUserPoints(ctx: Context, id: string): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.USER_KEY, [id]);
        return this.getAllResult(iterator);
    }

    @Transaction(false)
    @Returns("string")
    public async GetUserTxHistory(ctx: Context, id: string): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByPartialCompositeKey(this.HISTORY_KEY, [id, "-"]);
        return this.getAllResult(iterator);
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
        const historyKey = ctx.stub.createCompositeKey(this.HISTORY_KEY, [data.customerId, "-", data.createdDate.toString()])
        const history = {
            ...data,
            type: "create"
        }
        await ctx.stub.putState(historyKey, Buffer.from(stringify(sortKeysRecursive(history))));
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
        userPoint.point += Number(data.point);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));
        const historyKey = ctx.stub.createCompositeKey(this.HISTORY_KEY, [data.customerId, "-", data.createdDate.toString()])
        const history = {
            ...data,
            type: "update"
        }
        await ctx.stub.putState(historyKey, Buffer.from(stringify(sortKeysRecursive(history))));
    }

    private getPoolKey(company: string) {
        if (company.toLowerCase() == "starbucks") {
            return this.STARBUCKS_KEY
        } else if (company.toLowerCase() == "loblaws") {
            return this.PCOPTIMUM_KEY
        } else if (company.toLowerCase() == "timhorton") {
            return this.TIMHORTON_KEY
        } else if (company.toLowerCase() == "shoppers") {
            return this.PCOPTIMUM_KEY
        }
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
        userPoint.point -= Number(data.contribution);
        userPoint.contribution += Number(data.contribution);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));
        const historyKey = ctx.stub.createCompositeKey(this.HISTORY_KEY, [data.customerId, "-", data.createdDate.toString()])
        const history = {
            ...data,
            type: "contribute"
        }
        await ctx.stub.putState(historyKey, Buffer.from(stringify(sortKeysRecursive(history))));

        const poolKey = this.getPoolKey(data.companyName);
        const pool = await ctx.stub.getState(poolKey);
        const liquidityPool = JSON.parse(utf8Decoder.decode(pool));
        liquidityPool.total += Number(data.contribution);
        await ctx.stub.putState(poolKey, Buffer.from(stringify(sortKeysRecursive(liquidityPool))));
    }

    @Transaction()
    public async TradeUserPoint(
        ctx: Context, asset: string
    ): Promise<void> {
        const data = JSON.parse(asset);
        const key = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyNameFrom]);
        const [result, exists] = await this.AssetExists(ctx, key);
        if (!exists) {
            throw new Error(`The asset ${data.customerId} and ${data.companyNameFrom} does not exist`);
        }

        const userPoint = JSON.parse(utf8Decoder.decode(result));
        if (userPoint.contribution < data.pointFrom) {
            throw new Error('You can not trade point more than your contribution.');
        }

        const keyTo = ctx.stub.createCompositeKey(this.USER_KEY, [data.customerId, data.companyNameTo]);
        const [resultTo, existsTo] = await this.AssetExists(ctx, keyTo);
        if (!existsTo) {
            throw new Error(`The asset ${data.customerId} and ${data.companyNameTo} does not exist`);
        }

        // Point reduce
        userPoint.point -= Number(data.pointFrom);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(userPoint))));
        // Point is added to the company pool that User wants to get the point.
        const poolKey = this.getPoolKey(data.companyNameTo);
        const pool = await ctx.stub.getState(poolKey);
        const liquidityPool = JSON.parse(utf8Decoder.decode(pool));
        liquidityPool.total += Number(data.pointFrom);
        liquidityPool.total -= Number(data.pointTo)
        await ctx.stub.putState(poolKey, Buffer.from(stringify(sortKeysRecursive(liquidityPool))));

        let userToPoint = JSON.parse(utf8Decoder.decode(resultTo));
        userToPoint.point += Number(data.pointTo)
        userToPoint.contribution += Number(data.pointFrom);
        userToPoint.contribution -= Number(data.pointTo);
        await ctx.stub.putState(keyTo, Buffer.from(stringify(sortKeysRecursive(userToPoint))));
        const historyKey = ctx.stub.createCompositeKey(this.HISTORY_KEY, [data.customerId, "-", data.createdDate.toString()])
        const history = {
            ...data,
            type: "trade"
        }
        await ctx.stub.putState(historyKey, Buffer.from(stringify(sortKeysRecursive(history))));
    }
}