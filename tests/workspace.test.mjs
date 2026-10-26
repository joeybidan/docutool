import test from 'node:test'
import assert from 'node:assert/strict'
import { loadLocalWorkspace, saveLocalWorkspace, LOCAL_STORAGE_KEY } from '../src/services/localStorageService.js'
const data = new Map()
global.window = {localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
test('migrates old notes without changing the legacy backup',()=>{
  data.clear(); const old=JSON.stringify({schemaVersion:2,data:{notes:['<unsafe>','b','c','d','e'],activeNoteIndex:4}})
  data.set('docutool:workspace:v1',old)
  const state=loadLocalWorkspace(); assert.equal(state.noteHtml[0],'&lt;unsafe&gt;');assert.equal(state.noteNames[4],'Note 5')
  assert.equal(saveLocalWorkspace(state),true);assert.equal(data.get('docutool:workspace:v1'),old)
  assert.deepEqual(loadLocalWorkspace(),state)
})
test('persists more than five named notes, colors, and active selection',()=>{
  const state=loadLocalWorkspace();state.notes=Array.from({length:25},(_,i)=>`text ${i}`);state.noteNames=state.notes.map((_,i)=>`Custom ${i}`);state.noteHtml=state.notes.map(t=>`<span style="color:red">${t}</span>`);state.activeNoteIndex=24
  saveLocalWorkspace(state);assert.deepEqual(loadLocalWorkspace(),state)
})
test('backs up malformed storage before returning an empty workspace',()=>{
  data.set(LOCAL_STORAGE_KEY,'broken JSON');assert.equal(loadLocalWorkspace().notes.length,5);assert.ok([...data].some(([k,v])=>k.startsWith('docutool:recovery:')&&v==='broken JSON'))
})
test('reports storage quota failure',()=>{
  const save=window.localStorage.setItem;window.localStorage.setItem=()=>{throw Error('quota')};assert.equal(saveLocalWorkspace(loadLocalWorkspace()),false);window.localStorage.setItem=save
})
