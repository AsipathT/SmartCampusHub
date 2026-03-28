import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:8080/api/v1' });
api.interceptors.request.use((config) => {
  config.headers.Authorization = 'Basic YWRtaW46YWRtaW4=';
  return config;
});
try {
  await api.get('/resources');
  console.log('GET 200');
} catch (e) {
  if (e.response) console.log('GET ERROR', e.response.status, JSON.stringify(e.response.data));
  else console.log('GET ERROR', e.message);
}
try {
  await api.post('/resources', { name: 't', type: 'LECTURE_HALL', capacity: 10, location: 'l', status: 'ACTIVE', availableFrom: '08:00', availableTo: '20:00' });
  console.log('POST 200');
} catch (e) {
  if (e.response) console.log('POST ERROR', e.response.status, JSON.stringify(e.response.data));
  else console.log('POST ERROR', e.message);
}
