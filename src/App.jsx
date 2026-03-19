import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ConsumerDashboard from './pages/consumer/Dashboard'
import RequestForm from './pages/consumer/RequestForm'
import QuoteList from './pages/consumer/QuoteList'
import BusinessRegister from './pages/business/RegisterBiz'
import BusinessDashboard from './pages/business/Dashboard'
import RequestDetail from './pages/business/RequestDetail'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'
import BizProfile from './pages/BizProfile'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
        <Route path="/consumer/request" element={<RequestForm />} />
        <Route path="/consumer/quotes/:id" element={<QuoteList />} />
        <Route path="/business/register" element={<BusinessRegister />} />
        <Route path="/business/dashboard" element={<BusinessDashboard />} />
        <Route path="/business/request/:id" element={<RequestDetail />} />
        <Route path="/chat/:requestId/:bizId" element={<Chat />} />
        <Route path="/biz/:bizId" element={<BizProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App