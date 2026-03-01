const REGIONS = ["01","10","20","25","30","40","50","60","70","75","80","85","90","95"];
const TXT_FILE = "./nomer.txt";

const $ = (id) => document.getElementById(id);

const statusBadge = $("statusBadge");
const regionFilter = $("regionFilter");
const searchBox = $("searchBox");
const countPill = $("countPill");
const availableRegionsText = $("availableRegionsText");

const reloadBtn = $("reloadBtn");

const txtMirror = $("txtMirror");
const applyMirrorBtn = $("applyMirrorBtn");
const clearBtn = $("clearBtn");

const bigPlate = $("bigPlate");
const bigRegion = $("bigRegion");
const bigMain = $("bigMain");
const viewerMeta = $("viewerMeta");

const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const copyCurrentBtn = $("copyCurrentBtn");

const lastBox = $("lastBox");
const lastMain = $("lastMain");
const lastRegion = $("lastRegion");

const emptyState = $("emptyState");
const toast = $("toast");

let allItems = [];
let filteredItems = [];
let currentIndex = 0;

function showToast(msg="Copied ✅"){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 1100);
}

function setStatus(text){
  statusBadge.textContent = text;
}

function normalize(line){
  return (line || "").replace(/\s+/g,"").toUpperCase();
}

function parseLine(line){
  const s = normalize(line);
  if (!s) return null;
  if (s.length < 8) return null;

  const region = s.slice(0,2);
  const main = s.slice(2,8);

  if (!/^\d{2}$/.test(region)) return null;
  if (!/^[A-Z0-9]{6}$/.test(main)) return null;

  return { region, main, full: `${region} ${main}` };
}

function parseText(text){
  const lines = (text || "")
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines){
    const p = parseLine(line);
    if (p) out.push(p);
  }
  return out;
}

function buildRegionOptions(){
  for (const r of REGIONS){
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    regionFilter.appendChild(opt);
  }
}

function computeAvailableRegions(items){
  const set = new Set(items.map(x => x.region));
  const ordered = REGIONS.filter(r => set.has(r));
  return ordered;
}

function updateAvailableRegionsUI(){
  const avail = computeAvailableRegions(allItems);
  availableRegionsText.textContent = avail.length
    ? `Mavjud regionlar: ${avail.join(", ")}`
    : "Mavjud regionlar: —";
}

function applyFilter(){
  const rf = regionFilter.value;
  const q = (searchBox.value || "").trim().toUpperCase();

  filteredItems = allItems.filter(it => {
    if (rf !== "ALL" && it.region !== rf) return false;
    if (q && !it.main.includes(q)) return false;
    return true;
  });

  countPill.textContent = `${filteredItems.length} ta`;

  // keep index in range
  currentIndex = 0;
  renderCurrent();
}

function updateNavButtons(){
  const has = filteredItems.length > 0;
  prevBtn.disabled = !has || currentIndex <= 0;
  nextBtn.disabled = !has || currentIndex >= filteredItems.length - 1;
  copyCurrentBtn.disabled = !has;
}

function renderCurrent(){
  if (!filteredItems.length){
    bigRegion.textContent = "--";
    bigMain.textContent = "------";
    viewerMeta.textContent = "—";
    emptyState.style.display = "block";
    updateNavButtons();
    return;
  }

  emptyState.style.display = "none";

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= filteredItems.length) currentIndex = filteredItems.length - 1;

  const item = filteredItems[currentIndex];
  bigRegion.textContent = item.region;
  bigMain.textContent = item.main;
  viewerMeta.textContent = `#${currentIndex + 1} / ${filteredItems.length} • ${item.full}`;

  updateNavButtons();
}

async function copyMainOnly(item){
  // IMPORTANT: copy ONLY main
  await navigator.clipboard.writeText(item.main);

  lastMain.textContent = item.main;
  lastRegion.textContent = item.region;
  lastBox.style.display = "block";

  showToast("MAIN copied ✅ (region yo‘q)");
}

async function loadFromTxt(){
  setStatus("nomer.txt o‘qilyapti…");
  try{
    const res = await fetch(TXT_FILE, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    if (txtMirror) txtMirror.value = text;

    allItems = parseText(text);
    setStatus(`nomer.txt OK • ${allItems.length} ta`);

    updateAvailableRegionsUI();
    applyFilter();
  }catch(e){
    console.error(e);
    setStatus("nomer.txt o‘qilmadi ❌ (serverda oching)");

    if (txtMirror && (txtMirror.value || "").trim()){
      allItems = parseText(txtMirror.value);
      setStatus(`textarea ishladi • ${allItems.length} ta`);
      updateAvailableRegionsUI();
      applyFilter();
    }else{
      allItems = [];
      updateAvailableRegionsUI();
      applyFilter();
    }
  }
}

/* Events */
regionFilter.addEventListener("change", applyFilter);
searchBox.addEventListener("input", applyFilter);

reloadBtn.addEventListener("click", loadFromTxt);

if (applyMirrorBtn && txtMirror){
  applyMirrorBtn.addEventListener("click", ()=>{
    allItems = parseText(txtMirror.value);
    setStatus(`textarea apply • ${allItems.length} ta`);
    updateAvailableRegionsUI();
    applyFilter();
  });
}

if (clearBtn && txtMirror){
  clearBtn.addEventListener("click", ()=>{
    txtMirror.value = "";
    allItems = [];
    setStatus("tozalandi");
    updateAvailableRegionsUI();
    applyFilter();
    lastBox.style.display = "none";
  });
}

prevBtn.addEventListener("click", ()=>{
  if (currentIndex > 0){
    currentIndex--;
    renderCurrent();
  }
});

nextBtn.addEventListener("click", ()=>{
  if (currentIndex < filteredItems.length - 1){
    currentIndex++;
    renderCurrent();
  }
});

bigPlate.addEventListener("click", async ()=>{
  if (!filteredItems.length) return;
  await copyMainOnly(filteredItems[currentIndex]);
});

copyCurrentBtn.addEventListener("click", async ()=>{
  if (!filteredItems.length) return;
  await copyMainOnly(filteredItems[currentIndex]);
});

/* Init */
buildRegionOptions();
updateAvailableRegionsUI();
applyFilter();
loadFromTxt();
