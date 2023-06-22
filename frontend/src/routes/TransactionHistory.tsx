import React, {FC, useEffect, useState} from "react";

interface IUser {
    userId: number
}

type UserHistory = {
    companyName: string
    contribution: number
    customerId: string
    customerName: string
    point: number
    type: string
    createdDate: number
}

const TransactionHistory: FC<IUser> = ({userId}) => {
    const [txHistory, setTxHistory] = useState<UserHistory[]>([]);
    useEffect(() => {
        const getUserTxHistory = async () => {
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}/history`);
            const data = await response.json();
            setTxHistory(data);
        }
        getUserTxHistory();
    }, [])

    return (
        <div id="contribute" className="content">
            <h2>Transaction History</h2>
            <div className="content">
                <h2>Transaction List</h2>
                <div className="transaction-list">
                    {
                        txHistory.length ?
                            txHistory.sort((a, b) => {
                                return a.createdDate - b.createdDate;
                            }).map(
                                (h, i) => {
                                    const userTx = {
                                        ...h,
                                        createdDate: (new Date(h.createdDate)).toLocaleString()
                                    }
                                    return <div key={i.toString()} className="transaction-item">
                                        {
                                            Object.entries(userTx).sort((a, b) => {
                                                if (a[0] == "type") {
                                                    return -1;
                                                }
                                                if (b[0] == "type") {
                                                    return 1;
                                                }
                                                return a[0].localeCompare(b[0]);
                                            }).map(([key, val]) => {
                                                return `${key}: ${val}`;
                                            }).join(" | ")
                                        }
                                    </div>
                                }
                            ) : <div className="transaction-item">No History.</div>
                    }
                </div>
            </div>
        </div>
    )
}

export default TransactionHistory;