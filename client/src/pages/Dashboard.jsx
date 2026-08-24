import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch {
        // Token missing/expired/invalid on the server side - send the user back to login.
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
    fetchDashboard();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  if (!data) return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      <p>{data.message}</p>
      <p>Email: {data.user.email}</p>
      <p>Joined: {new Date(data.user.createdAt).toLocaleString()}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Dashboard;
