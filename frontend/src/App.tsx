import React, {useEffect, useState} from 'react';
import './App.css';
import { Route, Routes } from "react-router-dom";
import MyLovelyPoint from "./routes/MyLovelyPoint";
import Layout from "./navigation/Layout";
import ContributePoints from "./routes/ContributePoints";
import TradePoints from "./routes/TradePoints";
import TransactionHistory from "./routes/TransactionHistory";

function App() {
    const [totalPoolPoints, setTotalPoolPoints] = useState<number>(0);
    const userId: number = 2;
    useEffect(() => {
        const getTotalPoolPoints = async () => {
            const response = await fetch('http://127.0.0.1:8000/contribution');
            const data = await response.json();
            setTotalPoolPoints(data.total);
        }
        getTotalPoolPoints();
    }, [totalPoolPoints])

    const updateTotalPoints = async (value: number) => {
        setTotalPoolPoints(value);
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
                Total Pool Points: <span id="demo">{totalPoolPoints}</span>
              </div>
            </div>
          </div>
        </header>
      <Routes>
          <Route path="/" element={<Layout />}>
              <Route index path="/MyLovelyPoint" element={<MyLovelyPoint userId={userId}/>}/>
              <Route path="/ContributePoints" element={<ContributePoints userId={userId} updateTotalPoints={updateTotalPoints}/>}/>
              <Route path="/TradePoints" element={<TradePoints userId={userId} updateTotalPoints={updateTotalPoints}/>}/>
              <Route path="/TransactionHistory" element={<TransactionHistory />}/>
          </Route>
      </Routes>
    </>
  );
}

export default App;
