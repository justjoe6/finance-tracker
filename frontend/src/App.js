import './App.css';
import NavBar from './components/Navbar';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';
import AddSpend from './components/AddSpend';
import Profile from './components/Profile';
import RemoveMonthly from './components/RemoveMonthly';
import RemoveAnnual from './components/RemoveAnnual';
import UpdateProfile from './components/UpdateProfile';
import PrivateComponent from './components/PrivateComponent';
import DeleteAccount from './components/DeleteAccount';
import {BrowserRouter,Routes,Route} from 'react-router-dom';

function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <NavBar/>
          <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/signup" element={<Signup/>}/>
            <Route element={<PrivateComponent/>}>
              <Route path="/profile" element={<Profile/>}/>
              <Route path="/" element={<Home/>}/>
              <Route path="/add/:month/:year" element={<AddSpend/>}/>
              <Route path="/removemonth" element={<RemoveMonthly/>}/>
              <Route path="/removeannual" element={<RemoveAnnual/>}/>
              <Route path="/updateprofile" element={<UpdateProfile/>}/>
              <Route path="/deleteAccount" element={<DeleteAccount/>}/>
            </Route>
          </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
