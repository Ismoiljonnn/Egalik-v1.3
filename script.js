/**
 * GLOBAL SOZLAMALAR
 */
const API_BASE = "https://egalik-api-v01.onrender.com/";

// DOM Elementlarni oldindan tanlab olamiz
const loader = document.getElementById("global-loader");
const adsGridHome = document.querySelector("#home .ads-grid");
const adsGridProfile = document.querySelector("#profile .ads-grid");
const registerBtn = document.getElementById("registerBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const addForm = document.getElementById("addForm");
const navLinks = document.querySelectorAll(".sidebar nav a");

/**
 * 1. AUTENTIFIKATSIYA FUNKSIYALARI
 */

// Tokenni olish
function getToken() {
    return localStorage.getItem("accessToken");
}

// Tizimdan chiqish (Logout)
function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    window.location.href = "login.html";
}

// Auth holatini tekshirish (UI uchun)
function checkAuth() {
    const token = getToken();
    const userNameDisplay = document.getElementById("userName");

    if (token) {
        console.log("Foydalanuvchi tizimda ✅");
        if (userNameDisplay) {
            userNameDisplay.innerText = localStorage.getItem("username") || "Foydalanuvchi";
        }
        // Agar register tugmasi bo'lsa, uni yashirish yoki "Chiqish" ga aylantirish mumkin
        if (registerBtn) {
            registerBtn.innerText = "Chiqish";
            registerBtn.onclick = (e) => {
                e.preventDefault();
                if(confirm("Tizimdan chiqmoqchimisiz?")) logout();
            };
        }
    } else {
        console.log("Mehmon rejimi 👤");
    }
}

/**
 * 2. DATA YUKLASH (FETCH) FUNKSIYALARI
 */

// Barcha e'lonlarni yuklash (Public - Token shart emas)
async function loadProducts(query = "", category = "") {
    try {
        // URL qurish
        let url = API_BASE;
        const params = new URLSearchParams();
        if (query) params.append("search", query);
        if (category) params.append("kategoriya", category);
        
        if (params.toString()) url += `?${params.toString()}`;

        // Loading holati
        if (adsGridHome) adsGridHome.innerHTML = '<div class="loader-spinner">Yuklanmoqda...</div>';

        const res = await fetch(url);
        if (!res.ok) throw new Error("Tarmoq xatosi");

        const data = await res.json();

        if (adsGridHome) {
            if (!data || data.length === 0) {
                adsGridHome.innerHTML = "<p style='text-align:center; width:100%'>E'lonlar topilmadi.</p>";
            } else {
                adsGridHome.innerHTML = data.map(item => createAdCard(item, false)).join("");
            }
        }
    } catch (err) {
        console.error("Load Error:", err);
        if (adsGridHome) adsGridHome.innerHTML = "<p>Server bilan bog‘lanishda xato.</p>";
    }
}

// Mening e'lonlarimni yuklash (Private - Token KERAK)
async function loadMyAds() {
    const token = getToken();
    if (!token) return; // Token yo'q bo'lsa so'rov yubormaymiz

    if (adsGridProfile) adsGridProfile.innerHTML = '<div class="loader-spinner">Yuklanmoqda...</div>';

    try {
        const res = await fetch(API_BASE + "mening_elonlarim/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // <-- MUHIM: Token qo'shildi
                "Content-Type": "application/json"
            }
        });

        // 401 - Token eskirgan yoki noto'g'ri
        if (res.status === 401) {
            alert("Sessiya vaqti tugadi. Iltimos, qaytadan kiring.");
            logout();
            return;
        }

        if (!res.ok) throw new Error("Xatolik yuz berdi");

        const data = await res.json();

        if (adsGridProfile) {
            if (!data || data.length === 0) {
                adsGridProfile.innerHTML = "<p>Sizda hali e'lonlar yo'q.</p>";
            } else {
                // true parametri - bu mening e'lonim (o'chirish tugmasi chiqadi)
                adsGridProfile.innerHTML = data.map(item => createAdCard(item, true)).join("");
            }
        }
    } catch (err) {
        console.error("My Ads Error:", err);
        if (adsGridProfile) adsGridProfile.innerHTML = "<p>Ma'lumotlarni yuklashda xato.</p>";
    }
}

/**
 * 3. KARTA YARATISH (UI)
 */
function createAdCard(item, isMyAd = false) {
    const btnClass = item.holat === "sotiladi" ? "green" : "blue";

    // Rasmni to'g'rilash (Backend ba'zan to'liq URL, ba'zan /media/ beradi)
    let imgSrc = "images/noimage.jpg";
    if (item.rasm) {
        if (item.rasm.startsWith("http")) {
            imgSrc = item.rasm;
        } else {
            // Agar slash bilan boshlansa, API_BASE oxiridagi slashni olib tashlash kerak bo'lishi mumkin
            // Lekin onrenderda odatda to'g'ri keladi.
            // Xavfsizlik uchun oddiy bog'lash:
            imgSrc = item.rasm; 
        }
    }

    // Telegram username tozalash
    const tgUser = item.telegram ? item.telegram.replace('@', '').replace('https://t.me/', '') : '';
    const tgLink = tgUser ? `https://t.me/${tgUser}` : '#';

    // Narxni formatlash
    const formattedPrice = item.narx ? Number(item.narx).toLocaleString() : "Kelishilgan";

    return `
    <article class="ad-card" data-id="${item.id}">
      <div class="card-img-container">
          <img src="${imgSrc}" alt="${item.title}" onerror="this.src='images/noimage.jpg'">
      </div>
      <div class="card-body">
          <h3>${item.title}</h3>
          <p class="desc">Tavsilot: ${item.tavsilot}</p>
          <p class="price">Narxi: <strong>${formattedPrice} so'm</strong></p>
          <p class="phone"><i class='bx bx-phone'></i> ${item.number}</p>
          
          ${tgUser ? `<a href="${tgLink}" target="_blank" class="tg-link"><i class='bx bxl-telegram'></i> Telegram</a>` : ''}

          <div class="ad-actions">
            <span class="badge ${btnClass}">${item.holat}</span>
          </div>

          ${isMyAd ? `<button class="delete-btn" data-id="${item.id}">O‘chirish</button>` : ""}
      </div>
    </article>
    `;
}

/**
 * 4. HODISALAR (EVENTS)
 */

// Sahifa yuklanganda
window.addEventListener("load", async () => {
    // Loader logikasi
    const loaderText = loader.querySelector("p");
    const slowTextTimer = setTimeout(() => {
        if(loaderText) loaderText.innerText = "Sahifa yuklanmoqda...";
    }, 15000);

    try {
        // Backend sog'lomligini tekshirish (Helathz check)
        await fetch(API_BASE + "healthz").catch(() => {});
    } finally {
        clearTimeout(slowTextTimer);
        setTimeout(() => {
            loader.classList.add("hide");
        }, 1200);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadProducts(); // Bosh sahifa yuklanadi
});

// Register tugmasi
if (registerBtn && registerBtn.innerText !== "Chiqish") {
    registerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "register.html";
    });
}

// Navbar boshqaruvi
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        const page = link.dataset.page;

        // Profilga kirish uchun token kerak
        if (page === "profile" && !getToken()) {
            if(confirm("Bu bo‘limga kirish uchun tizimga kirishingiz kerak. Kirish sahifasiga o‘tamizmi?")) {
                window.location.href = "login.html";
            }
            return;
        }

        // Active classni almashtirish
        navLinks.forEach(a => a.classList.remove("active"));
        link.classList.add("active");

        // Sahifalarni almashtirish
        document.querySelectorAll(".page").forEach(p => p.style.display = "none");
        const targetPage = document.getElementById(page);
        if(targetPage) targetPage.style.display = "block";

        // Agar profil bo'lsa, yuklaymiz
        if (page === "profile") loadMyAds();
    });
});

// Qidiruv (Search)
if (searchBtn && searchInput) {
    const handleSearch = () => {
        const query = searchInput.value.trim();
        loadProducts(query, "");
        
        // Home sahifasini ochish
        document.querySelectorAll(".page").forEach(p => p.style.display = "none");
        document.getElementById("home").style.display = "block";
    };

    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });
}

// Kategoriyalar
document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
        const category = card.dataset.category;
        loadProducts("", category);

        // Home sahifasini ochish
        document.querySelectorAll(".page").forEach(p => p.style.display = "none");
        document.getElementById("home").style.display = "block";
    });
});

/**
 * 5. CRUD OPERATSIYALARI (Create, Delete)
 */

// E'lon o'chirish (DELETE)
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
        const token = getToken();

        if (!token) {
            alert("Xatolik: Tizimga kirmagansiz!");
            return;
        }

        if (confirm("Rostdan ham bu e’lonni o‘chirmoqchimisiz?")) {
            // Buttonni o'chirib turamiz
            e.target.disabled = true;
            e.target.innerText = "...";

            try {
                const res = await fetch(`${API_BASE}CRUD/${id}/`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`, // <-- Token
                        "Content-Type": "application/json"
                    }
                });

                if (res.status === 401) {
                    logout();
                    return;
                }

                if (res.ok) {
                    alert("E’lon o‘chirildi");
                    // Qaysi sahifada bo'lsa o'shani yangilaymiz
                    const profilePage = document.getElementById("profile");
                    if (profilePage && profilePage.style.display !== "none") {
                        loadMyAds();
                    } else {
                        loadProducts();
                    }
                } else {
                    const err = await res.json();
                    alert("Xato: " + JSON.stringify(err));
                    e.target.disabled = false;
                    e.target.innerText = "O‘chirish";
                }
            } catch (err) {
                console.error(err);
                alert("Server bilan bog‘lanishda xato");
                e.target.disabled = false;
                e.target.innerText = "O‘chirish";
            }
        }
    }
});

// E'lon qo'shish (CREATE - POST)
if (addForm) {
    // Xabar chiqarish joyi
    let msgDiv = document.createElement("div");
    msgDiv.style.marginTop = "10px";
    msgDiv.style.fontWeight = "bold";
    addForm.appendChild(msgDiv);

    let canSubmit = true; 
    
    // Formni klonlash shart emas, chunki bu kod faqat bir marta yuklanadi.
    // Lekin duplicate listenerlarni oldini olish uchun tekshiramiz.
    
    const submitBtn = addForm.querySelector("button[type='submit']");

    addForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            alert("E'lon qo'shish uchun avval tizimga kiring!");
            window.location.href = "login.html";
            return;
        }

        if (!canSubmit) {
            msgDiv.innerText = "Iltimos, biroz kuting...";
            msgDiv.style.color = "orange";
            return;
        }

        const formData = new FormData(addForm);

        try {
            canSubmit = false;
            submitBtn.disabled = true;
            msgDiv.innerText = "E’lon joylanmoqda... (Rasm yuklash biroz vaqt oladi)";
            msgDiv.style.color = "blue";

            const res = await fetch(`${API_BASE}add/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}` 
                    // Content-Type ni YOZMANG! FormData o'zi hal qiladi.
                },
                body: formData
            });

            if (res.status === 401) {
                alert("Sessiya vaqti tugadi. Qaytadan kiring.");
                logout();
                return;
            }

            if (res.ok) {
                msgDiv.innerText = "Muvaffaqiyatli qo‘shildi!";
                msgDiv.style.color = "green";
                addForm.reset();
                
                // Yangilash
                loadProducts();
                loadMyAds();

                // 30 sekundlik timer
                let seconds = 30;
                const timer = setInterval(() => {
                    submitBtn.innerText = `Kutish: ${seconds}s`;
                    seconds--;
                    if (seconds < 0) {
                        clearInterval(timer);
                        submitBtn.innerText = "E'lonni joylash";
                        submitBtn.disabled = false;
                        canSubmit = true;
                        msgDiv.innerText = "";
                    }
                }, 1000);

            } else {
                const errData = await res.json().catch(() => ({ detail: "Noma'lum xato" }));
                msgDiv.innerText = "Xato: " + JSON.stringify(errData);
                msgDiv.style.color = "red";
                console.error("Add error:", errData);
                
                canSubmit = true;
                submitBtn.disabled = false;
                submitBtn.innerText = "E'lonni joylash";
            }

        } catch (err) {
            console.error(err);
            msgDiv.innerText = "Serverga ulanishda xato";
            msgDiv.style.color = "red";
            canSubmit = true;
            submitBtn.disabled = false;
            submitBtn.innerText = "E'lonni joylash";
        }
    });
}
