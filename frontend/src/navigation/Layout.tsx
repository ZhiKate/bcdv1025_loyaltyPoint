import {Link, Outlet} from "react-router-dom";
import TradePoints from "../routes/TradePoints";
import TransactionHistory from "../routes/TransactionHistory";

const Layout = () => {
    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/MyLovelyPoint">MyLovelyPoint</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/ContributePoints">Contribute Loyalty Points</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/TradePoints">Trade Loyalty Points</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/TransactionHistory">Transaction History</Link>
                        </li>
                    </ul>
                </div>
            </nav>
            <Outlet />
        </>
    )
}
export default Layout;