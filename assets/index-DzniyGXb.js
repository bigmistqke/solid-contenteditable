(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const l of i)if(l.type==="childList")for(const o of l.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function n(i){const l={};return i.integrity&&(l.integrity=i.integrity),i.referrerPolicy&&(l.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?l.credentials="include":i.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function s(i){if(i.ep)return;i.ep=!0;const l=n(i);fetch(i.href,l)}})();const Te=(e,t)=>e===t,U=Symbol("solid-proxy"),Oe=Symbol("solid-track"),v={equals:Te};let we=Ae;const O=1,_=2,me={owned:null,cleanups:null,context:null,owner:null};var m=null;let Z=null,Ne=null,w=null,A=null,P=null,H=0;function M(e,t){const n=w,s=m,i=e.length===0,l=t===void 0?s:t,o=i?me:{owned:null,cleanups:null,context:l?l.context:null,owner:l},r=i?e:()=>e(()=>N(()=>X(o)));m=o,w=null;try{return F(r,!0)}finally{w=n,m=s}}function K(e,t){t=t?Object.assign({},v,t):v;const n={value:e,observers:null,observerSlots:null,comparator:t.equals||void 0},s=i=>(typeof i=="function"&&(i=i(n.value)),be(n,i));return[pe.bind(n),s]}function D(e,t,n){const s=ie(e,t,!1,O);B(s)}function ke(e,t,n){we=Be;const s=ie(e,t,!1,O);s.user=!0,P?P.push(s):B(s)}function T(e,t,n){n=n?Object.assign({},v,n):v;const s=ie(e,t,!0,0);return s.observers=null,s.observerSlots=null,s.comparator=n.equals||void 0,B(s),pe.bind(s)}function N(e){if(w===null)return e();const t=w;w=null;try{return e()}finally{w=t}}function Le(e){return m===null||(m.cleanups===null?m.cleanups=[e]:m.cleanups.push(e)),e}function je(e){const t=T(e),n=T(()=>z(t()));return n.toArray=()=>{const s=n();return Array.isArray(s)?s:s!=null?[s]:[]},n}function pe(){if(this.sources&&this.state)if(this.state===O)B(this);else{const e=A;A=null,F(()=>W(this),!1),A=e}if(w){const e=this.observers?this.observers.length:0;w.sources?(w.sources.push(this),w.sourceSlots.push(e)):(w.sources=[this],w.sourceSlots=[e]),this.observers?(this.observers.push(w),this.observerSlots.push(w.sources.length-1)):(this.observers=[w],this.observerSlots=[w.sources.length-1])}return this.value}function be(e,t,n){let s=e.value;return(!e.comparator||!e.comparator(s,t))&&(e.value=t,e.observers&&e.observers.length&&F(()=>{for(let i=0;i<e.observers.length;i+=1){const l=e.observers[i],o=Z&&Z.running;o&&Z.disposed.has(l),(o?!l.tState:!l.state)&&(l.pure?A.push(l):P.push(l),l.observers&&Se(l)),o||(l.state=O)}if(A.length>1e6)throw A=[],new Error},!1)),t}function B(e){if(!e.fn)return;X(e);const t=H;Ie(e,e.value,t)}function Ie(e,t,n){let s;const i=m,l=w;w=m=e;try{s=e.fn(t)}catch(o){return e.pure&&(e.state=O,e.owned&&e.owned.forEach(X),e.owned=null),e.updatedAt=n+1,Ee(o)}finally{w=l,m=i}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&"observers"in e?be(e,s):e.value=s,e.updatedAt=n)}function ie(e,t,n,s=O,i){const l={fn:e,state:s,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:m,context:m?m.context:null,pure:n};return m===null||m!==me&&(m.owned?m.owned.push(l):m.owned=[l]),l}function V(e){if(e.state===0)return;if(e.state===_)return W(e);if(e.suspense&&N(e.suspense.inFallback))return e.suspense.effects.push(e);const t=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<H);)e.state&&t.push(e);for(let n=t.length-1;n>=0;n--)if(e=t[n],e.state===O)B(e);else if(e.state===_){const s=A;A=null,F(()=>W(e,t[0]),!1),A=s}}function F(e,t){if(A)return e();let n=!1;t||(A=[]),P?n=!0:P=[],H++;try{const s=e();return De(n),s}catch(s){n||(P=null),A=null,Ee(s)}}function De(e){if(A&&(Ae(A),A=null),e)return;const t=P;P=null,t.length&&F(()=>we(t),!1)}function Ae(e){for(let t=0;t<e.length;t++)V(e[t])}function Be(e){let t,n=0;for(t=0;t<e.length;t++){const s=e[t];s.user?e[n++]=s:V(s)}for(t=0;t<n;t++)V(e[t])}function W(e,t){e.state=0;for(let n=0;n<e.sources.length;n+=1){const s=e.sources[n];if(s.sources){const i=s.state;i===O?s!==t&&(!s.updatedAt||s.updatedAt<H)&&V(s):i===_&&W(s,t)}}}function Se(e){for(let t=0;t<e.observers.length;t+=1){const n=e.observers[t];n.state||(n.state=_,n.pure?A.push(n):P.push(n),n.observers&&Se(n))}}function X(e){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),s=e.sourceSlots.pop(),i=n.observers;if(i&&i.length){const l=i.pop(),o=n.observerSlots.pop();s<i.length&&(l.sourceSlots[o]=s,i[s]=l,n.observerSlots[s]=o)}}if(e.owned){for(t=e.owned.length-1;t>=0;t--)X(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}e.state=0}function Fe(e){return e instanceof Error?e:new Error(typeof e=="string"?e:"Unknown error",{cause:e})}function Ee(e,t=m){throw Fe(e)}function z(e){if(typeof e=="function"&&!e.length)return z(e());if(Array.isArray(e)){const t=[];for(let n=0;n<e.length;n++){const s=z(e[n]);Array.isArray(s)?t.push.apply(t,s):t.push(s)}return t}return e}const Re=Symbol("fallback");function oe(e){for(let t=0;t<e.length;t++)e[t]()}function Me(e,t,n={}){let s=[],i=[],l=[],o=0,r=t.length>1?[]:null;return Le(()=>oe(l)),()=>{let u=e()||[],a,c;return u[Oe],N(()=>{let h=u.length,f,g,y,p,b,S,E,$,k;if(h===0)o!==0&&(oe(l),l=[],s=[],i=[],o=0,r&&(r=[])),n.fallback&&(s=[Re],i[0]=M(Pe=>(l[0]=Pe,n.fallback())),o=1);else if(o===0){for(i=new Array(h),c=0;c<h;c++)s[c]=u[c],i[c]=M(d);o=h}else{for(y=new Array(h),p=new Array(h),r&&(b=new Array(h)),S=0,E=Math.min(o,h);S<E&&s[S]===u[S];S++);for(E=o-1,$=h-1;E>=S&&$>=S&&s[E]===u[$];E--,$--)y[$]=i[E],p[$]=l[E],r&&(b[$]=r[E]);for(f=new Map,g=new Array($+1),c=$;c>=S;c--)k=u[c],a=f.get(k),g[c]=a===void 0?-1:a,f.set(k,c);for(a=S;a<=E;a++)k=s[a],c=f.get(k),c!==void 0&&c!==-1?(y[c]=i[a],p[c]=l[a],r&&(b[c]=r[a]),c=g[c],f.set(k,c)):l[a]();for(c=S;c<h;c++)c in y?(i[c]=y[c],l[c]=p[c],r&&(r[c]=b[c],r[c](c))):i[c]=M(d);i=i.slice(0,o=h),s=u.slice(0)}return i});function d(h){if(l[c]=h,r){const[f,g]=K(c);return r[c]=g,t(u[c],f)}return t(u[c])}}}function C(e,t){return N(()=>e(t||{}))}function R(){return!0}const ee={get(e,t,n){return t===U?n:e.get(t)},has(e,t){return t===U?!0:e.has(t)},set:R,deleteProperty:R,getOwnPropertyDescriptor(e,t){return{configurable:!0,enumerable:!0,get(){return e.get(t)},set:R,deleteProperty:R}},ownKeys(e){return e.keys()}};function Q(e){return(e=typeof e=="function"?e():e)?e:{}}function Ue(){for(let e=0,t=this.length;e<t;++e){const n=this[e]();if(n!==void 0)return n}}function ce(...e){let t=!1;for(let o=0;o<e.length;o++){const r=e[o];t=t||!!r&&U in r,e[o]=typeof r=="function"?(t=!0,T(r)):r}if(t)return new Proxy({get(o){for(let r=e.length-1;r>=0;r--){const u=Q(e[r])[o];if(u!==void 0)return u}},has(o){for(let r=e.length-1;r>=0;r--)if(o in Q(e[r]))return!0;return!1},keys(){const o=[];for(let r=0;r<e.length;r++)o.push(...Object.keys(Q(e[r])));return[...new Set(o)]}},ee);const n={},s=Object.create(null);for(let o=e.length-1;o>=0;o--){const r=e[o];if(!r)continue;const u=Object.getOwnPropertyNames(r);for(let a=u.length-1;a>=0;a--){const c=u[a];if(c==="__proto__"||c==="constructor")continue;const d=Object.getOwnPropertyDescriptor(r,c);if(!s[c])s[c]=d.get?{enumerable:!0,configurable:!0,get:Ue.bind(n[c]=[d.get.bind(r)])}:d.value!==void 0?d:void 0;else{const h=n[c];h&&(d.get?h.push(d.get.bind(r)):d.value!==void 0&&h.push(()=>d.value))}}}const i={},l=Object.keys(s);for(let o=l.length-1;o>=0;o--){const r=l[o],u=s[r];u&&u.get?Object.defineProperty(i,r,u):i[r]=u?u.value:void 0}return i}function ve(e,...t){if(U in e){const i=new Set(t.length>1?t.flat():t[0]),l=t.map(o=>new Proxy({get(r){return o.includes(r)?e[r]:void 0},has(r){return o.includes(r)&&r in e},keys(){return o.filter(r=>r in e)}},ee));return l.push(new Proxy({get(o){return i.has(o)?void 0:e[o]},has(o){return i.has(o)?!1:o in e},keys(){return Object.keys(e).filter(o=>!i.has(o))}},ee)),l}const n={},s=t.map(()=>({}));for(const i of Object.getOwnPropertyNames(e)){const l=Object.getOwnPropertyDescriptor(e,i),o=!l.get&&!l.set&&l.enumerable&&l.writable&&l.configurable;let r=!1,u=0;for(const a of t)a.includes(i)&&(r=!0,o?s[u][i]=l.value:Object.defineProperty(s[u],i,l)),++u;r||(o?n[i]=l.value:Object.defineProperty(n,i,l))}return[...s,n]}const _e=e=>`Stale read from <${e}>.`;function Ke(e){const t="fallback"in e&&{fallback:()=>e.fallback};return T(Me(()=>e.each,e.children,t||void 0))}function Ce(e){const t=e.keyed,n=T(()=>e.when,void 0,{equals:(s,i)=>t?s===i:!s==!i});return T(()=>{const s=n();if(s){const i=e.children;return typeof i=="function"&&i.length>0?N(()=>i(t?s:()=>{if(!N(n))throw _e("Show");return e.when})):i}return e.fallback},void 0,void 0)}const Ve=["allowfullscreen","async","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected"],We=new Set(["className","value","readOnly","formNoValidate","isMap","noModule","playsInline",...Ve]),qe=new Set(["innerHTML","textContent","innerText","children"]),Ge=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),He=Object.assign(Object.create(null),{class:"className",formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1}});function Xe(e,t){const n=He[e];return typeof n=="object"?n[t]?n.$:void 0:n}const Ze=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]);function Qe(e,t,n){let s=n.length,i=t.length,l=s,o=0,r=0,u=t[i-1].nextSibling,a=null;for(;o<i||r<l;){if(t[o]===n[r]){o++,r++;continue}for(;t[i-1]===n[l-1];)i--,l--;if(i===o){const c=l<s?r?n[r-1].nextSibling:n[l-r]:u;for(;r<l;)e.insertBefore(n[r++],c)}else if(l===r)for(;o<i;)(!a||!a.has(t[o]))&&t[o].remove(),o++;else if(t[o]===n[l-1]&&n[r]===t[i-1]){const c=t[--i].nextSibling;e.insertBefore(n[r++],t[o++].nextSibling),e.insertBefore(n[--l],c),t[i]=n[l]}else{if(!a){a=new Map;let d=r;for(;d<l;)a.set(n[d],d++)}const c=a.get(t[o]);if(c!=null)if(r<c&&c<l){let d=o,h=1,f;for(;++d<i&&d<l&&!((f=a.get(t[d]))==null||f!==c+h);)h++;if(h>c-r){const g=t[o];for(;r<c;)e.insertBefore(n[r++],g)}else e.replaceChild(n[r++],t[o++])}else o++;else t[o++].remove()}}}const ue="_$DX_DELEGATE";function Ye(e,t,n,s={}){let i;return M(l=>{i=l,t===document?e():le(t,e(),t.firstChild?null:void 0,n)},s.owner),()=>{i(),t.textContent=""}}function xe(e,t,n){let s;const i=()=>{const o=document.createElement("template");return o.innerHTML=e,o.content.firstChild},l=()=>(s||(s=i())).cloneNode(!0);return l.cloneNode=l,l}function re(e,t=window.document){const n=t[ue]||(t[ue]=new Set);for(let s=0,i=e.length;s<i;s++){const l=e[s];n.has(l)||(n.add(l),t.addEventListener(l,rt))}}function te(e,t,n){n==null?e.removeAttribute(t):e.setAttribute(t,n)}function Je(e,t){t==null?e.removeAttribute("class"):e.className=t}function ze(e,t,n,s){if(s)Array.isArray(n)?(e[`$$${t}`]=n[0],e[`$$${t}Data`]=n[1]):e[`$$${t}`]=n;else if(Array.isArray(n)){const i=n[0];e.addEventListener(t,n[0]=l=>i.call(e,n[1],l))}else e.addEventListener(t,n)}function et(e,t,n={}){const s=Object.keys(t||{}),i=Object.keys(n);let l,o;for(l=0,o=i.length;l<o;l++){const r=i[l];!r||r==="undefined"||t[r]||(fe(e,r,!1),delete n[r])}for(l=0,o=s.length;l<o;l++){const r=s[l],u=!!t[r];!r||r==="undefined"||n[r]===u||!u||(fe(e,r,!0),n[r]=u)}return n}function tt(e,t,n){if(!t)return n?te(e,"style"):t;const s=e.style;if(typeof t=="string")return s.cssText=t;typeof n=="string"&&(s.cssText=n=void 0),n||(n={}),t||(t={});let i,l;for(l in n)t[l]==null&&s.removeProperty(l),delete n[l];for(l in t)i=t[l],i!==n[l]&&(s.setProperty(l,i),n[l]=i);return n}function nt(e,t={},n,s){const i={};return D(()=>typeof t.ref=="function"?$e(t.ref,e):t.ref=e),D(()=>st(e,t,n,!0,i,!0)),i}function $e(e,t,n){return N(()=>e(t,n))}function le(e,t,n,s){if(n!==void 0&&!s&&(s=[]),typeof t!="function")return q(e,t,s,n);D(i=>q(e,t(),i,n),s)}function st(e,t,n,s,i={},l=!1){t||(t={});for(const o in i)if(!(o in t)){if(o==="children")continue;i[o]=ae(e,o,null,i[o],n,l)}for(const o in t){if(o==="children")continue;const r=t[o];i[o]=ae(e,o,r,i[o],n,l)}}function it(e){return e.toLowerCase().replace(/-([a-z])/g,(t,n)=>n.toUpperCase())}function fe(e,t,n){const s=t.trim().split(/\s+/);for(let i=0,l=s.length;i<l;i++)e.classList.toggle(s[i],n)}function ae(e,t,n,s,i,l){let o,r,u,a,c;if(t==="style")return tt(e,n,s);if(t==="classList")return et(e,n,s);if(n===s)return s;if(t==="ref")l||n(e);else if(t.slice(0,3)==="on:"){const d=t.slice(3);s&&e.removeEventListener(d,s),n&&e.addEventListener(d,n)}else if(t.slice(0,10)==="oncapture:"){const d=t.slice(10);s&&e.removeEventListener(d,s,!0),n&&e.addEventListener(d,n,!0)}else if(t.slice(0,2)==="on"){const d=t.slice(2).toLowerCase(),h=Ze.has(d);if(!h&&s){const f=Array.isArray(s)?s[0]:s;e.removeEventListener(d,f)}(h||n)&&(ze(e,d,n,h),h&&re([d]))}else t.slice(0,5)==="attr:"?te(e,t.slice(5),n):(c=t.slice(0,5)==="prop:")||(u=qe.has(t))||(a=Xe(t,e.tagName))||(r=We.has(t))||(o=e.nodeName.includes("-"))?(c&&(t=t.slice(5),r=!0),t==="class"||t==="className"?Je(e,n):o&&!r&&!u?e[it(t)]=n:e[a||t]=n):te(e,Ge[t]||t,n);return n}function rt(e){const t=`$$${e.type}`;let n=e.composedPath&&e.composedPath()[0]||e.target;for(e.target!==n&&Object.defineProperty(e,"target",{configurable:!0,value:n}),Object.defineProperty(e,"currentTarget",{configurable:!0,get(){return n||document}});n;){const s=n[t];if(s&&!n.disabled){const i=n[`${t}Data`];if(i!==void 0?s.call(n,i,e):s.call(n,e),e.cancelBubble)return}n=n._$host||n.parentNode||n.host}}function q(e,t,n,s,i){for(;typeof n=="function";)n=n();if(t===n)return n;const l=typeof t,o=s!==void 0;if(e=o&&n[0]&&n[0].parentNode||e,l==="string"||l==="number")if(l==="number"&&(t=t.toString()),o){let r=n[0];r&&r.nodeType===3?r.data!==t&&(r.data=t):r=document.createTextNode(t),n=L(e,n,s,r)}else n!==""&&typeof n=="string"?n=e.firstChild.data=t:n=e.textContent=t;else if(t==null||l==="boolean")n=L(e,n,s);else{if(l==="function")return D(()=>{let r=t();for(;typeof r=="function";)r=r();n=q(e,r,n,s)}),()=>n;if(Array.isArray(t)){const r=[],u=n&&Array.isArray(n);if(ne(r,t,n,i))return D(()=>n=q(e,r,n,s,!0)),()=>n;if(r.length===0){if(n=L(e,n,s),o)return n}else u?n.length===0?de(e,r,s):Qe(e,n,r):(n&&L(e),de(e,r));n=r}else if(t.nodeType){if(Array.isArray(n)){if(o)return n=L(e,n,s,t);L(e,n,null,t)}else n==null||n===""||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}}return n}function ne(e,t,n,s){let i=!1;for(let l=0,o=t.length;l<o;l++){let r=t[l],u=n&&n[e.length],a;if(!(r==null||r===!0||r===!1))if((a=typeof r)=="object"&&r.nodeType)e.push(r);else if(Array.isArray(r))i=ne(e,r,u)||i;else if(a==="function")if(s){for(;typeof r=="function";)r=r();i=ne(e,Array.isArray(r)?r:[r],Array.isArray(u)?u:[u])||i}else e.push(r),i=!0;else{const c=String(r);u&&u.nodeType===3&&u.data===c?e.push(u):e.push(document.createTextNode(c))}}return i}function de(e,t,n=null){for(let s=0,i=t.length;s<i;s++)e.insertBefore(t[s],n)}function L(e,t,n,s){if(n===void 0)return e.textContent="";const i=s||document.createTextNode("");if(t.length){let l=!1;for(let o=t.length-1;o>=0;o--){const r=t[o];if(i!==r){const u=r.parentNode===e;!l&&!o?u?e.replaceChild(i,r):e.insertBefore(i,n):u&&r.remove()}else l=!0}}else e.insertBefore(i,n);return[i]}var lt=xe("<div role=textbox>");const j=e=>/^[a-zA-Z0-9]$/.test(e||""),I=e=>e===" "||e==="	"||e===`
`,G=e=>e===`
`;function ot(e){const t=T(()=>K(e()));return[()=>t()[0](),i=>t()[1](i)]}function ct(e){const t=document.getSelection();if(!t||t.rangeCount===0)return{start:0,end:0};const n=t.getRangeAt(0),s=document.createRange();s.selectNodeContents(e),s.setEnd(n.startContainer,n.startOffset);const i=s.toString().length,l=i+n.toString().length;return{start:i,end:l}}function he(e,t){const n=e.childNodes;let s=0;for(const i of n){const l=i.textContent?.length||0;if(s+=l,s>=t)return{node:i instanceof Text?i:i.firstChild,offset:t-(s-l)}}throw"Could not find node"}function ut(){const[e,t]=K([]),[n,s]=K([]);function i(){s(r=>r.length>0?[]:r)}function l(r){t(u=>[...u,r])}function o(){const r=e().pop();return r&&s(u=>[...u,r]),r}return{get past(){return e()},get future(){return n()},clearFuture:i,push:l,pop:o}}function x(e,t,n){return{range:t,data:n,undo:e.slice(t.start,t.end)}}function Y(e,t){const n=t.start===t.end?Math.min(e.length-1,t.end+1):t.end;return x(e,{start:t.start,end:n})}function J(e,t){const n=t.start===t.end?Math.max(0,t.start-1):t.start;return x(e,{start:n,end:t.end})}function ft(e,t){let n=t.start;if(I(e[n-1]))for(;n>0&&I(e[n-1]);)n--;if(j(e[n-1]))for(;n>0&&j(e[n-1]);)n--;else for(;n>0&&!I(e[n-1])&&!j(e[n-1]);)n--;return x(e,{start:n,end:t.end})}function at(e,t){let n=t.end;if(I(e[n]))for(;n<e.length&&I(e[n]);)n+=1;if(j(e[n]))for(;n<e.length&&j(e[n]);)n+=1;else for(;n<e.length&&!I(e[n])&&!j(e[n]);)n+=1;return x(e,{start:t.start,end:n})}function dt(e,t){let n=t.start;if(G(e[n-1]))n-=1;else for(;n>0&&!G(e[n-1]);)n-=1;return x(e,{start:n,end:t.end})}function ht(e,t){let n=t.end;if(G(e[n+1]))n+=1;else for(;n<e.length&&!G(e[n+1]);)n+=1;return x(e,{start:t.start,end:n})}function gt(e,t,n){const s=ct(e.currentTarget);switch(e.inputType){case"insertText":return x(t,s,e.data||"");case"deleteContentBackward":return J(t,s);case"deleteContentForward":return Y(t,s);case"deleteWordBackward":return s.start!==s.end?J(t,s):ft(t,s);case"deleteWordForward":return s.start!==s.end?Y(t,s):at(t,s);case"deleteSoftLineBackward":return s.start!==s.end?J(t,s):dt(t,s);case"deleteSoftLineForward":return s.start!==s.end?Y(t,s):ht(t,s);case"deleteByCut":return x(t,s);case"insertReplacementText":case"insertFromPaste":{let i=e.dataTransfer?.getData("text");return!n&&i&&(i=i.replaceAll(`
`," ")),x(t,s,i)}case"insertParagraph":return n?x(t,s,`
`):null;default:throw`Unsupported inputType: ${e.inputType}`}}function se(e){const[t,n]=ve(ce({spellcheck:!1,editable:!0,multiline:!0},e),["children","editable","multiline","onPatch","onValue","style","value"]),[s,i]=ot(()=>e.value),l=T(()=>s().endsWith(`
`)?`${s()}
`:s()),o=je(()=>e.children?.(l())||l()),r=ut();let u=null;function a(f){r.push(f);const{range:{start:g,end:y},data:p=""}=f,b=`${s().slice(0,g)}${p}${s().slice(y)}`;i(b),e.onValue?.(b)}function c(f,g){const y=document.getSelection(),p=document.createRange();y.removeAllRanges();const b=he(u,f);if(p.setStart(b.node,b.offset),g){const S=he(u,g);p.setEnd(S.node,S.offset)}else p.setEnd(b.node,b.offset);y.addRange(p)}function d(f){switch(f.preventDefault(),f.inputType){case"historyUndo":{const g=r.pop();if(!g)return;const{range:{start:y,end:p},data:b="",undo:S=""}=g;i(E=>`${E.slice(0,y)}${S}${E.slice(y+b.length)}`),c(y,p),e.onValue?.(s());break}case"historyRedo":{const g=r.future.pop();if(!g)return;a(g);const{range:{start:y},data:p=""}=g;c(y+p.length);break}default:{r.clearFuture();const g=f.currentTarget.innerText,y=gt(f,g,t.multiline);if(y){a(y);const{range:{start:p},data:b=""}=y;c(p+b.length)}break}}}function h(f){if(t.onPatch){const g=t.onPatch(f);g&&a(g)}if(f.ctrlKey||f.metaKey)switch(f.key){case"z":{f.preventDefault(),f.currentTarget.dispatchEvent(new InputEvent("input",{inputType:"historyUndo",bubbles:!0,cancelable:!0}));break}case"Z":f.preventDefault(),f.currentTarget.dispatchEvent(new InputEvent("input",{inputType:"historyRedo",bubbles:!0,cancelable:!0}))}}return ke(()=>{o.toArray().map(f=>f instanceof Element?f.textContent:f).join("")!==l()&&console.warn(`⚠️ WARNING ⚠️
- props.value and the textContent of props.children should be equal!
- This will break <ContentEditable/>!
- see www.github.com/bigmistqke/solid-contenteditable/#gotcha`)}),(()=>{var f=lt();f.$$keydown=h,f.$$input=d,f.$$beforeinput=d;var g=u;return typeof g=="function"?$e(g,f):u=f,nt(f,ce({get"aria-multiline"(){return t.multiline},get contenteditable(){return t.editable},get style(){return{"white-space":"pre-wrap",...t.style}}},n),!1),le(f,o),f})()}re(["beforeinput","input","keydown"]);var yt=xe("<button>");function ge(e){return C(Ke,{get each(){return e.value.split(e.delimiter)},children:(t,n)=>{const s=()=>n()===e.value.split(e.delimiter).length-1;return[T(()=>e.children(t,n)),C(Ce,{get when(){return!s()},get children(){return e.delimiter}})]}})}function ye(e){return C(se,{value:"     #hallo    #test",style:{padding:"10px"},get multiline(){return e.multiline},children:t=>C(ge,{value:t,delimiter:`
`,children:n=>C(ge,{value:n,delimiter:" ",children:s=>C(Ce,{get when(){return s.startsWith("#")},fallback:s,get children(){var i=yt();return i.$$click=()=>console.log("ok"),i.style.setProperty("margin","0px"),le(i,s),i}})})})})}function wt(){return[C(se,{multiline:!1,value:"     #hallo    #test",style:{padding:"10px"}}),C(se,{value:"     #hallo    #test",style:{padding:"10px"}}),C(ye,{multiline:!1}),C(ye,{})]}re(["click"]);Ye(()=>C(wt,{}),document.getElementById("root"));
