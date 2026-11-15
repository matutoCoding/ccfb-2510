(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();const ft={low:"低",medium:"中",high:"高"};function q(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}function Zt(){return{colorA:"#1a6f9e",colorB:"#2e8fb8",colorC:"#0d4a6e",mixB:.25,mixC:.12,jitter:.18,groutColor:"#c8c4bb",groutWidth:2,tileSize:25}}function Jt(){return{color:"#0a4d6e",clarity:.85,windSpeed:3,waveAmp:1}}function Qt(){return{sunOn:!0,night:!1,timeOfDay:14,sunIntensity:1,lights:[{id:q(),edge:0,t:.5,depth:.8,color:"#cfe8ff",intensity:1,on:!0}]}}function kt(e){const o=Date.now();return{id:q(),name:e,createdAt:o,updatedAt:o,vertices:[{x:-4,y:-2,depth:1.2},{x:4,y:-2,depth:1.2},{x:4,y:2,depth:1.8},{x:-4,y:2,depth:1.8}],steps:[{id:q(),x:-4,y:-2,w:1.2,h:4,steps:3,topDepth:.35,bottomDepth:1.05,dir:0}],shallows:[],tile:Zt(),water:Jt(),lighting:Qt(),bookmarks:[]}}const Et={quality:"medium",autoQuality:!0,invertY:!1};function zt(e){var i;if(!e||typeof e!="object"||!Array.isArray(e.vertices)||e.vertices.length<3)return null;const o=kt(typeof e.name=="string"?e.name:"导入项目"),t={...o,id:typeof e.id=="string"?e.id:q(),name:typeof e.name=="string"?e.name:o.name,createdAt:typeof e.createdAt=="number"?e.createdAt:Date.now(),updatedAt:typeof e.updatedAt=="number"?e.updatedAt:Date.now(),vertices:e.vertices.filter(n=>isFinite(n==null?void 0:n.x)&&isFinite(n==null?void 0:n.y)).map(n=>({x:+n.x,y:+n.y,depth:isFinite(n==null?void 0:n.depth)?+n.depth:1.5})),steps:Array.isArray(e.steps)?e.steps.filter(n=>isFinite(n==null?void 0:n.x)&&isFinite(n==null?void 0:n.w)).map(n=>({id:typeof n.id=="string"?n.id:q(),x:+n.x,y:+n.y,w:+n.w,h:+n.h||1,steps:Math.max(1,Math.min(8,n.steps|0||3)),topDepth:isFinite(n.topDepth)?+n.topDepth:.35,bottomDepth:isFinite(n.bottomDepth)?+n.bottomDepth:1,dir:[0,1,2,3].includes(n.dir)?n.dir:0})):[],shallows:Array.isArray(e.shallows)?e.shallows.filter(n=>isFinite(n==null?void 0:n.x)&&isFinite(n==null?void 0:n.w)).map(n=>({id:typeof n.id=="string"?n.id:q(),x:+n.x,y:+n.y,w:+n.w,h:+n.h||1,depth:isFinite(n.depth)?+n.depth:.9})):[],tile:{...o.tile,...e.tile??{}},water:{...o.water,...e.water??{}},lighting:{...o.lighting,...e.lighting??{},lights:Array.isArray((i=e.lighting)==null?void 0:i.lights)?e.lighting.lights.map(n=>({id:typeof(n==null?void 0:n.id)=="string"?n.id:q(),edge:Math.max(0,(n==null?void 0:n.edge)|0),t:isFinite(n==null?void 0:n.t)?+n.t:.5,depth:isFinite(n==null?void 0:n.depth)?+n.depth:.8,color:typeof(n==null?void 0:n.color)=="string"?n.color:"#cfe8ff",intensity:isFinite(n==null?void 0:n.intensity)?+n.intensity:1,on:(n==null?void 0:n.on)!==!1})):o.lighting.lights},bookmarks:Array.isArray(e.bookmarks)?e.bookmarks.filter(n=>n==null?void 0:n.cam).map(n=>({id:typeof n.id=="string"?n.id:q(),name:typeof n.name=="string"?n.name:"书签",cam:{...n.cam}})):[]};return t.vertices.length<3?null:t}const St="poolpreview.projects.v1",Bt="poolpreview.settings.v1";function ut(){try{const e=localStorage.getItem(St);if(!e)return[];const o=JSON.parse(e);return Array.isArray(o)?o.map(zt).filter(t=>t!==null):[]}catch{return[]}}function Ft(e){localStorage.setItem(St,JSON.stringify(e))}function te(){return ut().sort((e,o)=>o.updatedAt-e.updatedAt).map(e=>{const o=e.vertices.map(i=>i.x),t=e.vertices.map(i=>i.y);return{id:e.id,name:e.name,updatedAt:e.updatedAt,vertexCount:e.vertices.length,maxDepth:Math.max(...e.vertices.map(i=>i.depth),0),width:Math.max(...o)-Math.min(...o),height:Math.max(...t)-Math.min(...t)}})}function vt(e){return ut().find(o=>o.id===e)??null}function ot(e){e.updatedAt=Date.now();const o=ut(),t=o.findIndex(i=>i.id===e.id);t>=0?o[t]=e:o.push(e),Ft(o)}function ee(e){const o=kt(`泳池项目 ${new Date().toLocaleDateString("zh-CN")}`);return ot(o),o}function oe(e){Ft(ut().filter(o=>o.id!==e))}function ne(e){const o=vt(e);if(!o)return null;const t=JSON.parse(JSON.stringify(o));return t.id=q(),t.name=o.name+" 副本",t.createdAt=Date.now(),ot(t),t}function ie(e){return JSON.stringify({app:"pool-preview",version:1,projects:[e]},null,2)}function jt(){return JSON.stringify({app:"pool-preview",version:1,projects:ut()},null,2)}function Pt(e,o){const t=new Blob([e],{type:"application/json"}),i=URL.createObjectURL(t),n=document.createElement("a");n.href=i,n.download=o,n.click(),setTimeout(()=>URL.revokeObjectURL(i),5e3)}function Ot(e){const o=JSON.parse(e),t=Array.isArray(o)?o:Array.isArray(o==null?void 0:o.projects)?o.projects:[o],i=ut();let n=0;for(const s of t){const c=zt(s);c&&(i.some(a=>a.id===c.id)&&(c.id=q()),i.push(c),n++)}if(n===0)throw new Error("文件中没有可识别的泳池项目");return Ft(i),n}function wt(){try{const e=localStorage.getItem(Bt);return e?{...Et,...JSON.parse(e)}:{...Et}}catch{return{...Et}}}function yt(e){localStorage.setItem(Bt,JSON.stringify(e))}function se(){localStorage.removeItem(St)}function h(e,o={},t=[]){const i=document.createElement(e);for(const[n,s]of Object.entries(o))n==="class"?i.className=s:i.setAttribute(n,s);for(const n of t)i.append(typeof n=="string"?document.createTextNode(n):n);return i}function Z(e){const o=h("span",{class:"row-val"}),t=()=>{o.textContent=(e.format?e.format(e.value):e.value.toFixed(2))+(e.unit??"")};t();const i=h("input",{type:"range",min:String(e.min),max:String(e.max),step:String(e.step),value:String(e.value)});return i.addEventListener("input",()=>{e.value=parseFloat(i.value),t(),e.onInput(e.value)}),h("div",{class:"ctrl-row"},[h("label",{},[e.label]),i,o])}function ct(e,o,t){const i=h("input",{type:"color",value:o});return i.addEventListener("input",()=>t(i.value)),h("div",{class:"ctrl-row"},[h("label",{},[e]),i])}function Rt(e,o,t,i){const n=h("select");for(const[s,c]of o){const a=h("option",{value:s},[c]);s===t&&(a.selected=!0),n.append(a)}return n.addEventListener("change",()=>i(n.value)),h("div",{class:"ctrl-row"},[h("label",{},[e]),n])}function bt(e,o,t){const i=h("input",{type:"checkbox"});return i.checked=o,i.addEventListener("change",()=>t(i.checked)),h("div",{class:"ctrl-row"},[h("label",{},[e]),i])}function it(e,o,t,i,n,s){const c=h("input",{type:"number",min:String(t),max:String(i),step:String(n),value:String(o)});return c.addEventListener("change",()=>{const a=parseFloat(c.value);isFinite(a)&&s(Math.min(i,Math.max(t,a)))}),h("div",{class:"ctrl-row"},[h("label",{},[e]),c])}function re(e,o,t){const i=h("input",{type:"text",value:o});return i.addEventListener("change",()=>t(i.value.trim()||o)),h("div",{class:"ctrl-row"},[h("label",{},[e]),i])}function O(e,o,t=""){const i=h("button",{class:`btn ${t}`},[e]);return i.addEventListener("click",o),i}function $t(e){return new Promise(o=>{const t=h("div",{class:"modal-overlay"}),i=h("div",{class:"modal"},[h("p",{},[e]),h("div",{class:"modal-btns"},[O("取消",()=>{t.remove(),o(!1)}),O("确定",()=>{t.remove(),o(!0)},"danger")])]);t.append(i),t.addEventListener("click",n=>{n.target===t&&(t.remove(),o(!1))}),document.body.append(t)})}function K(e){const o=h("div",{class:"toast"},[e]);document.body.append(o),setTimeout(()=>o.classList.add("show"),10),setTimeout(()=>{o.classList.remove("show"),setTimeout(()=>o.remove(),300)},2200)}function At(e){const o=h("div",{class:"page"});function t(){o.innerHTML="";const i=te(),n=h("div",{style:"display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap"},[h("h2",{style:"margin:0;flex:1"},["我的项目"]),O("新建项目",()=>{const a=ee();location.hash=`#/editor/${a.id}`},"primary"),O("导入",()=>s.click()),O("导出全部",()=>{Pt(jt(),`泳池项目备份_${new Date().toISOString().slice(0,10)}.json`),K("已导出全部项目")})]);o.append(n);const s=h("input",{type:"file",accept:".json",style:"display:none"});if(s.addEventListener("change",async()=>{var m;const a=(m=s.files)==null?void 0:m[0];if(a){try{const f=Ot(await a.text());K(`成功导入 ${f} 个项目`),t()}catch(f){K(`导入失败:${f.message}`)}s.value=""}}),o.append(s),i.length===0){o.append(h("div",{class:"empty-state"},["还没有项目。点击「新建项目」开始设计第一个泳池。"]));return}const c=h("div",{class:"project-grid"});for(const a of i){const m=h("div",{class:"project-card"},[h("div",{class:"name"},[a.name]),h("div",{class:"meta"},[`${a.width.toFixed(1)}m × ${a.height.toFixed(1)}m · 最深 ${a.maxDepth.toFixed(1)}m`]),h("div",{class:"meta"},[`更新于 ${new Date(a.updatedAt).toLocaleString("zh-CN")}`]),h("div",{class:"actions"},[O("池体编辑",()=>location.hash=`#/editor/${a.id}`,"small"),O("材质灯光",()=>location.hash=`#/materials/${a.id}`,"small"),O("预览",()=>location.hash=`#/preview/${a.id}`,"small primary"),O("复制",()=>{ne(a.id),t(),K("已复制")},"small"),O("导出",()=>{const f=vt(a.id);f&&Pt(ie(f),`${f.name}.json`)},"small"),O("删除",async()=>{await $t(`确定删除「${a.name}」?此操作不可恢复。`)&&(oe(a.id),t(),K("已删除"))},"small danger")])]);c.append(m)}o.append(c)}return t(),e.append(o),{destroy(){}}}function ae(e,o){const t=o?vt(o):null;if(!t)return e.append(h("div",{class:"page"},[h("p",{},["项目不存在。"])])),{destroy(){}};const i=t;let n="select",s=null,c=-1,a=null,m=0;const f=h("div",{class:"page-nopad",style:"display:flex;padding:14px;gap:14px"}),v=h("div",{class:"panel panel-side"}),E=h("div",{class:"panel panel-main"}),y=h("canvas",{id:"editor-canvas"}),T=h("div",{class:"canvas-wrap"},[y]),k=h("div",{class:"editor-toolbar"});E.append(k,T),f.append(v,E),e.append(f);const p=y.getContext("2d");function M(){clearTimeout(m),m=window.setTimeout(()=>ot(i),400)}function R(){const w=i.vertices.map(rt=>rt.x),l=i.vertices.map(rt=>rt.y),u=Math.min(...w,-1),U=Math.max(...w,1),g=Math.min(...l,-1),C=Math.max(...l,1),b=50,W=y.width-b*2,Y=y.height-b*2,G=Math.min(W/(U-u),Y/(C-g)),H=b+(W-(U-u)*G)/2-u*G,nt=b+(Y-(C-g)*G)/2-g*G;return{s:G,ox:H,oy:nt}}const F=(w,l,u)=>[w*u.s+u.ox,l*u.s+u.oy],S=(w,l,u)=>({x:(w-u.ox)/u.s,y:(l-u.oy)/u.s});function N(){const w=T.getBoundingClientRect(),l=Math.min(window.devicePixelRatio||1,2);y.width=Math.max(2,Math.round(w.width*l)),y.height=Math.max(2,Math.round(w.height*l)),d()}function _(w){const l=Math.min(1,Math.max(0,(w-.2)/2.2)),u=Math.round(30+20*(1-l)),U=Math.round(144-60*l),g=Math.round(200-60*l);return`rgb(${u},${U},${g})`}function d(){const w=y.width,l=y.height;p.clearRect(0,0,w,l);const u=R();p.strokeStyle="rgba(80,110,140,0.14)",p.lineWidth=1;const U=S(0,0,u),g=S(w,l,u);for(let b=Math.floor(U.x*2)/2;b<=g.x;b+=.5){const[W]=F(b,0,u);p.beginPath(),p.moveTo(W,0),p.lineTo(W,l),p.stroke()}for(let b=Math.floor(U.y*2)/2;b<=g.y;b+=.5){const[,W]=F(0,b,u);p.beginPath(),p.moveTo(0,W),p.lineTo(w,W),p.stroke()}for(const b of i.steps)X(b.x,b.y,b.w,b.h,"rgba(220,170,60,0.18)","#dcaa3c",`台阶×${b.steps}`,(s==null?void 0:s.type)==="steps"&&s.id===b.id,u);for(const b of i.shallows)X(b.x,b.y,b.w,b.h,"rgba(60,190,220,0.15)","#3ec8dc",`浅水 ${b.depth.toFixed(2)}m`,(s==null?void 0:s.type)==="shallow"&&s.id===b.id,u);if(a){const b=Math.min(a.x0,a.x1),W=Math.min(a.y0,a.y1);X(b,W,Math.abs(a.x1-a.x0),Math.abs(a.y1-a.y0),"rgba(255,255,255,0.08)","#ffffff","",!0,u)}const C=i.vertices;if(C.length>=2&&(p.beginPath(),C.forEach((b,W)=>{const[Y,G]=F(b.x,b.y,u);W===0?p.moveTo(Y,G):p.lineTo(Y,G)}),C.length>=3&&p.closePath(),p.fillStyle="rgba(30,110,160,0.25)",p.fill(),p.strokeStyle="#4db8e8",p.lineWidth=2,p.stroke()),C.forEach((b,W)=>{const[Y,G]=F(b.x,b.y,u),H=(s==null?void 0:s.type)==="vertex"&&s.i===W;p.fillStyle=_(b.depth),p.strokeStyle=H?"#ffd75e":"#0a0f14",p.lineWidth=H?3:1.5,p.beginPath(),p.arc(Y,G,H?8:6,0,Math.PI*2),p.fill(),p.stroke(),p.fillStyle="#dce7f0",p.font=`${Math.round(11*(y.width/800+.6))}px sans-serif`,p.textAlign="center",p.fillText(`${b.depth.toFixed(1)}`,Y,G-11)}),C.length>=3){const b=C.map(H=>H.x),W=C.map(H=>H.y),Y=Math.max(...b)-Math.min(...b),G=Math.max(...W)-Math.min(...W);p.fillStyle="#8ba0b4",p.font="13px sans-serif",p.textAlign="left",p.fillText(`${Y.toFixed(1)}m × ${G.toFixed(1)}m · ${C.length} 个顶点`,12,l-14)}}function X(w,l,u,U,g,C,b,W,Y){const[G,H]=F(w,l,Y),[nt,rt]=F(w+u,l+U,Y);p.fillStyle=g,p.fillRect(G,H,nt-G,rt-H),p.strokeStyle=C,p.lineWidth=W?2.5:1.2,p.setLineDash([5,4]),p.strokeRect(G,H,nt-G,rt-H),p.setLineDash([]),b&&(p.fillStyle=C,p.font="12px sans-serif",p.textAlign="center",p.fillText(b,(G+nt)/2,(H+rt)/2))}function r(w,l,u){let U=-1,g=u*u;return i.vertices.forEach((C,b)=>{const W=(C.x-w)**2+(C.y-l)**2;W<g&&(g=W,U=b)}),U}function x(w,l,u,U){const g=U.x-u.x,C=U.y-u.y,b=g*g+C*C||1e-9,W=Math.max(0,Math.min(1,((w-u.x)*g+(l-u.y)*C)/b)),Y=u.x+g*W,G=u.y+C*W;return{d:Math.hypot(w-Y,l-G),t:W}}function P(w,l,u){const U=i.vertices;for(let g=0;g<U.length;g++){const{d:C,t:b}=x(w,l,U[g],U[(g+1)%U.length]);if(C<u)return{i:g,t:b}}return null}function z(w,l,u){return w>=u.x&&w<=u.x+u.w&&l>=u.y&&l<=u.y+u.h}function D(w){const l=y.getBoundingClientRect(),u=y.width/l.width,U=y.height/l.height;return S((w.clientX-l.left)*u,(w.clientY-l.top)*U,R())}const V=w=>{y.setPointerCapture(w.pointerId);const l=D(w),U=12/R().s;if(n==="select"){const g=r(l.x,l.y,U);if(g>=0)s={type:"vertex",i:g},c=g;else{const C=i.steps.find(W=>z(l.x,l.y,W)),b=i.shallows.find(W=>z(l.x,l.y,W));s=C?{type:"steps",id:C.id}:b?{type:"shallow",id:b.id}:null}I(),d()}else if(n==="add"){const g=i.vertices.length>=3?P(l.x,l.y,U):null,C={x:+l.x.toFixed(2),y:+l.y.toFixed(2),depth:1.5};if(g){const b=i.vertices[g.i],W=i.vertices[(g.i+1)%i.vertices.length];C.depth=+(b.depth+(W.depth-b.depth)*g.t).toFixed(2),i.vertices.splice(g.i+1,0,C),s={type:"vertex",i:g.i+1}}else i.vertices.push(C),s={type:"vertex",i:i.vertices.length-1};M(),I(),d()}else(n==="steps"||n==="shallow")&&(a={x0:l.x,y0:l.y,x1:l.x,y1:l.y})},B=w=>{const l=D(w);if(c>=0){const u=i.vertices[c];u.x=+l.x.toFixed(2),u.y=+l.y.toFixed(2),M(),d()}else a&&(a.x1=l.x,a.y1=l.y,d())},L=()=>{if(a){const w=Math.min(a.x0,a.x1),l=Math.min(a.y0,a.y1),u=Math.abs(a.x1-a.x0),U=Math.abs(a.y1-a.y0);if(u>.3&&U>.3){if(n==="steps"){const g={id:q(),x:+w.toFixed(2),y:+l.toFixed(2),w:+u.toFixed(2),h:+U.toFixed(2),steps:3,topDepth:.35,bottomDepth:1,dir:0};i.steps.push(g),s={type:"steps",id:g.id}}else{const g={id:q(),x:+w.toFixed(2),y:+l.toFixed(2),w:+u.toFixed(2),h:+U.toFixed(2),depth:.9};i.shallows.push(g),s={type:"shallow",id:g.id}}M()}a=null,I(),d()}c>=0&&(c=-1,M())};y.addEventListener("pointerdown",V),y.addEventListener("pointermove",B),y.addEventListener("pointerup",L);function I(){var w;if(v.innerHTML="",v.append(h("h2",{},["池体编辑"])),v.append(re("项目名称",i.name,l=>{i.name=l,M()})),v.append(h("h3",{},["整体"])),v.append(it("全部深度(m)",((w=i.vertices[0])==null?void 0:w.depth)??1.5,.3,3.5,.1,l=>{i.vertices.forEach(u=>u.depth=l),M(),d()})),v.append(h("div",{style:"display:flex;gap:6px;margin:8px 0"},[O("重置为矩形",()=>{i.vertices=[{x:-4,y:-2,depth:1.2},{x:4,y:-2,depth:1.2},{x:4,y:2,depth:1.8},{x:-4,y:2,depth:1.8}],s=null,M(),I(),d()},"small"),O("3D 预览 →",()=>location.hash=`#/preview/${i.id}`,"small primary")])),(s==null?void 0:s.type)==="vertex"){const l=i.vertices[s.i];l&&(v.append(h("h3",{},[`顶点 ${s.i+1}`])),v.append(it("X (m)",l.x,-50,50,.1,u=>{l.x=u,M(),d()})),v.append(it("Y (m)",l.y,-50,50,.1,u=>{l.y=u,M(),d()})),v.append(it("水深 (m)",l.depth,.2,3.5,.05,u=>{l.depth=u,M(),d()})),v.append(O("删除此顶点",()=>{if(i.vertices.length<=3){K("至少保留 3 个顶点");return}i.vertices.splice(s.type==="vertex"?s.i:0,1),s=null,M(),I(),d()},"small danger")))}else if((s==null?void 0:s.type)==="steps"){const l=i.steps.find(u=>u.id===s.id);l&&(v.append(h("h3",{},["台阶区"])),v.append(it("级数",l.steps,1,8,1,u=>{l.steps=Math.round(u),M(),d()})),v.append(it("首级水深(m)",l.topDepth,.1,2,.05,u=>{l.topDepth=u,M()})),v.append(it("末级水深(m)",l.bottomDepth,.2,3,.05,u=>{l.bottomDepth=u,M()})),v.append(Rt("下探方向",[["0","向东 →"],["1","向西 ←"],["2","向南 ↓"],["3","向北 ↑"]],String(l.dir),u=>{l.dir=+u,M()})),v.append(O("删除台阶区",()=>{i.steps=i.steps.filter(u=>u.id!==l.id),s=null,M(),I(),d()},"small danger")))}else if((s==null?void 0:s.type)==="shallow"){const l=i.shallows.find(u=>u.id===s.id);l&&(v.append(h("h3",{},["浅水区"])),v.append(it("平台水深(m)",l.depth,.2,2,.05,u=>{l.depth=u,M()})),v.append(O("删除浅水区",()=>{i.shallows=i.shallows.filter(u=>u.id!==l.id),s=null,M(),I(),d()},"small danger")))}else v.append(h("p",{style:"color:var(--fg-dim);font-size:13px"},["选择工具下点击顶点可编辑该处水深;「加点」工具点击空白追加顶点、点击边插入顶点;台阶/浅水工具拖拽出矩形区域。"]))}function j(){k.innerHTML="";const w=[["select","选择"],["add","加点"],["steps","台阶"],["shallow","浅水区"]];for(const[l,u]of w){const U=O(u,()=>{n=l,j()},n===l?"active":"");k.append(U)}}j(),I();const $=new ResizeObserver(N);return $.observe(T),N(),{destroy(){$.disconnect(),clearTimeout(m),ot(i)}}}const st={sub:(e,o)=>[e[0]-o[0],e[1]-o[1],e[2]-o[2]],add:(e,o)=>[e[0]+o[0],e[1]+o[1],e[2]+o[2]],scale:(e,o)=>[e[0]*o,e[1]*o,e[2]*o],dot:(e,o)=>e[0]*o[0]+e[1]*o[1]+e[2]*o[2],cross:(e,o)=>[e[1]*o[2]-e[2]*o[1],e[2]*o[0]-e[0]*o[2],e[0]*o[1]-e[1]*o[0]],len:e=>Math.hypot(e[0],e[1],e[2]),norm(e){const o=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/o,e[1]/o,e[2]/o]}};function ce(e,o,t,i){const n=1/Math.tan(e/2),s=new Float32Array(16);return s[0]=n/o,s[5]=n,s[10]=(i+t)/(t-i),s[11]=-1,s[14]=2*i*t/(t-i),s}function le(e,o,t){const i=st.norm(st.sub(e,o)),n=st.norm(st.cross(t,i)),s=st.cross(i,n),c=new Float32Array(16);return c[0]=n[0],c[1]=s[0],c[2]=i[0],c[4]=n[1],c[5]=s[1],c[6]=i[1],c[8]=n[2],c[9]=s[2],c[10]=i[2],c[12]=-st.dot(n,e),c[13]=-st.dot(s,e),c[14]=-st.dot(i,e),c[15]=1,c}function he(e,o){const t=new Float32Array(16);for(let i=0;i<4;i++)for(let n=0;n<4;n++)t[i*4+n]=e[n]*o[i*4]+e[4+n]*o[i*4+1]+e[8+n]*o[i*4+2]+e[12+n]*o[i*4+3];return t}function ue(e){const o=new Float32Array(16),t=[];for(let n=0;n<16;n++)t[n]=e[n];o[0]=t[5]*t[10]*t[15]-t[5]*t[11]*t[14]-t[9]*t[6]*t[15]+t[9]*t[7]*t[14]+t[13]*t[6]*t[11]-t[13]*t[7]*t[10],o[4]=-t[4]*t[10]*t[15]+t[4]*t[11]*t[14]+t[8]*t[6]*t[15]-t[8]*t[7]*t[14]-t[12]*t[6]*t[11]+t[12]*t[7]*t[10],o[8]=t[4]*t[9]*t[15]-t[4]*t[11]*t[13]-t[8]*t[5]*t[15]+t[8]*t[7]*t[13]+t[12]*t[5]*t[11]-t[12]*t[7]*t[9],o[12]=-t[4]*t[9]*t[14]+t[4]*t[10]*t[13]+t[8]*t[5]*t[14]-t[8]*t[6]*t[13]-t[12]*t[5]*t[10]+t[12]*t[6]*t[9],o[1]=-t[1]*t[10]*t[15]+t[1]*t[11]*t[14]+t[9]*t[2]*t[15]-t[9]*t[3]*t[14]-t[13]*t[2]*t[11]+t[13]*t[3]*t[10],o[5]=t[0]*t[10]*t[15]-t[0]*t[11]*t[14]-t[8]*t[2]*t[15]+t[8]*t[3]*t[14]+t[12]*t[2]*t[11]-t[12]*t[3]*t[10],o[9]=-t[0]*t[9]*t[15]+t[0]*t[11]*t[13]+t[8]*t[1]*t[15]-t[8]*t[3]*t[13]-t[12]*t[1]*t[11]+t[12]*t[3]*t[9],o[13]=t[0]*t[9]*t[14]-t[0]*t[10]*t[13]-t[8]*t[1]*t[14]+t[8]*t[2]*t[13]+t[12]*t[1]*t[10]-t[12]*t[2]*t[9],o[2]=t[1]*t[6]*t[15]-t[1]*t[7]*t[14]-t[5]*t[2]*t[15]+t[5]*t[3]*t[14]+t[13]*t[2]*t[7]-t[13]*t[3]*t[6],o[6]=-t[0]*t[6]*t[15]+t[0]*t[7]*t[14]+t[4]*t[2]*t[15]-t[4]*t[3]*t[14]-t[12]*t[2]*t[7]+t[12]*t[3]*t[6],o[10]=t[0]*t[5]*t[15]-t[0]*t[7]*t[13]-t[4]*t[1]*t[15]+t[4]*t[3]*t[13]+t[12]*t[1]*t[7]-t[12]*t[3]*t[5],o[14]=-t[0]*t[5]*t[14]+t[0]*t[6]*t[13]+t[4]*t[1]*t[14]-t[4]*t[2]*t[13]-t[12]*t[1]*t[6]+t[12]*t[2]*t[5],o[3]=-t[1]*t[6]*t[11]+t[1]*t[7]*t[10]+t[5]*t[2]*t[11]-t[5]*t[3]*t[10]-t[9]*t[2]*t[7]+t[9]*t[3]*t[6],o[7]=t[0]*t[6]*t[11]-t[0]*t[7]*t[10]-t[4]*t[2]*t[11]+t[4]*t[3]*t[10]+t[8]*t[2]*t[7]-t[8]*t[3]*t[6],o[11]=-t[0]*t[5]*t[11]+t[0]*t[7]*t[9]+t[4]*t[1]*t[11]-t[4]*t[3]*t[9]-t[8]*t[1]*t[7]+t[8]*t[3]*t[5],o[15]=t[0]*t[5]*t[10]-t[0]*t[6]*t[9]-t[4]*t[1]*t[10]+t[4]*t[2]*t[9]+t[8]*t[1]*t[6]-t[8]*t[2]*t[5];let i=t[0]*o[0]+t[1]*o[4]+t[2]*o[8]+t[3]*o[12];i=i===0?1:1/i;for(let n=0;n<16;n++)o[n]*=i;return o}function Lt(e){let o=0;for(let t=0;t<e.length;t++){const i=(t+1)%e.length;o+=e[t].x*e[i].y-e[i].x*e[t].y}return o/2}function pe(e){let o=0,t=0;for(const i of e)o+=i.x,t+=i.y;return{x:o/e.length,y:t/e.length}}function Xt(e){const o=e.length;if(o<3)return[];const t=Lt(e)>0,i=Array.from({length:o},(a,m)=>m),n=[],s=(a,m,f)=>(m.x-a.x)*(f.y-a.y)-(m.y-a.y)*(f.x-a.x);let c=0;for(;i.length>3&&c++<1e4;){let a=!1;for(let m=0;m<i.length;m++){const f=i[(m-1+i.length)%i.length],v=i[m],E=i[(m+1)%i.length],y=e[f],T=e[v],k=e[E],p=s(y,T,k);if(t?p<=1e-12:p>=-1e-12)continue;let M=!1;for(const R of i){if(R===f||R===v||R===E)continue;const F=e[R],S=s(y,T,F),N=s(T,k,F),_=s(k,y,F);if(t?S>=0&&N>=0&&_>=0:S<=0&&N<=0&&_<=0){M=!0;break}}if(!M){n.push(f,v,E),i.splice(m,1),a=!0;break}}if(!a)break}return i.length===3&&n.push(i[0],i[1],i[2]),n}function de(e,o){return e.map(t=>({x:t.x,y:t.y})),(t,i)=>{for(let c=0;c<o.length;c+=3){const a=e[o[c]],m=e[o[c+1]],f=e[o[c+2]],v=(m.y-f.y)*(a.x-f.x)+(f.x-m.x)*(a.y-f.y);if(Math.abs(v)<1e-12)continue;const E=((m.y-f.y)*(t-f.x)+(f.x-m.x)*(i-f.y))/v,y=((f.y-a.y)*(t-f.x)+(a.x-f.x)*(i-f.y))/v,T=1-E-y;if(E>=-1e-6&&y>=-1e-6&&T>=-1e-6)return E*a.depth+y*m.depth+T*f.depth}let n=1/0,s=1.5;for(const c of e){const a=(c.x-t)**2+(c.y-i)**2;a<n&&(n=a,s=c.depth)}return s}}function fe(e,o){const t=e.length,i=Lt(e)>0,n=[];for(let s=0;s<t;s++){const c=e[(s-1+t)%t],a=e[s],m=e[(s+1)%t],f=Tt({x:a.x-c.x,y:a.y-c.y}),v=Tt({x:m.x-a.x,y:m.y-a.y}),E=i?{x:f.y,y:-f.x}:{x:-f.y,y:f.x},y=i?{x:v.y,y:-v.x}:{x:-v.y,y:v.x},T=Tt({x:E.x+y.x,y:E.y+y.y}),k=Math.max(.3,T.x*E.x+T.y*E.y),p=o/k;n.push({x:a.x+T.x*p,y:a.y+T.y*p})}return n}function Tt(e){const o=Math.hypot(e.x,e.y)||1;return{x:e.x/o,y:e.y/o}}function mt(e){const o=/^#?([0-9a-f]{6})$/i.exec(e);if(!o)return[1,1,1];const t=parseInt(o[1],16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}function me(e,o,t){return Math.min(t,Math.max(o,e))}function et(e,o,t){return e+(o-e)*t}const xt=0,ve=.08;class Mt{constructor(){this.pos=[],this.nrm=[],this.idx=[]}vert(o,t,i,n,s,c){return this.pos.push(o,t,i),this.nrm.push(n,s,c),this.pos.length/3-1}tri(o,t,i){this.idx.push(o,t,i)}build(){return{positions:new Float32Array(this.pos),normals:new Float32Array(this.nrm),indices:new Uint32Array(this.idx)}}}function Ct(e,o,t,i,n,s,c){const a=o-i/2,m=o+i/2,f=t-n/2,v=t+n/2,E=c,y=s;let T=e.vert(a,y,f,0,1,0),k=e.vert(m,y,f,0,1,0),p=e.vert(m,y,v,0,1,0),M=e.vert(a,y,v,0,1,0);e.tri(T,p,k),e.tri(T,M,p);const R=(F,S,N)=>{const _=e.vert(F[0],y,F[1],N[0],0,N[1]),d=e.vert(S[0],y,S[1],N[0],0,N[1]),X=e.vert(S[0],E,S[1],N[0],0,N[1]),r=e.vert(F[0],E,F[1],N[0],0,N[1]);e.tri(_,X,d),e.tri(_,r,X)};R([a,f],[m,f],[0,-1]),R([m,f],[m,v],[1,0]),R([m,v],[a,v],[0,1]),R([a,v],[a,f],[-1,0])}function _t(e){const o=e.vertices,t=o.map(r=>({x:r.x,y:r.y})),i=Lt(t)>0,n=Xt(t),s=de(o,n),c=pe(t),a=xt-ve,m=[],f=new Array(o.length*3).fill(0);for(const r of o)m.push(r.x,-r.depth,r.y);for(let r=0;r<n.length;r+=3){const[x,P,z]=[n[r],n[r+1],n[r+2]],D=[o[x].x,-o[x].depth,o[x].y],V=[o[P].x,-o[P].depth,o[P].y],B=[o[z].x,-o[z].depth,o[z].y],L=[V[0]-D[0],V[1]-D[1],V[2]-D[2]],I=[B[0]-D[0],B[1]-D[1],B[2]-D[2]],j=[L[1]*I[2]-L[2]*I[1],L[2]*I[0]-L[0]*I[2],L[0]*I[1]-L[1]*I[0]],$=j[1]>=0?1:-1;for(const w of[x,P,z])f[w*3]+=j[0]*$,f[w*3+1]+=j[1]*$,f[w*3+2]+=j[2]*$}for(let r=0;r<o.length;r++){const x=Math.hypot(f[r*3],f[r*3+1],f[r*3+2])||1;f[r*3]/=x,f[r*3+1]/=x,f[r*3+2]/=x}const v={positions:new Float32Array(m),normals:new Float32Array(f),indices:new Uint32Array(n)},E=new Mt,y=o.length;for(let r=0;r<y;r++){const x=o[r],P=o[(r+1)%y],z=P.x-x.x,D=P.y-x.y,V=Math.hypot(z,D)||1;let B=i?-D/V:D/V,L=i?z/V:-z/V;const I=(x.x+P.x)/2,j=(x.y+P.y)/2;(c.x-I)*B+(c.y-j)*L<0&&(B=-B,L=-L);const $=E.vert(x.x,xt,x.y,B,0,L),w=E.vert(P.x,xt,P.y,B,0,L),l=E.vert(P.x,-P.depth,P.y,B,0,L),u=E.vert(x.x,-x.depth,x.y,B,0,L);i?(E.tri($,w,l),E.tri($,l,u)):(E.tri($,l,w),E.tri($,u,l))}const T=E.build(),k=new Mt;for(const r of e.steps){const x=Math.max(1,r.steps);let P=0;for(const[D,V]of[[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h],[r.x+r.w/2,r.y+r.h/2]])P=Math.max(P,s(D,V));const z=Math.max(r.bottomDepth+.15,P+.05);for(let D=0;D<x;D++){const V=x===1?1:D/(x-1),B=et(r.topDepth,r.bottomDepth,V);let L=r.x+r.w/2,I=r.y+r.h/2,j=r.w,$=r.h;r.dir===0?(j=r.w/x,L=r.x+j*(D+.5)):r.dir===1?(j=r.w/x,L=r.x+r.w-j*(D+.5)):r.dir===2?($=r.h/x,I=r.y+$*(D+.5)):($=r.h/x,I=r.y+r.h-$*(D+.5)),Ct(k,L,I,j,$,-B,-z)}}for(const r of e.shallows){let x=0;for(const[z,D]of[[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h],[r.x+r.w/2,r.y+r.h/2]])x=Math.max(x,s(z,D));const P=Math.max(r.depth+.15,x+.05);Ct(k,r.x+r.w/2,r.y+r.h/2,r.w,r.h,-r.depth,-P)}const p=k.build(),M=new Mt,R=fe(t,.35),F=xt+.02;for(let r=0;r<y;r++){const x=(r+1)%y,P=t[r],z=t[x],D=R[r],V=R[x],B=M.vert(P.x,F,P.y,0,1,0),L=M.vert(z.x,F,z.y,0,1,0),I=M.vert(V.x,F,V.y,0,1,0),j=M.vert(D.x,F,D.y,0,1,0);i?(M.tri(B,I,L),M.tri(B,j,I)):(M.tri(B,L,I),M.tri(B,I,j))}const S=M.build(),N=e.lighting.lights.map(r=>{const x=Math.min(r.edge,y-1),P=o[x],z=o[(x+1)%y],D=Math.min(1,Math.max(0,r.t)),V=et(P.x,z.x,D),B=et(P.y,z.y,D),L=z.x-P.x,I=z.y-P.y,j=Math.hypot(L,I)||1;let $=i?-I/j:I/j,w=i?L/j:-L/j;const l=V,u=B;return(c.x-l)*$+(c.y-u)*w<0&&($=-$,w=-w),{pos:[V+$*.04,-r.depth,B+w*.04],inward:[$,0,w]}}),_=o.map(r=>r.x),d=o.map(r=>r.y),X=Math.max(...o.map(r=>r.depth),.5);return{floor:v,walls:T,zones:p,coping:S,waterLevel:a,center:[c.x,-X/2,c.y],maxDepth:X,bounds:{minX:Math.min(..._),maxX:Math.max(..._),minZ:Math.min(...d),maxZ:Math.max(...d)},lightMounts:N}}function xe(e,o,t){const i=Math.max(2,Math.ceil((e.maxX-e.minX)/o)+1),n=Math.max(2,Math.ceil((e.maxZ-e.minZ)/o)+1),s=[];for(let a=0;a<n;a++)for(let m=0;m<i;m++){const f=e.minX+m/(i-1)*(e.maxX-e.minX),v=e.minZ+a/(n-1)*(e.maxZ-e.minZ);s.push(f,t,v)}const c=[];for(let a=0;a<n-1;a++)for(let m=0;m<i-1;m++){const f=a*i+m,v=f+1,E=f+i,y=E+1;c.push(f,E,v,v,E,y)}return{positions:new Float32Array(s),normals:new Float32Array(s.length).fill(0),indices:new Uint32Array(c)}}function Dt(e,o){const t=e.map(s=>({x:s.x,y:s.y})),i=Xt(t),n=[];for(const s of e)n.push(s.x,o,s.y);return{positions:new Float32Array(n),normals:new Float32Array(n.length).fill(0),indices:new Uint32Array(i)}}const ge=16,pt=512;function ye(e){const o=document.createElement("canvas");o.width=pt,o.height=pt;const t=o.getContext("2d"),i=ge,n=pt/i,s=Math.max(.5,e.groutWidth/e.tileSize*n);t.fillStyle=e.groutColor,t.fillRect(0,0,pt,pt);const[c,a,m]=mt(e.colorA).map(F=>F*255),[f,v,E]=mt(e.colorB).map(F=>F*255),[y,T,k]=mt(e.colorC).map(F=>F*255);let p=12345;const M=()=>(p=p*1103515245+12345&2147483647,p/2147483647);for(let F=0;F<i;F++)for(let S=0;S<i;S++){const N=M();let _=c,d=a,X=m;N<e.mixC?(_=y,d=T,X=k):N<e.mixC+e.mixB&&(_=f,d=v,X=E);const r=1+(M()*2-1)*e.jitter;_=Math.min(255,_*r),d=Math.min(255,d*r),X=Math.min(255,X*r),t.fillStyle=`rgb(${_|0},${d|0},${X|0})`;const x=S*n+s/2,P=F*n+s/2,z=n-s;t.fillRect(x,P,z,z),t.fillStyle="rgba(255,255,255,0.06)",t.fillRect(x,P,z,z*.35)}const R=e.tileSize/1e3*i;return{canvas:o,worldSize:R}}const ht=8;function Nt(e,o,t){const i=Math.max(0,e),n={count:Math.min(t,ht),dir:new Float32Array(ht*2),amp:new Float32Array(ht),len:new Float32Array(ht),omega:new Float32Array(ht)},s=.45+i*.32,c=Math.min(.008+i*.0075,.1)*o,a=.6;for(let m=0;m<n.count;m++){const f=m/Math.max(1,n.count-1),v=a+(m%2===0?1:-1)*f*.9+m*.13;n.dir[m*2]=Math.cos(v),n.dir[m*2+1]=Math.sin(v);const E=s*(1-f*.55)*(1+m*.07);n.len[m]=E,n.amp[m]=c*(1-f*.62)/(1+m*.35);const y=2*Math.PI/E;n.omega[m]=Math.sqrt(9.81*y)*.85}return n}const Vt=`
const int MAX_WAVES = ${ht};
uniform int uWaveCount;
uniform vec2 uWaveDir[MAX_WAVES];
uniform float uWaveAmp[MAX_WAVES];
uniform float uWaveLen[MAX_WAVES];
uniform float uWaveOmega[MAX_WAVES];
uniform float uTime;

float waveH(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < MAX_WAVES; i++) {
    if (i >= uWaveCount) break;
    float k = 6.28318530718 / uWaveLen[i];
    float ph = k * dot(uWaveDir[i], p) - uWaveOmega[i] * uTime;
    h += uWaveAmp[i] * sin(ph);
  }
  return h;
}

vec3 waveN(vec2 p) {
  float dx = 0.0, dz = 0.0;
  for (int i = 0; i < MAX_WAVES; i++) {
    if (i >= uWaveCount) break;
    float k = 6.28318530718 / uWaveLen[i];
    float ph = k * dot(uWaveDir[i], p) - uWaveOmega[i] * uTime;
    float c = uWaveAmp[i] * k * cos(ph);
    dx += uWaveDir[i].x * c;
    dz += uWaveDir[i].y * c;
  }
  return normalize(vec3(-dx, 1.0, -dz));
}
`,we=`
uniform float uWaterLevel;
uniform vec3 uSunDir;      // 光线传播方向(向下),已归一化
uniform float uCausticStrength;

vec3 refractHit(vec2 xz, float floorY) {
  float h = waveH(xz);
  vec3 S = vec3(xz.x, uWaterLevel + h, xz.y);
  vec3 N = waveN(xz);
  vec3 R = refract(normalize(uSunDir), N, 0.7519); // 空气->水 1/1.33
  float ry = min(R.y, -0.08);
  float t = (floorY - S.y) / ry;
  return S + R * max(t, 0.0);
}

float causticIntensity(vec3 wp) {
  float e = 0.06;
  vec3 c0 = refractHit(wp.xz, wp.y);
  vec3 cx = refractHit(wp.xz + vec2(e, 0.0), wp.y);
  vec3 cz = refractHit(wp.xz + vec2(0.0, e), wp.y);
  vec2 d1 = cx.xz - c0.xz;
  vec2 d2 = cz.xz - c0.xz;
  float a0 = e * e;
  float a1 = abs(d1.x * d2.y - d1.y * d2.x);
  float ratio = a0 / max(a1, 1e-5);
  // ratio≈1 为均匀光,>1 汇聚,<1 发散;映射到可用亮度区间
  float c = clamp((ratio - 0.55) * 0.9, 0.0, 3.0);
  return pow(c, 1.4) * uCausticStrength;
}
`;class be{constructor(){this.target=[0,-.8,0],this.theta=Math.PI*.25,this.phi=Math.PI*.28,this.dist=12,this.fov=55*Math.PI/180,this.invertY=!1}eye(){const o=Math.cos(this.phi),t=Math.sin(this.phi);return[this.target[0]+this.dist*o*Math.cos(this.theta),this.target[1]+this.dist*t,this.target[2]+this.dist*o*Math.sin(this.theta)]}view(){return le(this.eye(),this.target,[0,1,0])}proj(o){return ce(this.fov,o,.05,300)}viewProj(o){return he(this.proj(o),this.view())}invViewProj(o){return ue(this.viewProj(o))}basis(){const o=this.eye(),t=[this.target[0]-o[0],this.target[1]-o[1],this.target[2]-o[2]],i=Math.hypot(...t)||1,n=[t[0]/i,t[1]/i,t[2]/i],s=[n[2],0,-n[0]],c=Math.hypot(...s)||1,a=[s[0]/c,0,s[2]/c],m=[a[1]*n[2]-a[2]*n[1],a[2]*n[0]-a[0]*n[2],a[0]*n[1]-a[1]*n[0]];return{right:a,up:m}}rotate(o,t){this.theta-=o*.005;const i=this.invertY?-1:1;this.phi+=t*.005*i,this.phi=Math.max(-1.35,Math.min(1.5,this.phi))}zoom(o){this.dist*=o>0?1.1:.9,this.dist=Math.max(.5,Math.min(80,this.dist))}pan(o,t){const{right:i,up:n}=this.basis(),s=this.dist*.0016;this.target[0]-=i[0]*o*s,this.target[2]-=i[2]*o*s,this.target[0]+=n[0]*t*s,this.target[1]+=n[1]*t*s,this.target[2]+=n[2]*t*s,this.target[1]=Math.max(-6,Math.min(6,this.target[1]))}getPose(){return{tx:this.target[0],ty:this.target[1],tz:this.target[2],theta:this.theta,phi:this.phi,dist:this.dist}}setPose(o){this.target=[o.tx,o.ty,o.tz],this.theta=o.theta,this.phi=o.phi,this.dist=o.dist}}function Gt(e,o){let t=!1,i=!1,n=0,s=0;const c=new Map;let a=0;const m=T=>{if(e.setPointerCapture(T.pointerId),c.set(T.pointerId,{x:T.clientX,y:T.clientY}),c.size===2){const[k,p]=[...c.values()];a=Math.hypot(k.x-p.x,k.y-p.y),t=!1;return}t=!0,i=T.button===2||T.shiftKey,n=T.clientX,s=T.clientY},f=T=>{if(c.has(T.pointerId)&&c.set(T.pointerId,{x:T.clientX,y:T.clientY}),c.size===2){const[M,R]=[...c.values()],F=Math.hypot(M.x-R.x,M.y-R.y);a>0&&F>0&&(o.dist*=a/F,o.dist=Math.max(.5,Math.min(80,o.dist))),a=F;return}if(!t)return;const k=T.clientX-n,p=T.clientY-s;n=T.clientX,s=T.clientY,i?o.pan(k,p):o.rotate(k,p)},v=T=>{c.delete(T.pointerId),c.size===0&&(t=!1,a=0)},E=T=>{T.preventDefault(),o.zoom(T.deltaY)},y=T=>T.preventDefault();return e.addEventListener("pointerdown",m),e.addEventListener("pointermove",f),e.addEventListener("pointerup",v),e.addEventListener("pointercancel",v),e.addEventListener("wheel",E,{passive:!1}),e.addEventListener("contextmenu",y),()=>{e.removeEventListener("pointerdown",m),e.removeEventListener("pointermove",f),e.removeEventListener("pointerup",v),e.removeEventListener("pointercancel",v),e.removeEventListener("wheel",E),e.removeEventListener("contextmenu",y)}}function It(e,o,t){const i=e.createShader(o);if(e.shaderSource(i,t),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS)){const n=e.getShaderInfoLog(i);throw e.deleteShader(i),new Error(`着色器编译失败: ${n}
${t.split(`
`).slice(0,8).join(`
`)}`)}return i}function at(e,o,t){const i=It(e,e.VERTEX_SHADER,o),n=It(e,e.FRAGMENT_SHADER,t),s=e.createProgram();if(e.attachShader(s,i),e.attachShader(s,n),e.linkProgram(s),e.deleteShader(i),e.deleteShader(n),!e.getProgramParameter(s,e.LINK_STATUS))throw new Error(`着色器链接失败: ${e.getProgramInfoLog(s)}`);return{prog:s,uniforms:new Map}}function A(e,o,t){return e.uniforms.has(t)||e.uniforms.set(t,o.getUniformLocation(e.prog,t)),e.uniforms.get(t)}function tt(e,o,t,i){const n=e.createVertexArray();e.bindVertexArray(n);const s=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,s),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0);let c=null;t&&(c=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,c),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,0,0));const a=e.createBuffer();return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,a),e.bufferData(e.ELEMENT_ARRAY_BUFFER,i,e.STATIC_DRAW),e.bindVertexArray(null),{vao:n,count:i.length,vbo:s,nbo:c,ibo:a}}function J(e,o){o&&(e.deleteVertexArray(o.vao),e.deleteBuffer(o.vbo),o.nbo&&e.deleteBuffer(o.nbo),e.deleteBuffer(o.ibo))}function Ut(e,o,t,i){const n=e.createTexture();e.bindTexture(e.TEXTURE_2D,n),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,o,t,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const s=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0);const c=e.createRenderbuffer();e.bindRenderbuffer(e.RENDERBUFFER,c);const a=i?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24;return e.renderbufferStorage(e.RENDERBUFFER,a,o,t),e.framebufferRenderbuffer(e.FRAMEBUFFER,i?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,e.RENDERBUFFER,c),e.bindFramebuffer(e.FRAMEBUFFER,null),{fbo:s,color:n,w:o,h:t}}function lt(e,o){o&&(e.deleteFramebuffer(o.fbo),e.deleteTexture(o.color))}const Q=`#version 300 es
precision highp float;
precision highp int;
`,Ht=`
uniform vec3 uSunDir;       // 光线传播方向,太阳在 -uSunDir
uniform float uNight;       // 0 白天 1 夜晚
uniform float uSunIntensity;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 skyColor(vec3 dir) {
  float y = clamp(dir.y, -1.0, 1.0);
  // 白天渐变
  vec3 dayZen = vec3(0.18, 0.42, 0.78);
  vec3 dayHor = vec3(0.75, 0.85, 0.92);
  vec3 day = mix(dayHor, dayZen, pow(max(y, 0.0), 0.55));
  // 地面以下
  day = mix(day, vec3(0.35, 0.38, 0.33), smoothstep(0.0, -0.25, y));
  // 太阳
  vec3 sunPos = -uSunDir;
  float sd = max(dot(dir, sunPos), 0.0);
  float disc = smoothstep(0.9993, 0.9997, sd);
  float glow = pow(sd, 600.0) * 0.9 + pow(sd, 24.0) * 0.12;
  day += (vec3(1.0, 0.95, 0.85) * (disc * 8.0 + glow)) * uSunIntensity;
  // 夜晚
  vec3 nightZen = vec3(0.01, 0.02, 0.05);
  vec3 nightHor = vec3(0.05, 0.08, 0.14);
  vec3 night = mix(nightHor, nightZen, pow(max(y, 0.0), 0.5));
  night = mix(night, vec3(0.02, 0.03, 0.04), smoothstep(0.0, -0.25, y));
  // 星星
  vec3 sp = floor(dir * 220.0);
  float star = step(0.9985, hash13(sp)) * max(y, 0.0);
  night += vec3(star) * 0.8;
  // 月亮(固定在太阳对面附近)
  vec3 moonPos = normalize(vec3(0.4, 0.55, -0.6));
  float md = max(dot(dir, moonPos), 0.0);
  night += vec3(0.9, 0.95, 1.0) * (smoothstep(0.9995, 0.9998, md) * 2.0 + pow(md, 800.0) * 0.3);
  return mix(day, night, uNight);
}
`,Yt=Q+`
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.9999, 1.0);
}
`,Ee=Q+`
in vec2 vUv;
out vec4 fragColor;
uniform mat4 uInvViewProj;
${Ht}
void main() {
  // 用远/近平面各取一点求视线方向
  vec4 p1 = uInvViewProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec4 p0 = uInvViewProj * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec3 dir = normalize(p1.xyz / p1.w - p0.xyz / p0.w);
  fragColor = vec4(skyColor(dir), 1.0);
}
`,Te=Q+`
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
uniform mat4 uViewProj;
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vWorldPos = aPos;
  vNormal = aNrm;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`,Me=Q+`
in vec3 vWorldPos;
in vec3 vNormal;
out vec4 fragColor;

uniform sampler2D uTileTex;
uniform float uTileWorld;     // 贴图物理尺寸(米)
uniform float uUseTile;       // 1 瓷砖 0 纯色
uniform vec3 uPlainColor;
uniform vec3 uCamPos;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform float uNight;
uniform vec3 uWaterAbsorb;    // 水体吸收系数(rgb)
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uCamUnder;      // 相机在水下
uniform int uLightCount;
uniform vec3 uLightPos[4];
uniform vec3 uLightColor[4];  // 已乘强度

${Vt}
${we}

vec3 tileColor(vec3 wp, vec3 n) {
  vec3 an = abs(n);
  an /= (an.x + an.y + an.z + 1e-6);
  vec3 cx = texture(uTileTex, wp.zy / uTileWorld).rgb;
  vec3 cy = texture(uTileTex, wp.xz / uTileWorld).rgb;
  vec3 cz = texture(uTileTex, wp.xy / uTileWorld).rgb;
  return cx * an.x + cy * an.y + cz * an.z;
}

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 base = uUseTile > 0.5 ? tileColor(vWorldPos, N) : uPlainColor;

  // 焦散:跟随波浪实时计算
  float caust = causticIntensity(vWorldPos);

  // 太阳漫反射 + 焦散汇聚
  float ndl = max(dot(N, -uSunDir), 0.0);
  vec3 sun = uSunColor * ndl * (1.0 + caust * 2.2);

  // 水下灯(衰减 + 焦散调制)
  vec3 lamp = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= uLightCount) break;
    vec3 L = uLightPos[i] - vWorldPos;
    float d = length(L);
    L /= d;
    float atten = 1.0 / (1.0 + 1.2 * d * d);          // 平方衰减
    atten *= exp(-d * 0.22);                           // 水体额外吸收
    float nl = max(dot(N, L), 0.0);
    lamp += uLightColor[i] * (nl * atten) * (0.7 + 0.9 * caust);
  }

  vec3 col = base * (uAmbient + sun + lamp);

  // 水深吸收(红光先衰减)
  float depth = max(uWaterLevel - vWorldPos.y, 0.0);
  col *= exp(-uWaterAbsorb * depth);

  // 相机在水下时的距离雾
  if (uCamUnder > 0.5) {
    float dist = length(uCamPos - vWorldPos);
    float f = 1.0 - exp(-dist * uFogDensity);
    col = mix(col, uFogColor, f);
  }

  fragColor = vec4(col, 1.0);
}
`,Pe=Q+`
layout(location=0) in vec3 aPos;
uniform mat4 uViewProj;
${Vt}
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vec3 p = aPos;
  p.y += waveH(p.xz);
  vWorldPos = p;
  vNormal = waveN(p.xz);
  gl_Position = uViewProj * vec4(p, 1.0);
}
`,Ae=Q+`
in vec3 vWorldPos;
in vec3 vNormal;
out vec4 fragColor;

uniform sampler2D uSceneTex;
uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform float uCamUnder;
uniform vec3 uWaterTint;    // 水色(乘算)
uniform float uRefrK;       // 折射扰动强度
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uSunColor;

${Ht}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);
  vec2 suv = gl_FragCoord.xy / uResolution;
  vec3 col;

  if (uCamUnder < 0.5) {
    // ---- 水上视角:菲涅尔混合天空反射与水下折射 ----
    if (!gl_FrontFacing) N = -N;
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec2 offset = N.xz * uRefrK;
    vec3 refr = texture(uSceneTex, suv + offset).rgb * uWaterTint;
    vec3 R = reflect(-V, N);
    vec3 sky = skyColor(R);
    col = mix(refr, sky, F);
    // 太阳高光
    float spec = pow(max(dot(R, -uSunDir), 0.0), 240.0);
    col += uSunColor * spec * 2.0 * (1.0 - uNight);
  } else {
    // ---- 水下视角:斯涅尔窗口 + 全内反射 ----
    vec3 Nf = gl_FrontFacing ? -N : N; // 法线朝向相机(向下)
    float cosI = clamp(dot(Nf, V), 0.0, 1.0);
    const float COS_CRIT = 0.660; // 临界角 48.75°
    if (cosI > COS_CRIT) {
      // 斯涅尔窗口:看到水上世界(场景纹理里是天空)
      vec2 offset = N.xz * uRefrK * 2.5;
      col = texture(uSceneTex, suv + offset).rgb;
      col *= vec3(0.85, 0.95, 1.0);
    } else {
      // 全内反射:反射回水下,近似为水色微光
      col = uFogColor * (0.55 + 0.45 * max(-N.y, 0.0));
    }
    float dist = length(uCamPos - vWorldPos);
    float f = 1.0 - exp(-dist * uFogDensity * 0.6);
    col = mix(col, uFogColor, f);
  }

  fragColor = vec4(col, 1.0);
}
`,Wt=Yt,Se=Q+`
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
void main() { fragColor = texture(uTex, vUv); }
`,Fe=Q+`
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uInvRes;
void main() {
  vec3 rgbNW = texture(uTex, vUv + vec2(-1.0, -1.0) * uInvRes).rgb;
  vec3 rgbNE = texture(uTex, vUv + vec2( 1.0, -1.0) * uInvRes).rgb;
  vec3 rgbSW = texture(uTex, vUv + vec2(-1.0,  1.0) * uInvRes).rgb;
  vec3 rgbSE = texture(uTex, vUv + vec2( 1.0,  1.0) * uInvRes).rgb;
  vec3 rgbM  = texture(uTex, vUv).rgb;
  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lNW = dot(rgbNW, luma), lNE = dot(rgbNE, luma);
  float lSW = dot(rgbSW, luma), lSE = dot(rgbSE, luma), lM = dot(rgbM, luma);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float dirReduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = clamp(dir * rcpDirMin, -8.0, 8.0) * uInvRes;
  vec3 rgbA = 0.5 * (texture(uTex, vUv + dir * (1.0/3.0 - 0.5)).rgb +
                     texture(uTex, vUv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(uTex, vUv + dir * -0.5).rgb +
                                   texture(uTex, vUv + dir *  0.5).rgb);
  float lB = dot(rgbB, luma);
  fragColor = vec4((lB < lMin || lB > lMax) ? rgbA : rgbB, 1.0);
}
`,Re=Q+`
uniform vec3 uLightPos[4];
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform mat4 uViewProj;
uniform float uGlowSize;
flat out vec3 vColor;
out vec2 vUv;
uniform vec4 uGlow[4]; // rgb * intensity, w = on
uniform int uLightCount;
void main() {
  int i = gl_VertexID / 6;
  int c = gl_VertexID % 6;
  // 用顶点ID展开两个三角形,无需顶点缓冲
  vec2 quad[6];
  quad[0]=vec2(-1.0,-1.0); quad[1]=vec2(1.0,-1.0); quad[2]=vec2(1.0,1.0);
  quad[3]=vec2(-1.0,-1.0); quad[4]=vec2(1.0,1.0); quad[5]=vec2(-1.0,1.0);
  vec2 q = quad[c];
  vec3 wp = uLightPos[i] + (uCamRight * q.x + uCamUp * q.y) * uGlowSize;
  vUv = q;
  vColor = uGlow[i].rgb;
  if (i >= uLightCount || uGlow[i].w < 0.5) wp = vec3(0.0, -1000.0, 0.0);
  gl_Position = uViewProj * vec4(wp, 1.0);
}
`,Le=Q+`
flat in vec3 vColor;
in vec2 vUv;
out vec4 fragColor;
void main() {
  float r2 = dot(vUv, vUv);
  float a = exp(-r2 * 4.5) * smoothstep(1.0, 0.6, r2);
  fragColor = vec4(vColor * a, 1.0);
}
`,Ce=Q+`
layout(location=0) in vec3 aPos;
uniform mat4 uViewProj;
void main() { gl_Position = uViewProj * vec4(aPos, 1.0); }
`,_e=Q+`
out vec4 fragColor;
void main() { fragColor = vec4(0.0); }
`,dt={low:{renderScale:.7,maxDpr:1,waves:2,waterSpacing:.22,fxaa:!1},medium:{renderScale:1,maxDpr:1.5,waves:4,waterSpacing:.12,fxaa:!0},high:{renderScale:1,maxDpr:2,waves:8,waterSpacing:.06,fxaa:!0}};class qt{constructor(o,t,i){this.camera=new be,this.quality="medium",this.tileWorld=.4,this.sceneFbo=null,this.compFbo=null,this.time=0,this.fps=0,this.fpsEma=0,this.canvas=o,this.project=t,this.quality=i;const n=o.getContext("webgl2",{antialias:!1,alpha:!1,depth:!0,stencil:!0,preserveDrawingBuffer:!1,powerPreference:"high-performance"});if(!n)throw new Error("当前浏览器不支持 WebGL2");this.gl=n,this.skyProg=at(n,Yt,Ee),this.poolProg=at(n,Te,Me),this.waterProg=at(n,Pe,Ae),this.blitProg=at(n,Wt,Se),this.fxaaProg=at(n,Wt,Fe),this.glowProg=at(n,Re,Le),this.maskProg=at(n,Ce,_e),this.geom=_t(t),this.waves=Nt(t.water.windSpeed,t.water.waveAmp,dt[i].waves),this.floorMesh=tt(n,this.geom.floor.positions,this.geom.floor.normals,this.geom.floor.indices),this.wallMesh=tt(n,this.geom.walls.positions,this.geom.walls.normals,this.geom.walls.indices),this.zoneMesh=tt(n,this.geom.zones.positions,this.geom.zones.normals,this.geom.zones.indices),this.copingMesh=tt(n,this.geom.coping.positions,this.geom.coping.normals,this.geom.coping.indices),this.waterMesh=this.buildWaterMesh();const s=Dt(t.vertices,this.geom.waterLevel);this.maskMesh=tt(n,s.positions,null,s.indices),this.tileTex=n.createTexture(),this.updateTileTexture();const c=this.geom.center,a=Math.max(this.geom.bounds.maxX-this.geom.bounds.minX,this.geom.bounds.maxZ-this.geom.bounds.minZ);this.camera.target=[c[0],c[1],c[2]],this.camera.dist=a*1.5+2}buildWaterMesh(){const o=dt[this.quality],t=xe(this.geom.bounds,o.waterSpacing,this.geom.waterLevel);return tt(this.gl,t.positions,null,t.indices)}updateTileTexture(){const o=this.gl,{canvas:t,worldSize:i}=ye(this.project.tile);this.tileWorld=i,o.bindTexture(o.TEXTURE_2D,this.tileTex),o.texImage2D(o.TEXTURE_2D,0,o.RGBA8,o.RGBA,o.UNSIGNED_BYTE,t),o.generateMipmap(o.TEXTURE_2D),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR_MIPMAP_LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.REPEAT),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.REPEAT);const n=o.getExtension("EXT_texture_filter_anisotropic");if(n){const s=o.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT);o.texParameterf(o.TEXTURE_2D,n.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,s))}}updateParams(){this.waves=Nt(this.project.water.windSpeed,this.project.water.waveAmp,dt[this.quality].waves)}rebuildGeometry(){const o=this.gl;this.geom=_t(this.project),J(o,this.floorMesh),J(o,this.wallMesh),J(o,this.zoneMesh),J(o,this.copingMesh),J(o,this.waterMesh),J(o,this.maskMesh),this.floorMesh=tt(o,this.geom.floor.positions,this.geom.floor.normals,this.geom.floor.indices),this.wallMesh=tt(o,this.geom.walls.positions,this.geom.walls.normals,this.geom.walls.indices),this.zoneMesh=tt(o,this.geom.zones.positions,this.geom.zones.normals,this.geom.zones.indices),this.copingMesh=tt(o,this.geom.coping.positions,this.geom.coping.normals,this.geom.coping.indices),this.waterMesh=this.buildWaterMesh();const t=Dt(this.project.vertices,this.geom.waterLevel);this.maskMesh=tt(o,t.positions,null,t.indices)}setQuality(o){o!==this.quality&&(this.quality=o,J(this.gl,this.waterMesh),this.waterMesh=this.buildWaterMesh(),this.updateParams(),this.sceneFbo=null,this.compFbo=null)}resize(){const o=dt[this.quality],t=Math.min(window.devicePixelRatio||1,o.maxDpr)*o.renderScale,i=Math.max(2,Math.round(this.canvas.clientWidth*t)),n=Math.max(2,Math.round(this.canvas.clientHeight*t));(this.canvas.width!==i||this.canvas.height!==n)&&(this.canvas.width=i,this.canvas.height=n,this.sceneFbo&&(lt(this.gl,this.sceneFbo),this.sceneFbo=null),this.compFbo&&(lt(this.gl,this.compFbo),this.compFbo=null))}frame(o){const t=this.gl;if(this.time+=o,o>0){const g=1/o;this.fpsEma=this.fpsEma===0?g:et(this.fpsEma,g,.05),this.fps=Math.round(this.fpsEma)}this.resize();const i=this.canvas.width,n=this.canvas.height;(!this.sceneFbo||this.sceneFbo.w!==i||this.sceneFbo.h!==n)&&(this.sceneFbo&&lt(t,this.sceneFbo),this.compFbo&&lt(t,this.compFbo),this.sceneFbo=Ut(t,i,n,!1),this.compFbo=Ut(t,i,n,!0));const s=i/n,c=this.camera.viewProj(s),a=this.camera.invViewProj(s),m=this.camera.eye(),f=m[1]<this.geom.waterLevel?1:0,v=this.project.lighting,E=v.timeOfDay,y=(E-12)/12*Math.PI,T=Math.max(.06,Math.sin((E-6)/12*Math.PI))*Math.PI*.42,k=[Math.sin(y)*Math.cos(T),Math.sin(T),-Math.cos(y)*Math.cos(T)],p=[-k[0],-k[1],-k[2]],M=v.night?1:0,R=me(Math.sin((E-6)/12*Math.PI),0,1),F=(v.sunOn?v.sunIntensity:0)*(.25+.75*R)*(1-M),S=[1*F,.93*F,.82*F],N=M?[.035,.045,.07]:[.22+.1*R,.24+.1*R,.28+.08*R],_=this.project.water.clarity,[d,X,r]=mt(this.project.water.color),x=et(.9,.12,_),P=[(1-d*.9)*x*.5,(1-X*.9)*x*.28,(1-r*.9)*x*.15],z=et(.5,.06,_),D=M?[.01,.03,.05]:[d*.35+.02,X*.4+.04,r*.5+.06],V=[et(d+.55,1,_*.5),et(X+.55,1,_*.5),et(r+.55,1,_*.5)],B=this.project.lighting.lights.slice(0,4),L=new Float32Array(12),I=new Float32Array(12),j=new Float32Array(16);B.forEach((g,C)=>{const b=this.geom.lightMounts[C];if(!b)return;L.set(b.pos,C*3);const[W,Y,G]=mt(g.color),H=g.on?1:0,nt=M?1.6:.55;I.set([W*g.intensity*nt*H,Y*g.intensity*nt*H,G*g.intensity*nt*H],C*3),j.set([W*g.intensity*H*(M?1.5:.35),Y*g.intensity*H*(M?1.5:.35),G*g.intensity*H*(M?1.5:.35),H],C*4)});const $=g=>{t.uniform1i(A(g,t,"uWaveCount"),this.waves.count),t.uniform2fv(A(g,t,"uWaveDir[0]"),this.waves.dir),t.uniform1fv(A(g,t,"uWaveAmp[0]"),this.waves.amp),t.uniform1fv(A(g,t,"uWaveLen[0]"),this.waves.len),t.uniform1fv(A(g,t,"uWaveOmega[0]"),this.waves.omega),t.uniform1f(A(g,t,"uTime"),this.time)},w=g=>{t.uniform3fv(A(g,t,"uSunDir"),p),t.uniform1f(A(g,t,"uNight"),M),t.uniform1f(A(g,t,"uSunIntensity"),Math.max(F,.001))};t.bindFramebuffer(t.FRAMEBUFFER,this.sceneFbo.fbo),t.viewport(0,0,i,n),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.disable(t.DEPTH_TEST),t.depthMask(!1),t.useProgram(this.skyProg.prog),t.uniformMatrix4fv(A(this.skyProg,t,"uInvViewProj"),!1,a),w(this.skyProg),t.bindVertexArray(null),t.drawArrays(t.TRIANGLES,0,3),t.enable(t.DEPTH_TEST),t.depthMask(!0),t.depthFunc(t.LESS),t.useProgram(this.poolProg.prog),t.uniformMatrix4fv(A(this.poolProg,t,"uViewProj"),!1,c),t.uniform3fv(A(this.poolProg,t,"uCamPos"),m),t.uniform3fv(A(this.poolProg,t,"uSunColor"),S),t.uniform3fv(A(this.poolProg,t,"uAmbient"),N),t.uniform1f(A(this.poolProg,t,"uNight"),M),t.uniform3fv(A(this.poolProg,t,"uWaterAbsorb"),P),t.uniform1f(A(this.poolProg,t,"uFogDensity"),z),t.uniform3fv(A(this.poolProg,t,"uFogColor"),D),t.uniform1f(A(this.poolProg,t,"uCamUnder"),f),t.uniform1i(A(this.poolProg,t,"uLightCount"),B.length),t.uniform3fv(A(this.poolProg,t,"uLightPos[0]"),L),t.uniform3fv(A(this.poolProg,t,"uLightColor[0]"),I),t.uniform1f(A(this.poolProg,t,"uWaterLevel"),this.geom.waterLevel),t.uniform3fv(A(this.poolProg,t,"uSunDir"),p),t.uniform1f(A(this.poolProg,t,"uCausticStrength"),et(.4,1.1,_)),$(this.poolProg),t.uniform1f(A(this.poolProg,t,"uTileWorld"),this.tileWorld),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.tileTex),t.uniform1i(A(this.poolProg,t,"uTileTex"),0);const l=(g,C,b)=>{t.uniform1f(A(this.poolProg,t,"uUseTile"),C),b&&t.uniform3fv(A(this.poolProg,t,"uPlainColor"),b),t.bindVertexArray(g.vao),t.drawElements(t.TRIANGLES,g.count,t.UNSIGNED_INT,0)};if(l(this.floorMesh,1),l(this.wallMesh,1),this.zoneMesh.count>0&&l(this.zoneMesh,1),l(this.copingMesh,0,[.72,.7,.66]),t.bindFramebuffer(t.FRAMEBUFFER,this.compFbo.fbo),t.viewport(0,0,i,n),t.bindFramebuffer(t.READ_FRAMEBUFFER,this.sceneFbo.fbo),t.bindFramebuffer(t.DRAW_FRAMEBUFFER,this.compFbo.fbo),t.blitFramebuffer(0,0,i,n,0,0,i,n,t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT,t.NEAREST),t.bindFramebuffer(t.FRAMEBUFFER,this.compFbo.fbo),t.enable(t.STENCIL_TEST),t.stencilFunc(t.ALWAYS,1,255),t.stencilOp(t.KEEP,t.KEEP,t.REPLACE),t.stencilMask(255),t.clear(t.STENCIL_BUFFER_BIT),t.colorMask(!1,!1,!1,!1),t.depthMask(!1),t.disable(t.DEPTH_TEST),t.useProgram(this.maskProg.prog),t.uniformMatrix4fv(A(this.maskProg,t,"uViewProj"),!1,c),t.bindVertexArray(this.maskMesh.vao),t.drawElements(t.TRIANGLES,this.maskMesh.count,t.UNSIGNED_INT,0),t.colorMask(!0,!0,!0,!0),t.stencilFunc(t.EQUAL,1,255),t.stencilMask(0),t.enable(t.DEPTH_TEST),t.depthMask(!1),t.disable(t.CULL_FACE),t.useProgram(this.waterProg.prog),t.uniformMatrix4fv(A(this.waterProg,t,"uViewProj"),!1,c),t.uniform3fv(A(this.waterProg,t,"uCamPos"),m),t.uniform1f(A(this.waterProg,t,"uCamUnder"),f),t.uniform3fv(A(this.waterProg,t,"uWaterTint"),V),t.uniform1f(A(this.waterProg,t,"uRefrK"),.035),t.uniform3fv(A(this.waterProg,t,"uFogColor"),D),t.uniform1f(A(this.waterProg,t,"uFogDensity"),z),t.uniform3fv(A(this.waterProg,t,"uSunColor"),S),t.uniform2f(A(this.waterProg,t,"uResolution"),i,n),$(this.waterProg),w(this.waterProg),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.sceneFbo.color),t.uniform1i(A(this.waterProg,t,"uSceneTex"),0),t.bindVertexArray(this.waterMesh.vao),t.drawElements(t.TRIANGLES,this.waterMesh.count,t.UNSIGNED_INT,0),t.disable(t.STENCIL_TEST),t.depthMask(!0),B.length>0){const{right:g,up:C}=this.camera.basis();t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE),t.depthMask(!1),t.useProgram(this.glowProg.prog),t.uniformMatrix4fv(A(this.glowProg,t,"uViewProj"),!1,c),t.uniform3fv(A(this.glowProg,t,"uCamRight"),g),t.uniform3fv(A(this.glowProg,t,"uCamUp"),C),t.uniform1f(A(this.glowProg,t,"uGlowSize"),.55),t.uniform1i(A(this.glowProg,t,"uLightCount"),B.length),t.uniform3fv(A(this.glowProg,t,"uLightPos[0]"),L),t.uniform4fv(A(this.glowProg,t,"uGlow[0]"),j),t.bindVertexArray(null),t.drawArrays(t.TRIANGLES,0,B.length*6),t.disable(t.BLEND),t.depthMask(!0)}t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,i,n),t.disable(t.DEPTH_TEST);const u=dt[this.quality],U=u.fxaa?this.fxaaProg:this.blitProg;t.useProgram(U.prog),u.fxaa&&t.uniform2f(A(U,t,"uInvRes"),1/i,1/n),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.compFbo.color),t.uniform1i(A(U,t,"uTex"),0),t.bindVertexArray(null),t.drawArrays(t.TRIANGLES,0,3),t.enable(t.DEPTH_TEST)}screenshot(o){this.frame(0);const t=document.createElement("canvas");t.width=this.canvas.width,t.height=this.canvas.height;const i=t.getContext("2d");i.drawImage(this.canvas,0,0);const n=Math.round(t.width*.012),s=Math.round(t.width*.018),c=Math.round(s*.72);i.font=`${c}px system-ui, sans-serif`;const m=Math.max(...o.map(y=>i.measureText(y).width))+n*2,f=s*o.length+n*2,v=n,E=t.height-f-n;return i.fillStyle="rgba(8, 16, 24, 0.72)",i.beginPath(),i.roundRect(v,E,m,f,8),i.fill(),i.fillStyle="#e8f0f6",o.forEach((y,T)=>i.fillText(y,v+n,E+n+s*(T+.75))),t}dispose(){var t;const o=this.gl;J(o,this.floorMesh),J(o,this.wallMesh),J(o,this.zoneMesh),J(o,this.copingMesh),J(o,this.waterMesh),J(o,this.maskMesh),lt(o,this.sceneFbo),lt(o,this.compFbo),o.deleteTexture(this.tileTex);for(const i of[this.skyProg,this.poolProg,this.waterProg,this.blitProg,this.fxaaProg,this.glowProg,this.maskProg])o.deleteProgram(i.prog);(t=o.getExtension("WEBGL_lose_context"))==null||t.loseContext()}}function De(e,o){const t=o?vt(o):null;if(!t)return e.append(h("div",{class:"page"},[h("p",{},["项目不存在。"])])),{destroy(){}};const i=t,n=h("div",{class:"page-nopad",style:"display:flex;padding:14px;gap:14px"}),s=h("div",{class:"panel panel-side"}),c=h("div",{class:"panel panel-main"}),a=h("canvas",{class:"preview-canvas"}),m=h("div",{class:"canvas-wrap"},[a]);c.append(m),n.append(s,c),e.append(n);let f;try{f=new qt(a,i,wt().quality)}catch(S){return s.append(h("p",{},[S.message])),{destroy(){}}}f.camera.invertY=wt().invertY;const v=Gt(a,f.camera);let E=0,y=performance.now();const T=S=>{const N=Math.min(.1,(S-y)/1e3);y=S,f.frame(N),E=requestAnimationFrame(T)};E=requestAnimationFrame(T);let k=0;function p(S=!0){S&&(clearTimeout(k),k=window.setTimeout(()=>ot(i),400))}let M=0;function R(){clearTimeout(M),M=window.setTimeout(()=>f.updateTileTexture(),150),p()}function F(){s.innerHTML="",s.append(h("h2",{},["材质与灯光"])),s.append(h("h3",{},["池底马赛克"]));const S=i.tile;s.append(ct("主色",S.colorA,d=>{S.colorA=d,R()})),s.append(ct("配色 B",S.colorB,d=>{S.colorB=d,R()})),s.append(Z({label:"B 占比",min:0,max:.5,step:.01,value:S.mixB,onInput:d=>{S.mixB=d,R()}})),s.append(ct("配色 C",S.colorC,d=>{S.colorC=d,R()})),s.append(Z({label:"C 占比",min:0,max:.5,step:.01,value:S.mixC,onInput:d=>{S.mixC=d,R()}})),s.append(Z({label:"色差抖动",min:0,max:.5,step:.01,value:S.jitter,onInput:d=>{S.jitter=d,R()}})),s.append(ct("砖缝颜色",S.groutColor,d=>{S.groutColor=d,R()})),s.append(Z({label:"砖缝宽",min:1,max:6,step:.5,value:S.groutWidth,unit:"mm",onInput:d=>{S.groutWidth=d,R()}})),s.append(Z({label:"单片尺寸",min:10,max:100,step:5,value:S.tileSize,unit:"mm",onInput:d=>{S.tileSize=d,R()}})),s.append(h("h3",{},["水体与波浪"]));const N=i.water;s.append(ct("水色",N.color,d=>{N.color=d,p()})),s.append(Z({label:"清澈度",min:0,max:1,step:.01,value:N.clarity,onInput:d=>{N.clarity=d,p()}})),s.append(Z({label:"风速",min:0,max:12,step:.1,value:N.windSpeed,unit:" m/s",onInput:d=>{N.windSpeed=d,f.updateParams(),p()}})),s.append(Z({label:"波高倍率",min:.2,max:2,step:.05,value:N.waveAmp,onInput:d=>{N.waveAmp=d,f.updateParams(),p()}})),s.append(h("h3",{},["光照"]));const _=i.lighting;s.append(bt("夜景模式",_.night,d=>{_.night=d,p()})),s.append(bt("太阳光",_.sunOn,d=>{_.sunOn=d,p()})),s.append(Z({label:"时间",min:6,max:20,step:.25,value:_.timeOfDay,format:d=>`${Math.floor(d)}:${String(Math.round(d%1*60)).padStart(2,"0")}`,onInput:d=>{_.timeOfDay=d,p()}})),s.append(Z({label:"太阳强度",min:0,max:2,step:.05,value:_.sunIntensity,onInput:d=>{_.sunIntensity=d,p()}})),s.append(h("h3",{},["水下灯(最多 4 个)"])),_.lights.forEach((d,X)=>{const r=h("div",{style:"border:1px solid var(--border);border-radius:8px;padding:8px;margin:8px 0"});r.append(h("div",{style:"display:flex;align-items:center;gap:8px;margin-bottom:4px"},[h("b",{style:"flex:1"},[`灯 ${X+1}`]),(()=>{const x=h("input",{type:"checkbox"});return x.checked=d.on,x.addEventListener("change",()=>{d.on=x.checked,p()}),x})(),O("删除",()=>{_.lights.splice(X,1),p(),F()},"small danger")])),r.append(Rt("所在边",i.vertices.map((x,P)=>[String(P),`边 ${P+1}`]),String(Math.min(d.edge,i.vertices.length-1)),x=>{d.edge=+x,p()})),r.append(Z({label:"边上位置",min:.05,max:.95,step:.01,value:d.t,onInput:x=>{d.t=x,p()}})),r.append(Z({label:"安装水深",min:.3,max:2.5,step:.05,value:d.depth,unit:"m",onInput:x=>{d.depth=x,p()}})),r.append(ct("灯光颜色",d.color,x=>{d.color=x,p()})),r.append(Z({label:"亮度",min:0,max:2,step:.05,value:d.intensity,onInput:x=>{d.intensity=x,p()}})),s.append(r)}),_.lights.length<4&&s.append(O("+ 添加水下灯",()=>{const d={id:q(),edge:0,t:.5,depth:.8,color:"#cfe8ff",intensity:1,on:!0};_.lights.push(d),p(),F()},"small")),s.append(h("div",{style:"margin-top:14px"},[O("全屏预览 →",()=>location.hash=`#/preview/${i.id}`,"primary")]))}return F(),{destroy(){cancelAnimationFrame(E),clearTimeout(k),clearTimeout(M),v(),f.dispose(),ot(i)}}}function Ne(e,o){const t=o?vt(o):null;if(!t)return e.append(h("div",{class:"page"},[h("p",{},["项目不存在。"])])),{destroy(){}};const i=t,n=wt(),s=h("div",{class:"page-nopad"}),c=h("canvas",{class:"preview-canvas"});s.append(c),e.append(s);let a;try{a=new qt(c,i,n.quality)}catch(r){return s.append(h("p",{style:"padding:20px"},[r.message])),{destroy(){}}}a.camera.invertY=n.invertY;const m=Gt(c,a.camera),f=h("div",{class:"preview-overlay"}),v=h("span",{class:"chip"},["-- fps"]),E=h("select");for(const r of["low","medium","high"]){const x=h("option",{value:r},[`画质:${ft[r]}`]);r===n.quality&&(x.selected=!0),E.append(x)}E.addEventListener("change",()=>{a.setQuality(E.value),n.quality=E.value,yt(n),K(`画质已切换为「${ft[E.value]}」`)});const y=O(i.lighting.night?"☀ 切到白天":"☾ 切到夜景",()=>{i.lighting.night=!i.lighting.night,y.textContent=i.lighting.night?"☀ 切到白天":"☾ 切到夜景",ot(i)}),T=O("← 返回",()=>location.hash=`#/materials/${i.id}`),k=O("书签",()=>R.classList.toggle("open")),p=O("截图",S);f.append(T,h("span",{class:"chip"},[i.name]),v,E,y,k,p),s.append(f);const M=h("div",{class:"preview-hint"},["拖动旋转 · 滚轮/双指缩放 · 右键或 Shift+拖动平移 · 向下看可潜入水下"]);s.append(M);const R=h("div",{class:"bookmark-panel"});function F(){R.innerHTML="",R.append(h("div",{style:"display:flex;gap:6px;margin-bottom:8px"},[h("b",{style:"flex:1"},["视角书签"]),O("+ 存当前",()=>{const r=`视角 ${i.bookmarks.length+1}`;i.bookmarks.push({id:q(),name:r,cam:a.camera.getPose()}),ot(i),F(),K(`已保存「${r}」`)},"small primary")])),i.bookmarks.length===0&&R.append(h("div",{style:"color:var(--fg-dim);font-size:13px"},["调好角度后点「存当前」。"]));for(const r of i.bookmarks){const x=h("div",{class:"bookmark-item"},[h("span",{class:"bm-name"},[r.name]),O("删",()=>{i.bookmarks=i.bookmarks.filter(P=>P.id!==r.id),ot(i),F()},"small danger")]);x.addEventListener("click",P=>{P.target.tagName!=="BUTTON"&&a.camera.setPose(r.cam)}),R.append(x)}}F(),s.append(R);function S(){const r=i.lighting,x=i.vertices.map(L=>L.x),P=i.vertices.map(L=>L.y),z=`${(Math.max(...x)-Math.min(...x)).toFixed(1)}m × ${(Math.max(...P)-Math.min(...P)).toFixed(1)}m`,D=i.vertices.map(L=>L.depth),V=[`${i.name}`,`尺寸 ${z} · 水深 ${Math.min(...D).toFixed(1)}–${Math.max(...D).toFixed(1)}m`,`风速 ${i.water.windSpeed.toFixed(1)}m/s · 清澈度 ${i.water.clarity*100|0}% · ${r.night?"夜景":`白天 ${Math.floor(r.timeOfDay)}:00`}`,`水下灯 ${r.lights.filter(L=>L.on).length} 盏 · 画质 ${ft[a.quality]}`,new Date().toLocaleString("zh-CN")];a.screenshot(V).toBlob(L=>{if(!L)return;const I=URL.createObjectURL(L),j=document.createElement("a");j.href=I,j.download=`${i.name}_效果图.png`,j.click(),setTimeout(()=>URL.revokeObjectURL(I),5e3),K("截图已保存")},"image/png")}let N=0,_=performance.now(),d=0;const X=r=>{const x=Math.min(.1,(r-_)/1e3);if(_=r,a.frame(x),v.textContent=`${a.fps} fps`,n.autoQuality&&a.quality!=="low")if(a.fps>0&&a.fps<45){if(d===0)d=r;else if(r-d>3e3){const P=a.quality==="high"?"medium":"low";a.setQuality(P),E.value=P,K(`帧率不足,已自动降到「${ft[P]}」画质`),d=0}}else d=0;N=requestAnimationFrame(X)};return N=requestAnimationFrame(X),{destroy(){cancelAnimationFrame(N),m(),a.dispose(),ot(i)}}}function Ie(e){const o=h("div",{class:"page",style:"max-width:560px"}),t=wt();o.append(h("h2",{},["设置"])),o.append(h("h3",{},["画质"])),o.append(Rt("默认画质",["low","medium","high"].map(n=>[n,ft[n]]),t.quality,n=>{t.quality=n,yt(t),K("已保存")})),o.append(bt("帧率不足时自动降档",t.autoQuality,n=>{t.autoQuality=n,yt(t)})),o.append(h("p",{style:"color:var(--fg-dim);font-size:13px"},["低档适合手机:减少波列与网格、关闭抗锯齿;中档目标 60fps;高档启用全部波列与更高渲染分辨率。"])),o.append(h("h3",{},["操控"])),o.append(bt("反转垂直旋转方向",t.invertY,n=>{t.invertY=n,yt(t)})),o.append(h("h3",{},["数据"])),o.append(h("div",{style:"display:flex;gap:8px;flex-wrap:wrap"},[O("导出全部项目",()=>{Pt(jt(),`泳池项目备份_${new Date().toISOString().slice(0,10)}.json`)}),O("导入项目",()=>i.click()),O("清空所有项目",async()=>{await $t("确定删除所有项目?此操作不可恢复,建议先导出备份。")&&(se(),K("已清空"))},"danger")]));const i=h("input",{type:"file",accept:".json",style:"display:none"});return i.addEventListener("change",async()=>{var s;const n=(s=i.files)==null?void 0:s[0];if(n){try{const c=Ot(await n.text());K(`成功导入 ${c} 个项目`)}catch(c){K(`导入失败:${c.message}`)}i.value=""}}),o.append(i),o.append(h("p",{style:"color:var(--fg-dim);font-size:13px;margin-top:20px"},["所有数据保存在浏览器本地(localStorage),不会上传。换设备请用导出/导入迁移。"])),e.append(o),{destroy(){}}}const Ue={"":At,projects:At,editor:ae,materials:De,preview:Ne,settings:Ie};let gt=null;function We(){const e=location.hash.replace(/^#\/?/,""),[o,t]=e.split("/");return{name:o??"",param:t??null}}function ke(e){const o=document.createElement("div");o.className="topnav";const t=[["projects","项目"],["settings","设置"]];o.append(Object.assign(document.createElement("span"),{className:"brand",textContent:"泳池效果预览"}));for(const[i,n]of t){const s=document.createElement("a");s.href=`#/${i}`,s.textContent=n,(e===i||e===""&&i==="projects")&&(s.className="active"),o.append(s)}return o}function Kt(){const e=document.getElementById("app");gt&&(gt.destroy(),gt=null),e.innerHTML="";const{name:o,param:t}=We(),i=Ue[o]??At;e.append(ke(o));const n=document.createElement("div");n.style.display="contents",e.append(n),gt=i(n,t)}window.addEventListener("hashchange",Kt);Kt();
