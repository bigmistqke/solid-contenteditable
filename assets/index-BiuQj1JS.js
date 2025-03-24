(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const je=(e,t)=>e===t,G=Symbol("solid-proxy"),_e=Symbol("solid-track"),H={equals:je};let ke=Ee;const N=1,V=2,Ce={owned:null,cleanups:null,context:null,owner:null};var C=null;let ee=null,Me=null,w=null,S=null,L=null,Y=0;function U(e,t){const n=w,i=C,r=e.length===0,s=t===void 0?i:t,o=r?Ce:{owned:null,cleanups:null,context:s?s.context:null,owner:s},l=r?e:()=>e(()=>O(()=>J(o)));C=o,w=null;try{return K(l,!0)}finally{w=n,C=i}}function Se(e,t){t=t?Object.assign({},H,t):H;const n={value:e,observers:null,observerSlots:null,comparator:t.equals||void 0},i=r=>(typeof r=="function"&&(r=r(n.value)),Ae(n,r));return[xe.bind(n),i]}function B(e,t,n){const i=ce(e,t,!1,N);R(i)}function De(e,t,n){ke=ve;const i=ce(e,t,!1,N);i.user=!0,L?L.push(i):R(i)}function E(e,t,n){n=n?Object.assign({},H,n):H;const i=ce(e,t,!0,0);return i.observers=null,i.observerSlots=null,i.comparator=n.equals||void 0,R(i),xe.bind(i)}function O(e){if(w===null)return e();const t=w;w=null;try{return e()}finally{w=t}}function Fe(e){return C===null||(C.cleanups===null?C.cleanups=[e]:C.cleanups.push(e)),e}function Ie(e){const t=E(e),n=E(()=>re(t()));return n.toArray=()=>{const i=n();return Array.isArray(i)?i:i!=null?[i]:[]},n}function xe(){if(this.sources&&this.state)if(this.state===N)R(this);else{const e=S;S=null,K(()=>X(this),!1),S=e}if(w){const e=this.observers?this.observers.length:0;w.sources?(w.sources.push(this),w.sourceSlots.push(e)):(w.sources=[this],w.sourceSlots=[e]),this.observers?(this.observers.push(w),this.observerSlots.push(w.sources.length-1)):(this.observers=[w],this.observerSlots=[w.sources.length-1])}return this.value}function Ae(e,t,n){let i=e.value;return(!e.comparator||!e.comparator(i,t))&&(e.value=t,e.observers&&e.observers.length&&K(()=>{for(let r=0;r<e.observers.length;r+=1){const s=e.observers[r],o=ee&&ee.running;o&&ee.disposed.has(s),(o?!s.tState:!s.state)&&(s.pure?S.push(s):L.push(s),s.observers&&$e(s)),o||(s.state=N)}if(S.length>1e6)throw S=[],new Error},!1)),t}function R(e){if(!e.fn)return;J(e);const t=Y;Re(e,e.value,t)}function Re(e,t,n){let i;const r=C,s=w;w=C=e;try{i=e.fn(t)}catch(o){return e.pure&&(e.state=N,e.owned&&e.owned.forEach(J),e.owned=null),e.updatedAt=n+1,Te(o)}finally{w=s,C=r}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&"observers"in e?Ae(e,i):e.value=i,e.updatedAt=n)}function ce(e,t,n,i=N,r){const s={fn:e,state:i,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:C,context:C?C.context:null,pure:n};return C===null||C!==Ce&&(C.owned?C.owned.push(s):C.owned=[s]),s}function q(e){if(e.state===0)return;if(e.state===V)return X(e);if(e.suspense&&O(e.suspense.inFallback))return e.suspense.effects.push(e);const t=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<Y);)e.state&&t.push(e);for(let n=t.length-1;n>=0;n--)if(e=t[n],e.state===N)R(e);else if(e.state===V){const i=S;S=null,K(()=>X(e,t[0]),!1),S=i}}function K(e,t){if(S)return e();let n=!1;t||(S=[]),L?n=!0:L=[],Y++;try{const i=e();return Ke(n),i}catch(i){n||(L=null),S=null,Te(i)}}function Ke(e){if(S&&(Ee(S),S=null),e)return;const t=L;L=null,t.length&&K(()=>ke(t),!1)}function Ee(e){for(let t=0;t<e.length;t++)q(e[t])}function ve(e){let t,n=0;for(t=0;t<e.length;t++){const i=e[t];i.user?e[n++]=i:q(i)}for(t=0;t<n;t++)q(e[t])}function X(e,t){e.state=0;for(let n=0;n<e.sources.length;n+=1){const i=e.sources[n];if(i.sources){const r=i.state;r===N?i!==t&&(!i.updatedAt||i.updatedAt<Y)&&q(i):r===V&&X(i,t)}}}function $e(e){for(let t=0;t<e.observers.length;t+=1){const n=e.observers[t];n.state||(n.state=V,n.pure?S.push(n):L.push(n),n.observers&&$e(n))}}function J(e){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),i=e.sourceSlots.pop(),r=n.observers;if(r&&r.length){const s=r.pop(),o=n.observerSlots.pop();i<r.length&&(s.sourceSlots[o]=i,r[i]=s,n.observerSlots[i]=o)}}if(e.owned){for(t=e.owned.length-1;t>=0;t--)J(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}e.state=0}function We(e){return e instanceof Error?e:new Error(typeof e=="string"?e:"Unknown error",{cause:e})}function Te(e,t=C){throw We(e)}function re(e){if(typeof e=="function"&&!e.length)return re(e());if(Array.isArray(e)){const t=[];for(let n=0;n<e.length;n++){const i=re(e[n]);Array.isArray(i)?t.push.apply(t,i):t.push(i)}return t}return e}const Ue=Symbol("fallback");function ue(e){for(let t=0;t<e.length;t++)e[t]()}function Ge(e,t,n={}){let i=[],r=[],s=[],o=0,l=t.length>1?[]:null;return Fe(()=>ue(s)),()=>{let c=e()||[],h,a;return c[_e],O(()=>{let g=c.length,x,T,f,d,b,y,p,k,A;if(g===0)o!==0&&(ue(s),s=[],i=[],r=[],o=0,l&&(l=[])),n.fallback&&(i=[Ue],r[0]=U(v=>(s[0]=v,n.fallback())),o=1);else if(o===0){for(r=new Array(g),a=0;a<g;a++)i[a]=c[a],r[a]=U(u);o=g}else{for(f=new Array(g),d=new Array(g),l&&(b=new Array(g)),y=0,p=Math.min(o,g);y<p&&i[y]===c[y];y++);for(p=o-1,k=g-1;p>=y&&k>=y&&i[p]===c[k];p--,k--)f[k]=r[p],d[k]=s[p],l&&(b[k]=l[p]);for(x=new Map,T=new Array(k+1),a=k;a>=y;a--)A=c[a],h=x.get(A),T[a]=h===void 0?-1:h,x.set(A,a);for(h=y;h<=p;h++)A=i[h],a=x.get(A),a!==void 0&&a!==-1?(f[a]=r[h],d[a]=s[h],l&&(b[a]=l[h]),a=T[a],x.set(A,a)):s[h]();for(a=y;a<g;a++)a in f?(r[a]=f[a],s[a]=d[a],l&&(l[a]=b[a],l[a](a))):r[a]=U(u);r=r.slice(0,o=g),i=c.slice(0)}return r});function u(g){if(s[a]=g,l){const[x,T]=Se(a);return l[a]=T,t(c[a],x)}return t(c[a])}}}function m(e,t){return O(()=>e(t||{}))}function W(){return!0}const se={get(e,t,n){return t===G?n:e.get(t)},has(e,t){return t===G?!0:e.has(t)},set:W,deleteProperty:W,getOwnPropertyDescriptor(e,t){return{configurable:!0,enumerable:!0,get(){return e.get(t)},set:W,deleteProperty:W}},ownKeys(e){return e.keys()}};function te(e){return(e=typeof e=="function"?e():e)?e:{}}function He(){for(let e=0,t=this.length;e<t;++e){const n=this[e]();if(n!==void 0)return n}}function le(...e){let t=!1;for(let o=0;o<e.length;o++){const l=e[o];t=t||!!l&&G in l,e[o]=typeof l=="function"?(t=!0,E(l)):l}if(t)return new Proxy({get(o){for(let l=e.length-1;l>=0;l--){const c=te(e[l])[o];if(c!==void 0)return c}},has(o){for(let l=e.length-1;l>=0;l--)if(o in te(e[l]))return!0;return!1},keys(){const o=[];for(let l=0;l<e.length;l++)o.push(...Object.keys(te(e[l])));return[...new Set(o)]}},se);const n={},i=Object.create(null);for(let o=e.length-1;o>=0;o--){const l=e[o];if(!l)continue;const c=Object.getOwnPropertyNames(l);for(let h=c.length-1;h>=0;h--){const a=c[h];if(a==="__proto__"||a==="constructor")continue;const u=Object.getOwnPropertyDescriptor(l,a);if(!i[a])i[a]=u.get?{enumerable:!0,configurable:!0,get:He.bind(n[a]=[u.get.bind(l)])}:u.value!==void 0?u:void 0;else{const g=n[a];g&&(u.get?g.push(u.get.bind(l)):u.value!==void 0&&g.push(()=>u.value))}}}const r={},s=Object.keys(i);for(let o=s.length-1;o>=0;o--){const l=s[o],c=i[l];c&&c.get?Object.defineProperty(r,l,c):r[l]=c?c.value:void 0}return r}function Le(e,...t){if(G in e){const r=new Set(t.length>1?t.flat():t[0]),s=t.map(o=>new Proxy({get(l){return o.includes(l)?e[l]:void 0},has(l){return o.includes(l)&&l in e},keys(){return o.filter(l=>l in e)}},se));return s.push(new Proxy({get(o){return r.has(o)?void 0:e[o]},has(o){return r.has(o)?!1:o in e},keys(){return Object.keys(e).filter(o=>!r.has(o))}},se)),s}const n={},i=t.map(()=>({}));for(const r of Object.getOwnPropertyNames(e)){const s=Object.getOwnPropertyDescriptor(e,r),o=!s.get&&!s.set&&s.enumerable&&s.writable&&s.configurable;let l=!1,c=0;for(const h of t)h.includes(r)&&(l=!0,o?i[c][r]=s.value:Object.defineProperty(i[c],r,s)),++c;l||(o?n[r]=s.value:Object.defineProperty(n,r,s))}return[...i,n]}const Ve=e=>`Stale read from <${e}>.`;function qe(e){const t="fallback"in e&&{fallback:()=>e.fallback};return E(Ge(()=>e.each,e.children,t||void 0))}function Oe(e){const t=e.keyed,n=E(()=>e.when,void 0,{equals:(i,r)=>t?i===r:!i==!r});return E(()=>{const i=n();if(i){const r=e.children;return typeof r=="function"&&r.length>0?O(()=>r(t?i:()=>{if(!O(n))throw Ve("Show");return e.when})):r}return e.fallback},void 0,void 0)}const Xe=["allowfullscreen","async","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected"],Ze=new Set(["className","value","readOnly","formNoValidate","isMap","noModule","playsInline",...Xe]),ze=new Set(["innerHTML","textContent","innerText","children"]),Qe=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),Ye=Object.assign(Object.create(null),{class:"className",formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1}});function Je(e,t){const n=Ye[e];return typeof n=="object"?n[t]?n.$:void 0:n}const et=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),tt=new Set(["altGlyph","altGlyphDef","altGlyphItem","animate","animateColor","animateMotion","animateTransform","circle","clipPath","color-profile","cursor","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","font","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignObject","g","glyph","glyphRef","hkern","image","line","linearGradient","marker","mask","metadata","missing-glyph","mpath","path","pattern","polygon","polyline","radialGradient","rect","set","stop","svg","switch","symbol","text","textPath","tref","tspan","use","view","vkern"]),nt={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"};function it(e,t,n){let i=n.length,r=t.length,s=i,o=0,l=0,c=t[r-1].nextSibling,h=null;for(;o<r||l<s;){if(t[o]===n[l]){o++,l++;continue}for(;t[r-1]===n[s-1];)r--,s--;if(r===o){const a=s<i?l?n[l-1].nextSibling:n[s-l]:c;for(;l<s;)e.insertBefore(n[l++],a)}else if(s===l)for(;o<r;)(!h||!h.has(t[o]))&&t[o].remove(),o++;else if(t[o]===n[s-1]&&n[l]===t[r-1]){const a=t[--r].nextSibling;e.insertBefore(n[l++],t[o++].nextSibling),e.insertBefore(n[--s],a),t[r]=n[s]}else{if(!h){h=new Map;let u=l;for(;u<s;)h.set(n[u],u++)}const a=h.get(t[o]);if(a!=null)if(l<a&&a<s){let u=o,g=1,x;for(;++u<r&&u<s&&!((x=h.get(t[u]))==null||x!==a+g);)g++;if(g>a-l){const T=t[o];for(;l<a;)e.insertBefore(n[l++],T)}else e.replaceChild(n[l++],t[o++])}else o++;else t[o++].remove()}}}const de="_$DX_DELEGATE";function rt(e,t,n,i={}){let r;return U(s=>{r=s,t===document?e():$(t,e(),t.firstChild?null:void 0,n)},i.owner),()=>{r(),t.textContent=""}}function D(e,t,n){let i;const r=()=>{const o=document.createElement("template");return o.innerHTML=e,o.content.firstChild},s=()=>(i||(i=r())).cloneNode(!0);return s.cloneNode=s,s}function Ne(e,t=window.document){const n=t[de]||(t[de]=new Set);for(let i=0,r=e.length;i<r;i++){const s=e[i];n.has(s)||(n.add(s),t.addEventListener(s,dt))}}function Z(e,t,n){n==null?e.removeAttribute(t):e.setAttribute(t,n)}function st(e,t,n,i){i==null?e.removeAttributeNS(t,n):e.setAttributeNS(t,n,i)}function lt(e,t){t==null?e.removeAttribute("class"):e.className=t}function ot(e,t,n,i){if(i)Array.isArray(n)?(e[`$$${t}`]=n[0],e[`$$${t}Data`]=n[1]):e[`$$${t}`]=n;else if(Array.isArray(n)){const r=n[0];e.addEventListener(t,n[0]=s=>r.call(e,n[1],s))}else e.addEventListener(t,n)}function at(e,t,n={}){const i=Object.keys(t||{}),r=Object.keys(n);let s,o;for(s=0,o=r.length;s<o;s++){const l=r[s];!l||l==="undefined"||t[l]||(he(e,l,!1),delete n[l])}for(s=0,o=i.length;s<o;s++){const l=i[s],c=!!t[l];!l||l==="undefined"||n[l]===c||!c||(he(e,l,!0),n[l]=c)}return n}function ct(e,t,n){if(!t)return n?Z(e,"style"):t;const i=e.style;if(typeof t=="string")return i.cssText=t;typeof n=="string"&&(i.cssText=n=void 0),n||(n={}),t||(t={});let r,s;for(s in n)t[s]==null&&i.removeProperty(s),delete n[s];for(s in t)r=t[s],r!==n[s]&&(i.setProperty(s,r),n[s]=r);return n}function fe(e,t={},n,i){const r={};return i||B(()=>r.children=I(e,t.children,r.children)),B(()=>typeof t.ref=="function"?Pe(t.ref,e):t.ref=e),B(()=>ft(e,t,n,!0,r,!0)),r}function Pe(e,t,n){return O(()=>e(t,n))}function $(e,t,n,i){if(n!==void 0&&!i&&(i=[]),typeof t!="function")return I(e,t,i,n);B(r=>I(e,t(),r,n),i)}function ft(e,t,n,i,r={},s=!1){t||(t={});for(const o in r)if(!(o in t)){if(o==="children")continue;r[o]=ge(e,o,null,r[o],n,s)}for(const o in t){if(o==="children")continue;const l=t[o];r[o]=ge(e,o,l,r[o],n,s)}}function ut(e){return e.toLowerCase().replace(/-([a-z])/g,(t,n)=>n.toUpperCase())}function he(e,t,n){const i=t.trim().split(/\s+/);for(let r=0,s=i.length;r<s;r++)e.classList.toggle(i[r],n)}function ge(e,t,n,i,r,s){let o,l,c,h,a;if(t==="style")return ct(e,n,i);if(t==="classList")return at(e,n,i);if(n===i)return i;if(t==="ref")s||n(e);else if(t.slice(0,3)==="on:"){const u=t.slice(3);i&&e.removeEventListener(u,i),n&&e.addEventListener(u,n)}else if(t.slice(0,10)==="oncapture:"){const u=t.slice(10);i&&e.removeEventListener(u,i,!0),n&&e.addEventListener(u,n,!0)}else if(t.slice(0,2)==="on"){const u=t.slice(2).toLowerCase(),g=et.has(u);if(!g&&i){const x=Array.isArray(i)?i[0]:i;e.removeEventListener(u,x)}(g||n)&&(ot(e,u,n,g),g&&Ne([u]))}else if(t.slice(0,5)==="attr:")Z(e,t.slice(5),n);else if((a=t.slice(0,5)==="prop:")||(c=ze.has(t))||!r&&((h=Je(t,e.tagName))||(l=Ze.has(t)))||(o=e.nodeName.includes("-")))a&&(t=t.slice(5),l=!0),t==="class"||t==="className"?lt(e,n):o&&!l&&!c?e[ut(t)]=n:e[h||t]=n;else{const u=r&&t.indexOf(":")>-1&&nt[t.split(":")[0]];u?st(e,u,t,n):Z(e,Qe[t]||t,n)}return n}function dt(e){const t=`$$${e.type}`;let n=e.composedPath&&e.composedPath()[0]||e.target;for(e.target!==n&&Object.defineProperty(e,"target",{configurable:!0,value:n}),Object.defineProperty(e,"currentTarget",{configurable:!0,get(){return n||document}});n;){const i=n[t];if(i&&!n.disabled){const r=n[`${t}Data`];if(r!==void 0?i.call(n,r,e):i.call(n,e),e.cancelBubble)return}n=n._$host||n.parentNode||n.host}}function I(e,t,n,i,r){for(;typeof n=="function";)n=n();if(t===n)return n;const s=typeof t,o=i!==void 0;if(e=o&&n[0]&&n[0].parentNode||e,s==="string"||s==="number")if(s==="number"&&(t=t.toString()),o){let l=n[0];l&&l.nodeType===3?l.data!==t&&(l.data=t):l=document.createTextNode(t),n=P(e,n,i,l)}else n!==""&&typeof n=="string"?n=e.firstChild.data=t:n=e.textContent=t;else if(t==null||s==="boolean")n=P(e,n,i);else{if(s==="function")return B(()=>{let l=t();for(;typeof l=="function";)l=l();n=I(e,l,n,i)}),()=>n;if(Array.isArray(t)){const l=[],c=n&&Array.isArray(n);if(oe(l,t,n,r))return B(()=>n=I(e,l,n,i,!0)),()=>n;if(l.length===0){if(n=P(e,n,i),o)return n}else c?n.length===0?ye(e,l,i):it(e,n,l):(n&&P(e),ye(e,l));n=l}else if(t.nodeType){if(Array.isArray(n)){if(o)return n=P(e,n,i,t);P(e,n,null,t)}else n==null||n===""||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}}return n}function oe(e,t,n,i){let r=!1;for(let s=0,o=t.length;s<o;s++){let l=t[s],c=n&&n[e.length],h;if(!(l==null||l===!0||l===!1))if((h=typeof l)=="object"&&l.nodeType)e.push(l);else if(Array.isArray(l))r=oe(e,l,c)||r;else if(h==="function")if(i){for(;typeof l=="function";)l=l();r=oe(e,Array.isArray(l)?l:[l],Array.isArray(c)?c:[c])||r}else e.push(l),r=!0;else{const a=String(l);c&&c.nodeType===3&&c.data===a?e.push(c):e.push(document.createTextNode(a))}}return r}function ye(e,t,n=null){for(let i=0,r=t.length;i<r;i++)e.insertBefore(t[i],n)}function P(e,t,n,i){if(n===void 0)return e.textContent="";const r=i||document.createTextNode("");if(t.length){let s=!1;for(let o=t.length-1;o>=0;o--){const l=t[o];if(r!==l){const c=l.parentNode===e;!s&&!o?c?e.replaceChild(r,l):e.insertBefore(r,n):c&&l.remove()}else s=!0}}else e.insertBefore(r,n);return[r]}const ht="http://www.w3.org/2000/svg";function gt(e,t=!1){return t?document.createElementNS(ht,e):document.createElement(e)}function yt(e){const[t,n]=Le(e,["component"]),i=E(()=>t.component);return E(()=>{const r=i();switch(typeof r){case"function":return O(()=>r(n));case"string":const s=tt.has(r),o=gt(r,s);return fe(o,n,s),o}})}var pt=D("<div role=textbox>");const bt=navigator.platform.startsWith("Mac"),j=e=>/^[a-zA-Z0-9]$/.test(e||""),_=e=>e===" "||e==="	"||e===`
`,z=e=>e===`
`;function mt(e){const t=E(()=>Se(e()));return[()=>t()[0](),r=>t()[1](r)]}const Be=["Ctrl","Alt","Shift","Meta"];function wt(e){if(Be.includes(e.key))return e.code;const t=e.ctrlKey?"Ctrl+":"",n=e.altKey?"Alt+":"",i=e.shiftKey?"Shift+":"",r=e.metaKey?"Meta+":"";return t+n+i+r+e.code.replace("Key","")}const pe=Be.toReversed();function kt(e){return e.split("+").sort((t,n)=>pe.indexOf(n)-pe.indexOf(t)).join("+")}function F(e){const t=document.getSelection();if(!t||t.rangeCount===0)return{start:0,end:0};const n=t.getRangeAt(0),i=document.createRange();i.selectNodeContents(e),i.setEnd(n.startContainer,n.startOffset);const r=i.toString().length,s=r+n.toString().length;return{start:r,end:s}}function ae(e,t){const n=e.childNodes;let i=0;for(const r of n){const s=r.textContent?.length||0;if(i+=s,i>=t){const o=t-(i-s);return r instanceof Text?{node:r,offset:o}:ae(r,o)}}throw"Could not find node"}function Ct(){let e=[],t=[];return{future:{clear(){t.length=0},pop(){return t.pop()},peek(){return t[t.length-1]},push(n){t.push(n)}},past:{pop(){const n=e.pop();return n&&t.push(n),n},peek(){return e[e.length-1]},push(n){e.push(n)}}}}function St(e,t){if(e.kind==="deleteContentBackward"&&t.kind==="deleteContentForward"||e.kind==="deleteContentForward"&&t.kind==="deleteContentBackward")return!1;const n=["insertText","deleteContentBackward","deleteContentForward"];return n.includes(e.kind)&&n.includes(t.kind)&&!(e.data===" "&&t.data!==" ")}function ne(e,t){const n={start:t.start,end:t.start===t.end?Math.min(e.length,t.end+1):t.end};return{kind:"deleteContentForward",range:n,selection:t,undo:e.slice(n.start,n.end)}}function ie(e,t){const n={start:t.start===t.end?Math.max(0,t.start-1):t.start,end:t.end};return{kind:"deleteContentBackward",range:n,selection:t,undo:e.slice(n.start,n.end)}}function xt(e,t){let n=t.start;if(_(e[n-1]))for(;n>0&&_(e[n-1]);)n--;if(j(e[n-1]))for(;n>0&&j(e[n-1]);)n--;else for(;n>0&&!_(e[n-1])&&!j(e[n-1]);)n--;const i={start:n,end:t.end};return{kind:"deleteWordBackward",range:i,selection:t,undo:e.slice(i.start,i.end)}}function At(e,t){let n=t.end;if(_(e[n]))for(;n<e.length&&_(e[n]);)n+=1;if(j(e[n]))for(;n<e.length&&j(e[n]);)n+=1;else for(;n<e.length&&!_(e[n])&&!j(e[n]);)n+=1;const i={start:t.start,end:n};return{kind:"deleteWordForward",selection:t,range:i,undo:e.slice(i.start,i.end)}}function Et(e,t){let n=t.start;if(z(e[n-1]))n-=1;else for(;n>0&&!z(e[n-1]);)n-=1;const i={start:n,end:t.end};return{kind:"deleteSoftLineBackward",selection:t,range:i,undo:e.slice(i.start,i.end)}}function $t(e,t){let n=t.end;if(z(e[n+1]))n+=1;else for(;n<e.length&&!z(e[n+1]);)n+=1;const i={start:t.start,end:n};return{kind:"deleteSoftLineForward",selection:t,range:i,undo:e.slice(i.start,i.end)}}function Tt(e,t,n){const i=F(e.currentTarget);switch(e.inputType){case"insertText":return{kind:"insertText",selection:i,range:i,undo:t.slice(i.start,i.end),data:e.data||""};case"deleteContentBackward":return ie(t,i);case"deleteContentForward":return ne(t,i);case"deleteWordBackward":return i.start!==i.end?ie(t,i):xt(t,i);case"deleteWordForward":return i.start!==i.end?ne(t,i):At(t,i);case"deleteSoftLineBackward":return i.start!==i.end?ie(t,i):Et(t,i);case"deleteSoftLineForward":return i.start!==i.end?ne(t,i):$t(t,i);case"deleteByCut":return{kind:"deleteByCut",range:i,selection:i,undo:t.slice(i.start,i.end)};case"insertReplacementText":case"insertFromPaste":{let r=e.dataTransfer?.getData("text");return n&&r&&(r=r.replaceAll(`
`," ")),{kind:e.inputType,data:r,range:i,selection:i,undo:t.slice(i.start,i.end)}}case"insertLineBreak":case"insertParagraph":return n?null:{kind:e.inputType,data:`
`,range:i,selection:i,undo:t.slice(i.start,i.end)};default:throw`Unsupported inputType: ${e.inputType}`}}function be(e){e.preventDefault(),e.currentTarget.dispatchEvent(new InputEvent("input",{inputType:"historyRedo",bubbles:!0,cancelable:!0}))}function me(e){e.preventDefault(),e.currentTarget.dispatchEvent(new InputEvent("input",{inputType:"historyUndo",bubbles:!0,cancelable:!0}))}function M(e){const[t,n]=Le(le({spellcheck:!1,editable:!0,singleline:!1,historyStrategy:St},e),["render","editable","historyStrategy","onTextContent","keyBindings","singleline","style","textContent"]),[i,r]=mt(()=>e.textContent),s=Ct();let o=null;const l=E(()=>i().endsWith(`
`)?`${i()}
`:i()),c=Ie(()=>e.render?.(l)||l()),h=E(()=>Object.fromEntries(Object.entries(t.keyBindings||{}).map(([f,d])=>[kt(f),d])));function a(f){s.past.push(f);const{data:d="",range:{start:b,end:y}}=f,p=`${i().slice(0,b)}${d}${i().slice(y)}`;r(p),e.onTextContent?.(p)}function u(f,d){const b=document.getSelection(),y=document.createRange();b.removeAllRanges();const p=ae(o,f);if(y.setStart(p.node,p.offset),d){const k=ae(o,d);y.setEnd(k.node,k.offset)}else y.setEnd(p.node,p.offset);if(b.addRange(y),e.singleline){const k=y.getBoundingClientRect(),A=o.getBoundingClientRect();k.left<A.left?o.scrollLeft+=k.left-A.left:k.right>A.right&&(o.scrollLeft+=k.right-A.right)}}function g(f){switch(f.preventDefault(),f.inputType){case"historyUndo":for(;;){const d=s.past.pop();if(!d)return;if(d.kind==="caret")continue;const{data:b="",range:{start:y},selection:p,undo:k}=d;r(v=>`${v.slice(0,y)}${k}${v.slice(y+b.length)}`),u(p.start,p.end),e.onTextContent?.(i());const A=s.past.peek();if(!A||!t.historyStrategy(d,A))return}case"historyRedo":for(;;){const d=s.future.pop();if(!d)return;if(a(d),d.kind==="caret")continue;const{range:{start:b},data:y=""}=d;u(b+y.length);const p=s.future.peek();if(!p||!t.historyStrategy(d,p))return}default:{const d=Tt(f,i(),t.singleline);if(d){s.future.clear(),a(d);const{data:b="",range:{start:y}}=d;u(y+b.length)}break}}}function x(f){if(t.keyBindings){const d=wt(f);if(d in h()){const b=h()[d]({textContent:i(),range:F(f.currentTarget),event:f});if(b){f.preventDefault(),s.future.clear(),a(b);const{data:y="",range:{start:p}}=b;u(p+(y.length??0));return}}}if(f.key.startsWith("Arrow")||f.key==="Home"||f.key==="End"){if(s.past.peek()?.kind!=="caret"){const d=F(o);s.past.push({kind:"caret",range:d,selection:d,undo:""})}return}if(bt){if(f.metaKey)switch(f.key){case"z":me(f);break;case"Z":be(f);break}}else if(f.ctrlKey)switch(f.key){case"z":me(f);break;case"y":case"Z":be(f);break}}function T(){if(s.past.peek()?.kind==="caret")return;const f=F(o),d=new AbortController;window.addEventListener("pointerup",()=>{d.abort();const b=F(o);f.start===b.start&&f.end===b.end||s.past.push({kind:"caret",range:b,selection:b,undo:""})},{signal:d.signal})}return De(()=>{c.toArray().map(f=>f instanceof Element?f.textContent:f).join("")!==l()&&console.warn(`⚠️ WARNING ⚠️
- props.textContent and the textContent of props.children(textContent) are not equal!
- This breaks core-assumptions of <ContentEditable/> and will cause undefined behaviors!
- see www.github.com/bigmistqke/solid-contenteditable/#limitations-with-render-prop`)}),(()=>{var f=pt();f.$$pointerdown=T,f.$$keydown=x,f.$$input=g,f.$$beforeinput=g;var d=o;return typeof d=="function"?Pe(d,f):o=f,fe(f,le({get"aria-multiline"(){return!t.singleline},get contenteditable(){return t.editable},get style(){return{"scrollbar-width":e.singleline?"none":void 0,"overflow-x":e.singleline?"auto":void 0,"white-space":e.singleline?"pre":"break-spaces",...t.style}}},n),!1,!0),$(f,c),f})()}Ne(["beforeinput","input","keydown","pointerdown"]);var Lt=D("<span role=button tabindex=0>"),Ot=D("<a target=__blank>"),Nt=D("<span>"),Pt=D("<h1>solid-contenteditable"),Bt=D('<div class=list><h3>solid-contenteditable</h3><h3>solid-contenteditable: <i>singleline</i></h3><h3>solid-contenteditable: <i>custom key-binding (Ctrl+Shift+S for 😊)</i></h3><h3>solid-contenteditable: <i>custom history-strategy</i></h3><h3>solid-contenteditable: <i>render-prop (simple markdown-editor)</i></h3><h3>solid-contenteditable: <i>render-prop (highlight-editor)</i></h3><h3>solid-contenteditable: <i>render-prop (highlight-editor) and singleline</i></h3><h3>default browser: <i>contenteditable</i></h3><div contenteditable class=contentEditable>     <button>#hallo</button>    <button>#test</button></div><h3>default browser: <i>textarea</i></h3><textarea>     #hallo    #test</textarea><h3>default browser: <i>input</i></h3><input value="     #hallo    #test">');function Q(e){return m(qe,{get each(){return e.value.split(e.delimiter)},children:(t,n)=>{const i=()=>n()===e.value.split(e.delimiter).length-1;return[E(()=>e.children(t,n)),m(Oe,{get when(){return!i()},get children(){return e.delimiter}})]}})}function jt(e){return(()=>{var t=Lt();return fe(t,le(e,{get style(){return{border:"1px solid grey","border-radius":"3px",display:"inline-block",padding:"7px",background:"white",color:"black",...e.style}}}),!1,!1),t})()}function _t(){function e(t){return m(Q,{get value(){return t.value},delimiter:" ",children:n=>{const[,i,r]=n.match(/\[([^\]]+)\]\(([^)]+)\)/)||[];return i&&r?["[",i,"](",(()=>{var s=Ot();return Z(s,"href",r),$(s,r),s})(),")"]:n}})}return m(M,{textContent:`#Title
##SubTitle`,class:"contentEditable",render:t=>m(Q,{get value(){return t()},delimiter:`
`,children:n=>{if(n.startsWith("#")){const[,i,r]=n.match(/^(\#{1,6})(.*)$/);return m(yt,{get component(){return`h${i.length}`},style:{display:"inline"},get children(){return[(()=>{var s=Nt();return s.style.setProperty("opacity","0.3"),$(s,i),s})(),m(e,{value:r})]}})}return m(e,{value:n})}})})}function Mt(){return m(M,{textContent:"     #hallo    #test",class:"contentEditable",keyBindings:{"Ctrl+Shift+S":({textContent:e,range:t})=>({kind:"insertText",data:"😊",range:t,undo:e.slice(t.start,t.end)})}})}function we(e){return m(M,{textContent:"     #hallo    #test",class:"contentEditable",get singleline(){return e.singleline},render:t=>m(Q,{get value(){return t()},delimiter:`
`,children:n=>m(Q,{value:n,delimiter:" ",children:i=>m(Oe,{get when(){return i.startsWith("#")},fallback:i,get children(){return m(jt,{onClick:()=>console.log("clicked hashtag"),children:i})}})})})})}function Dt(){return[Pt(),(()=>{var e=Bt(),t=e.firstChild,n=t.nextSibling,i=n.nextSibling,r=i.nextSibling,s=r.nextSibling,o=s.nextSibling,l=o.nextSibling,c=l.nextSibling,h=c.nextSibling;return $(e,m(M,{textContent:"     #hallo    #test",class:"contentEditable"}),n),$(e,m(M,{singleline:!0,textContent:"     #hallo    #test",class:"contentEditable"}),i),$(e,m(Mt,{}),r),$(e,m(M,{textContent:"     #hallo    #test",class:"contentEditable",historyStrategy:(a,u)=>(a.kind==="insertText"||a.kind==="insertParagraph")&&(u.kind==="insertText"||u.kind==="insertParagraph")}),s),$(e,m(_t,{}),o),$(e,m(we,{}),l),$(e,m(we,{singleline:!0}),c),h.style.setProperty("white-space","pre-wrap"),e})()]}rt(()=>m(Dt,{}),document.getElementById("root"));
