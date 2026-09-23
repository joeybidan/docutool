import test from 'node:test'
import assert from 'node:assert/strict'
import { newGame, slide, applyAction, assignmentPoints, replay, DIRECTIONS } from '../src/carematch/engine.mjs'
import { topFive } from '../netlify/functions/_shared/ranking.mjs'
import { handleCareMatch } from '../netlify/functions/_shared/service.mjs'
const board = row => [...row, ...Array(12).fill(0)]
function finish(seed) {
 let state=newGame(seed), actions=[]
 while(!state.ended && actions.length < 190) {
  let action
  // Exercise assignments and merging; finish after the last free assignments.
  for(let m=0;m<3&&!action;m++) for(let t=0;t<16&&!action;t++) if(assignmentPoints(state,m,t)) action={type:'assign',member:m,tile:t}
  if(!action) action=state.moves>=60?{type:'finish'}:{type:'move',direction:DIRECTIONS.find(d=>slide(state.board,d).changed)}
  const next=applyAction(state,action)
  assert.notEqual(next,state)
  actions.push(action);state=next
 }
 assert.ok(state.ended)
 return {state,actions}
}
export {finish}

test('2048 merges once, respects directions and caps tiles at 16',()=>{
 assert.deepEqual(slide(board([2,2,2,2]),'left').board.slice(0,4),[4,4,0,0])
 assert.deepEqual(slide(board([2,2,4,0]),'left').board.slice(0,4),[4,4,0,0])
 assert.deepEqual(slide(board([2,2,4,0]),'right').board.slice(0,4),[0,0,4,4])
 assert.deepEqual(slide(board([16,16,8,8]),'left').board.slice(0,4),[16,16,16,0])
 assert.equal(slide(board([16,16,8,8]),'left').points,80)
 const vertical=Array(16).fill(0);vertical[0]=2;vertical[4]=2
 assert.equal(slide(vertical,'down').board[12],4)
})
test('no-op swipes do not consume moves or RNG; undo preserves next spawn',()=>{
 const state={...newGame(20),board:board([2,0,0,0])}
 assert.equal(applyAction(state,{type:'move',direction:'left'}),state)
 const moved=applyAction(state,{type:'move',direction:'right'})
 const undo=applyAction(moved,{type:'undo'})
 const again=applyAction(undo,{type:'move',direction:'right'})
 assert.deepEqual(again.board,moved.board)
 assert.equal(again.rng,moved.rng)
 assert.equal(applyAction(again,{type:'undo'}),again)
})
test('exact, early, oversized and streak scoring; assignments are free',()=>{
 const state={...newGame(3),board:board([4,8,2,0]),streak:2,requests:[{name:'Rosa',hours:4,left:3}]}
 assert.deepEqual(assignmentPoints(state,0,0),{exact:true,base:350,streak:150,total:500})
 assert.equal(assignmentPoints(state,0,1).total,400)
 assert.equal(assignmentPoints(state,0,2),null)
 const next=applyAction(state,{type:'assign',member:0,tile:0})
 assert.equal(next.board[0],0);assert.equal(next.score,500);assert.equal(next.moves,0)
})
test('deadline expiration, three misses and final free assignments',()=>{
 const state={...newGame(2),board:board([2,2,0,0]),streak:2,requests:[{name:'A',hours:2,left:1},{name:'B',hours:4,left:1},{name:'C',hours:8,left:1}]}
 const next=applyAction(state,{type:'move',direction:'right'})
 assert.equal(next.missed,3);assert.equal(next.ended,true);assert.equal(next.streak,0)
 const final={...newGame(2),moves:60,board:board([4,0,0,0]),requests:[{name:'A',hours:4,left:3},null,null]}
 const assigned=applyAction(final,{type:'assign',member:0,tile:0})
 assert.equal(assigned.ended,true);assert.equal(assigned.requests[0],null)
})
test('100 seeded games terminate and replay exactly',()=>{
 for(let seed=1;seed<=100;seed++) {const {state,actions}=finish(seed);assert.deepEqual(replay(seed,actions),state);assert.ok(state.moves<=60)}
 assert.throws(()=>replay(1,[{type:'assign',member:99,tile:99}]))
})
test('all-time top-five shows one best score per browser identity',()=>{
 const entries=Array.from({length:8},(_,i)=>({id:String(i),player:String(i),score:100+i,startedAt:i}))
 entries.push({...entries[7],id:'repeat',score:999})
 const ranked=topFive(entries)
 assert.equal(ranked.length,5);assert.equal(ranked[0].score,999);assert.equal(new Set(ranked.map(e=>e.player)).size,5)
})
function memoryStore(){const data=new Map();return {data,list:async({prefix}={})=>({blobs:[...data.keys()].filter(key=>!prefix||key.startsWith(prefix)).map(key=>({key}))}),get:async key=>data.get(key),set:async(k,v)=>{data.set(k,v)},setJSON:async(k,v)=>{data.set(k,structuredClone(v))},delete:async key=>{data.delete(key)}}}
const now=Date.parse('2026-09-21T12:00:00Z')
function request(body,cookie='',method='POST'){return new Request('https://example.test/api/carematch',{method,headers:{cookie,'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})})}
async function started(store,name='JOEY',cookie=''){
 const res=await handleCareMatch(request({op:'start',name},cookie),{store,now})
 assert.equal(res.status,200)
 return {issued:await res.json(),cookie:res.headers.get('set-cookie').split(';')[0]}
}
test('server recomputes scores, rejects forgery, binds identity and consumes rounds',async()=>{
 const store=memoryStore(),{issued,cookie}=await started(store)
 const {state,actions}=finish(issued.seed)
 let res=await handleCareMatch(request({op:'submit',round:issued.round,actions,score:999999999},cookie),{store,now})
 assert.equal(res.status,200);const result=await res.json();assert.equal(result.verifiedScore,state.score);assert.equal(result.allTime[0].score,state.score)
 assert.ok(result.allTime[0].isYou);assert.equal(result.allTime[0].player,undefined)
 res=await handleCareMatch(request({op:'submit',round:issued.round,actions},cookie),{store,now});assert.equal(res.status,401)
 res=await handleCareMatch(request({op:'submit',round:issued.round,actions},''),{store,now});assert.equal(res.status,401)
 const another=await started(store,'JOEY',cookie)
 res=await handleCareMatch(request({op:'submit',round:another.issued.round,actions:[]},another.cookie),{store,now});assert.equal(res.status,400)
 res=await handleCareMatch(request({op:'submit',round:another.issued.round,actions},''),{store,now});assert.equal(res.status,401)
 res=await handleCareMatch(request({op:'submit',round:another.issued.round,actions},another.cookie),{store,now:now+86400001});assert.equal(res.status,401)
})
test('single character and spaced aliases work; markup is rejected',async()=>{
 const store=memoryStore()
 const single=await started(store,'J')
 assert.equal(single.issued.seed >= 0,true)
 const spaced=await started(store,'AJ B')
 const invalid=await handleCareMatch(request({op:'start',name:'<script>'}),{store,now})
 assert.equal(invalid.status,400)
 assert.ok(spaced.issued.round)
})
test('simultaneous submissions preserve Top 5 and prune unqualified scores',async()=>{
 const store=memoryStore()
 const rounds=await Promise.all(Array.from({length:12},(_,i)=>started(store,`P${i}`)))
 const submissions=rounds.map(({issued,cookie})=>{const {actions,state}=finish(issued.seed);return {issued,cookie,actions,state}})
 await Promise.all(submissions.map(({issued,cookie,actions})=>handleCareMatch(request({op:'submit',round:issued.round,actions},cookie),{store,now})))
 const res=await handleCareMatch(request(null,'','GET'),{store,now}), boards=await res.json()
 assert.equal(boards.allTime.length,5)
 assert.deepEqual(boards.allTime.map(e=>e.score),submissions.map(e=>e.state.score).sort((a,b)=>b-a).slice(0,5))
 assert.ok([...store.data.keys()].filter(key=>key.startsWith('scores/')).length<=5)
})
