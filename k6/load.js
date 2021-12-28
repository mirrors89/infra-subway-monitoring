import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';

export let options = {
  stages: [
    { duration: '10m', target: 41 }, // simulate ramp-up of traffic from 1 to 41 users over 10 minutes.
    { duration: '15m', target: 41 }, // stay at 41 users for 15 minutes
    { duration: '5m', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    'logged in successfully': ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

const BASE_URL = 'https://infra-subway-deploy.o-r.kr';
const USERNAME = 'livedetuc2@gmail.com';
const PASSWORD = '1234';

// main page -> login -> find path
export default function ()  {

  var loginPayload = JSON.stringify({
    email: USERNAME,
    password: PASSWORD,
  });

  var params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 1. main page
  let mainRes = http.get(`${BASE_URL}`, params);

  check(mainRes, {
    'get main page successfully': (resp) => resp !== '',
  });

  // 2. login
  let loginRes = http.post(`${BASE_URL}/login/token`, loginPayload, params);

  check(loginRes, {
    'logged in successfully': (resp) => resp.json('accessToken') !== '',
  });

  // 3. find path
  let authHeaders = {
    headers: {
      Authorization: `Bearer ${loginRes.json('accessToken')}`,
      'Content-Type': 'application/json',
    },
  };
  let pathPayload = JSON.stringify({
    source: 4,
    target: 6,
  });
  let myObjects = http.post(`${BASE_URL}/path`, pathPayload, authHeaders).json();
  check(myObjects, { 'found shortest path successfully': (obj) => obj.distance != 0 });
  sleep(1);
};