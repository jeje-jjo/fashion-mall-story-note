window.__writes=[];
const docs={"meta/round":{n:6,run:"runs/r6"}};
[11,15,17,18,19,23,34,35,47,48,57,59,6,69,7,71,78,86].forEach(i=>docs["runs/r6/clo/c"+i]={done:true});
docs["runs/r6/clo/c128"]={done:false,opt:{guest:"",like:""}};
const snapDoc=(path)=>({exists:!!docs[path],data:()=>docs[path],id:path.split('/').pop()});
const col=(path)=>({onSnapshot:(cb)=>{const ds=Object.keys(docs).filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1).map(k=>snapDoc(k));setTimeout(()=>cb({docs:ds}),10);return ()=>{}},add:async(d)=>({id:'x'}),orderBy:function(){return this},limit:function(){return this},where:function(){return this}});
const db={doc:(p)=>({onSnapshot:(cb,err)=>{setTimeout(()=>cb(snapDoc(p)),10);return()=>{}},set:async(d)=>{window.__writes.push([p,d]);docs[p]=d},update:async()=>{},delete:async()=>{},get:async()=>snapDoc(p)}),collection:col};
window.claude={use:async(n)=>n==='db'?db:null};
