import React, {FC, useState} from "react";

interface IUser {
    userId: number
    updateTotalPoints: (value: number) => void
}

const TradePoints: FC<IUser> = ({userId, updateTotalPoints}) => {
    const [amount, setAmount] = useState<number>(0);
    const [company, setCompany] = useState<string>("");
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

        const response = await fetch('http://127.0.0.1:8000/user/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: userId.toString(),
                companyName: company,
                point: Number(amount)
            })
        })
        const data = await response.json();
        if (response.status === 200) {
            updateTotalPoints(data.total)
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
                <input type="text" className="form-control mb-2" placeholder="Enter companyname" onChange={setCompanyName}/>
                <input type="text" className="form-control mb-2" placeholder="Enter your trade point" onChange={setValue}/>
                <button className="btn btn-primary" onClick={submit}>Contribute</button>
            </div>
        </div>
    )
}

export default TradePoints;