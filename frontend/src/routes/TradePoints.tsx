import React, {FC, useState} from "react";

interface IUser {
    userId: number
    updateTotalTimhortonPoints: (value: number) => void
    updateTotalStarbucksPoints: (value: number) => void
    updateTotalPcoptimumPoints: (value: number) => void
}

const TradePoints: FC<IUser> = ({userId, updateTotalTimhortonPoints, updateTotalStarbucksPoints, updateTotalPcoptimumPoints}) => {
    const [amountFrom, setAmountFrom] = useState<number>(0);
    const [companyFrom, setCompanyFrom] = useState<string>("timhorton");
    const [amountTo, setAmountTo] = useState<number>(0);
    const [companyTo, setCompanyTo] = useState<string>("timhorton");
    const setValueFrom = (e: any) => {
        setAmountFrom(e.currentTarget.value);
    }

    const setValueTo = (e: any) => {
        setAmountTo(e.currentTarget.value);
    }

    const setCompanyNameFrom = (e: any) => {
        setCompanyFrom(e.currentTarget.value)
    }

    const setCompanyNameTo = (e: any) => {
        setCompanyTo(e.currentTarget.value)
    }


    const submit = async () => {
        if (amountFrom == 0) {
            alert("Please enter amount.")
            return;
        }
        console.log(companyFrom)
        console.log(amountFrom)
        console.log(companyTo)
        console.log(amountTo)
        const response = await fetch('http://127.0.0.1:8000/user/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: userId.toString(),
                companyNameFrom: companyFrom,
                pointFrom: Number(amountFrom),
                companyNameTo: companyTo,
                pointTo: Number(amountTo)
            })
        })
        const data = await response.json();
        if (response.status === 200) {
            if (data.timhortontotal) {
                updateTotalTimhortonPoints(data.timhortontotal)
            }
            if (data.starbuckstotal) {
                updateTotalStarbucksPoints(data.starbuckstotal)
            }
            if (data.loblawstotal) {
                updateTotalPcoptimumPoints(data.loblawstotal)
            }
            if (data.shopperstotal) {
                updateTotalPcoptimumPoints(data.shopperstotal)
            }
            alert('Contribution success.');
        } else {
            alert('Contribution failed.');
            console.log(data);
        }

    }

    return (
        <div id="contribute" className="content">
            <h2>Trade Loyalty Points</h2>
            <div>
                <h2>FROM</h2>
                    <select id="companyFrom" onChange={setCompanyNameFrom}>
                        <option value="timhorton">Timhorton</option>
                        <option value="starbucks">Starbucks</option>
                        <option value="loblaws">Loblaws</option>
                        <option value="shoppers">Shoppers</option>
                    </select>
                    <input type="text" className="form-control mb-2" placeholder="Enter your trade point" onChange={setValueFrom}/>
                <h2>TO</h2>
                    <select id="companyTo" onChange={setCompanyNameTo}>
                        <option value="timhorton">Timhorton</option>
                        <option value="starbucks">Starbucks</option>
                        <option value="loblaws">Loblaws</option>
                        <option value="shoppers">Shoppers</option>
                    </select>
                    <input type="text" className="form-control mb-2" placeholder="Enter your trade point" onChange={setValueTo}/>
                <button className="btn btn-primary" onClick={submit}>Trade</button>
            </div>
        </div>
    )
}

export default TradePoints;