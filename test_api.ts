async function run() {
  console.log('Testing negi.nagendra@gmail.com');
  let res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nagendra Negi',
      email: 'negi.nagendra@gmail.com',
      password: 'password123'
    })
  });
  console.log('Register negi:', res.status, await res.text());

  res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'negi.nagendra@gmail.com',
      password: 'password123'
    })
  });
  console.log('Login negi:', res.status, await res.text());

  console.log('\nTesting kartik24negi@gmail.com');
  res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kartik Negi',
      email: 'kartik24negi@gmail.com',
      password: 'password123'
    })
  });
  console.log('Register kartik:', res.status, await res.text());

  res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'kartik24negi@gmail.com',
      password: 'password123'
    })
  });
  console.log('Login kartik:', res.status, await res.text());
}

run().catch(console.error);
