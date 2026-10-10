import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
async function request(path, method = 'GET', body, cookie = '') {
  const response = await fetch(base + '/api/' + path, {
    method,
    headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
assert.equal((await request('projects')).status, 401);
assert.equal((await request('session','POST',{email:'admin@orbit.demo',password:'wrong'})).status,401);
const admin = await request('session','POST',{email:'admin@orbit.demo',password:'OrbitDemo123!'});
const user = await request('session','POST',{email:'user@orbit.demo',password:'OrbitDemo123!'});
assert.equal(admin.status,200); assert.equal(user.status,200);
assert.equal((await request('users','GET',undefined,user.cookie)).status,403);
const adminProjects=await request('projects','GET',undefined,admin.cookie);
const userProjects=await request('projects','GET',undefined,user.cookie);
assert.ok(adminProjects.data.length>userProjects.data.length);
assert.ok(userProjects.data.every(p=>p.owner===2));
const foreign=adminProjects.data.find(p=>p.owner===1);
assert.equal((await request('projects','DELETE',{id:foreign.id},user.cookie)).status,403);
const name='Smoke test '+Date.now();
const project={name,client:'Test client',budget:1234,status:'Planning',owner:2};
assert.equal((await request('projects','POST',project,admin.cookie)).status,200);
const created=(await request('projects','GET',undefined,user.cookie)).data.find(p=>p.name===name);
assert.ok(created);
assert.equal((await request('projects','PATCH',{...created,status:'Completed',budget:2345},user.cookie)).status,200);
const updated=(await request('projects','GET',undefined,admin.cookie)).data.find(p=>p.id===created.id);
assert.equal(updated.budget,2345);assert.equal(updated.status,'Completed');
assert.equal((await request('projects','DELETE',{id:created.id},user.cookie)).status,200);
assert.equal((await request('users','PATCH',{id:1,name:'Self',email:'admin@orbit.demo',role:'User'},admin.cookie)).status,400);
const member={name:'Test member',email:`smoke-${Date.now()}@example.com`,password:'TestPassword123!',role:'User'};
assert.equal((await request('users','POST',member,admin.cookie)).status,200);
const newUser=(await request('users','GET',undefined,admin.cookie)).data.find(u=>u.email===member.email);
assert.ok(newUser);
assert.equal((await request('users','PATCH',{...newUser,name:'Updated test member'},admin.cookie)).status,200);
assert.equal((await request('users','DELETE',{id:newUser.id},admin.cookie)).status,200);
const crossOrigin=await fetch(base+'/api/projects',{method:'POST',headers:{Origin:'https://invalid.example',Cookie:admin.cookie,'Content-Type':'application/json'},body:JSON.stringify(project)});
assert.equal(crossOrigin.status,403);
assert.equal((await request('session','DELETE',undefined,user.cookie)).status,200);
console.log('API smoke passed: authentication, project/team CRUD, ownership, admin protection, and origin checks.');
