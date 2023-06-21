import React, {FC, useEffect, useReducer, useState} from 'react';

interface IUser {
    userId: number
}

type UserPoint = {
    companyName: string
    contribution: number
    customerId: string
    customerName: string
    point: number
}

const MyLoyaltyPoint: FC<IUser> = ({userId}) => {
    const [userPoints, setUserPoints] = useState<UserPoint[]>([]);
    useEffect(() => {
        const getUserPoints = async () => {
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}/point`);
            const data = await response.json();
            setUserPoints(data);
        }
        getUserPoints();
    }, [])

    return (
        <div id="contribute" className="content">
            <h2>My Loyalty Points</h2>
            <div className="transaction-list">
                {
                    userPoints.length ?
                        userPoints.map(
                            (point, i) => {
                                return <div key={i.toString()} className="transaction-item">{point.customerName} | {point.companyName} | {point.point} points | {point.contribution} contribute </div>
                            }
                        ) : <div className="transaction-item">No points.</div>
                }
            </div>
        </div>
    )
}

export default MyLoyaltyPoint;