import React, {useEffect, useState} from 'react';
import './App.css';
import { Route, Routes } from "react-router-dom";
import MyLoyaltyPoint from "./routes/MyLoyaltyPoint";
import Layout from "./navigation/Layout";
import ContributePoints from "./routes/ContributePoints";
import TradePoints from "./routes/TradePoints";
import TransactionHistory from "./routes/TransactionHistory";

function App() {
    const [totalTimhortonPoolPoints, setTotalTimhortonPoolPoints] = useState<number>(0);
    const [totalStarbucksPoolPoints, setTotalStarbucksPoolPoints] = useState<number>(0);
    const [totalPcoptimumPoolPoints, setTotalPcoptimumPoolPoints] = useState<number>(0);

    const userId: number = 2;
    useEffect(() => {
        const getTotalPoolPoints = async () => {
            let response = await fetch('http://127.0.0.1:8000/timhorton/contribution');
            let data = await response.json();
            setTotalTimhortonPoolPoints(data.total);
        }
        getTotalPoolPoints();

    }, [totalTimhortonPoolPoints])

    useEffect(() => {
        const getTotalPoolPoints = async () => {
            const response = await fetch('http://127.0.0.1:8000/starbucks/contribution');
            const data = await response.json();
            setTotalStarbucksPoolPoints(data.total);
        }
        getTotalPoolPoints();
    }, [totalStarbucksPoolPoints])

    useEffect(() => {
        const getTotalPoolPoints = async () => {
            const response = await fetch('http://127.0.0.1:8000/pcoptimum/contribution');
            const data = await response.json();
            setTotalPcoptimumPoolPoints(data.total);
        }
        getTotalPoolPoints();
    }, [totalPcoptimumPoolPoints])

    const updateTotalTimhortonPoints = async (value: number) => {
        setTotalTimhortonPoolPoints(value);
    }

    const updateTotalStarbucksPoints = async (value: number) => {
        setTotalStarbucksPoolPoints(value);
    }

    const updateTotalPcoptimumPoints = async (value: number) => {
        setTotalPcoptimumPoolPoints(value);
    }
  return (
      <>
        <header>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h1>Loyalty Points Pooling</h1>
              </div>
              <div className="col-md-6 text-md-right wallet">
                  <p>Total Timhorton Pool Points: <span id="demo">{totalTimhortonPoolPoints}</span></p>
                  <p>Total Starbucks Pool Points: <span id="demo">{totalStarbucksPoolPoints}</span></p>
                  <p>Total Pcoptimum Pool Points: <span id="demo">{totalPcoptimumPoolPoints}</span></p>
              </div>
            </div>
          </div>
        </header>
      <Routes>
          <Route path="/" element={<Layout />}>
              <Route index path="/MyLoyaltyPoint" element={<MyLoyaltyPoint userId={userId}/>}/>
              <Route path="/ContributePoints"
                     element={<ContributePoints userId={userId}
                                                updateTotalTimhortonPoints={updateTotalTimhortonPoints}
                                                updateTotalStarbucksPoints={updateTotalStarbucksPoints}
                                                updateTotalPcoptimumPoints={updateTotalPcoptimumPoints}
                     />}
              />
              <Route path="/TradePoints"
                     element={<TradePoints userId={userId}
                                           updateTotalTimhortonPoints={updateTotalTimhortonPoints}
                                           updateTotalStarbucksPoints={updateTotalStarbucksPoints}
                                           updateTotalPcoptimumPoints={updateTotalPcoptimumPoints}
                     />}/>
              <Route path="/TransactionHistory" element={<TransactionHistory userId={userId}/>}/>
          </Route>
      </Routes>
    </>
  );
}

export default App;
