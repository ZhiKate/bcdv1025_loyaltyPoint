/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from "fabric-contract-api";

@Object()
export class Order {
    @Property()
    public orderId: string;

    @Property()
    public customerId: string;

    @Property()
    public price: number;

    @Property()
    public status: string;

    @Property()
    public createdDate: number;
}