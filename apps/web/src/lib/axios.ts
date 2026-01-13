import axios from 'axios';

//192.168.31.185
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BASE_URL}/api/v1`, 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


export default api;
