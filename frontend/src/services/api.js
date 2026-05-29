import axios from 'axios';

// Option Mac :
//const BASE_URL = 'http://localhost:8888/smartcampus-harmonia/backend';

// Option Windows : Si le port 8888 ne marche pas, utiliser celle-ci :
const BASE_URL = 'http://localhost/smartcampus-harmonia/backend';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // TRÈS IMPORTANT : Permet à Axios d'envoyer le cookie de session PHP à chaque requête
});

export default api;