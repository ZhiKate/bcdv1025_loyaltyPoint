/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from "fabric-contract-api";

@Object()
export class UserPoint {
    @Property()
    public customerId: string;

    @Property()
    public customerName: string;

    @Property()
    public companyName: string;

    @Property()
    public contribution: number;

    @Property()
    public point: number;

    @Property()
    public createdDate: number;
}

@Object()
export class PointPool {
    @Property()
    public total: number;
}