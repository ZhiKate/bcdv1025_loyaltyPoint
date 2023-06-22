import React, {FC, useState} from 'react';

interface IUser {
    userId: number
    updateTotalTimhortonPoints: (value: number) => void
    updateTotalStarbucksPoints: (value: number) => void
    updateTotalPcoptimumPoints: (value: number) => void
}

const ContributePoints: FC<IUser> = ({userId, updateTotalTimhortonPoints, updateTotalStarbucksPoints, updateTotalPcoptimumPoints}) => {
    const [amount, setAmount] = useState<number>(0);
    const [company, setCompany] = useState<string>("timhorton");
    const setValue = (e: any) => {
        setAmount(e.currentTarget.value);
    }
    const setCompanyName = (e: any) => {
        setCompany(e.currentTarget.value)
    }


    const submit = async () => {
        if (amount == 0) {
            alert("Please enter amount.")
            return;
        }

        const response = await fetch('http://127.0.0.1:8000/user/contribution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: userId.toString(),
                companyName: company,
                contribution: amount
            })
        })
        const data = await response.json();
        if (response.status === 200) {
            if (company == "timhorton") {
                updateTotalTimhortonPoints(data.total)
            } else if (company == "starbucks") {
                updateTotalStarbucksPoints(data.total)
            } else if (company == "loblaws" || company == "shoppers") {
                updateTotalPcoptimumPoints(data.total)
            }
            alert('Contribution success.');
        } else {
            alert('Contribution failed.');
            console.log(data);
        }

    }
    return (
        <div id="contribute" className="content">
            <h2>Contribute Loyalty Points</h2>
            <div>
                {/*<input type="text" className="form-control mb-2" placeholder="Enter companyname" onChange={setCompanyName}/>*/}
                <select id="company" onChange={setCompanyName}>
                    <option value="timhorton">Timhorton</option>
                    <option value="starbucks">Starbucks</option>
                    <option value="loblaws">Loblaws</option>
                    <option value="shoppers">Shoppers</option>
                </select>
                <input type="text" className="form-control mb-2" placeholder="Enter your contribution" onChange={setValue}/>
                <button className="btn btn-primary" onClick={submit}>Contribute</button>
            </div>
        </div>
    )
}

export default ContributePoints;