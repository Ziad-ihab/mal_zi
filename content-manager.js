// =================================================
// Malak's World — Content Manager
// زرار الإضافة + الحفظ في Firestore + عرض المحتوى في كل صفحة
//
// كل صفحة عندها نوع خاص بيها (window.PAGE_TYPE)، وأي حاجة تتضاف من
// زرار الصفحة دي بتتحفظ بنفس النوع وتظهر في نفس الصفحة بس — مش في
// صفحة تانية.
//
// ملحوظة: مبنستخدمش Firebase Storage خالص (بقت محتاجة خطة مدفوعة
// Blaze حتى للاستخدام المجاني). بدل كده الصورة بتتحفظ كنص مُرمّز
// (base64) جوه Firestore مباشرة.
// =================================================

(function () {

  if (typeof firebase === "undefined" || !window.firebaseConfig || window.firebaseConfig.apiKey === "PASTE_API_KEY_HERE") {
    console.warn("Firebase مش متظبط لسه — افتحي firebase-config.js واحطي بياناتك فيه.");
    document.addEventListener("DOMContentLoaded", showSetupNotice);
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  const db = firebase.firestore();
  const COLLECTION = "malak_content";

  // كل صفحة بتحدد نوعها بنفسها قبل ما السكريبت ده يشتغل.
  // النوع ده هو نفسه اللي بيتحفظ في القاعدة وبيتفلتر بيه العرض،
  // فكل حاجة تتضاف من صفحة معينة تفضل في نفس الصفحة دي بس.
  const PAGE_TYPE = window.PAGE_TYPE || "general";

  // أنواع ليها شكل عرض خاص (جاليري / بلاي ليست / كروت مفاجآت)
  const SPECIAL_TYPES = ["memory", "song", "surprise"];

  // عناوين وحقول كل نوع
  const TYPE_LABELS = {
    memory: "ذكرى / صورة",
    song: "أغنية",
    surprise: "مفاجأة",
    ocean: "ذكرى بحر",
    loves: "حاجة تحبها",
    about: "حاجة عنها",
    foryou: "رسالة ليها",
    poetry: "قصيدة",
    index: "حاجة جديدة",
    general: "حاجة جديدة"
  };

  // ---------------------------------------------
  // Setup notice (شو لو firebase-config.js لسه مش متظبط)
  // ---------------------------------------------
  function showSetupNotice() {
    const btn = document.createElement("button");
    btn.className = "malak-add-btn malak-add-btn-disabled";
    btn.innerHTML = "+";
    btn.title = "لسه محتاجين نظبط Firebase";
    btn.addEventListener("click", () => {
      alert("لسه محتاجين نظبط Firebase الأول ✦\nافتحي ملف firebase-config.js واتبعي الخطوات المكتوبة فيه.");
    });
    document.body.appendChild(btn);
  }

  // ---------------------------------------------
  // Floating Add Button
  // ---------------------------------------------
  function createAddButton() {
    const btn = document.createElement("button");
    btn.id = "malakAddBtn";
    btn.className = "malak-add-btn";
    btn.innerHTML = "+";
    btn.title = "ضيفي " + (TYPE_LABELS[PAGE_TYPE] || "حاجة جديدة");
    document.body.appendChild(btn);
    btn.addEventListener("click", openModal);
  }

  // ---------------------------------------------
  // الحقول المناسبة لكل نوع
  // ---------------------------------------------
  function getFieldsHtml(type) {
    if (type === "song") {
      return `
        <div class="malak-field">
          <label>اسم الأغنية</label>
          <input type="text" name="title">
        </div>
        <div class="malak-field">
          <label>اسم المغني</label>
          <input type="text" name="artist">
        </div>
        <div class="malak-field">
          <label>لينك الأغنية (يوتيوب / ساوندكلاود / mp3)</label>
          <input type="url" name="url" placeholder="https://...">
        </div>
      `;
    }

    if (type === "surprise") {
      return `
        <div class="malak-field">
          <label>اكتب المفاجأة / الرسالة</label>
          <textarea name="surpriseText" rows="3"></textarea>
        </div>
      `;
    }

    // كل الأنواع التانية (memory + أي صفحة زي ocean, loves, about, foryou, poetry...)
    // بتستخدم نفس الشكل: نص + صورة اختيارية
    return `
      <div class="malak-field">
        <label>اكتبي كلمتين (اختياري لو في صورة)</label>
        <textarea name="text" rows="2"></textarea>
      </div>
      <div class="malak-field">
        <label>صورة (اختياري)</label>
        <input type="file" name="photo" accept="image/*">
      </div>
    `;
  }

  // ---------------------------------------------
  // Modal markup
  // ---------------------------------------------
  function injectModal() {
    const overlay = document.createElement("div");
    overlay.className = "malak-modal-overlay";
    overlay.id = "malakModalOverlay";

    const titleText = "ضيفي " + (TYPE_LABELS[PAGE_TYPE] || "حاجة جديدة") + " جديدة ✦";

    overlay.innerHTML = `
      <div class="malak-modal">
        <button type="button" class="malak-modal-close" id="malakModalClose">×</button>
        <h3>${titleText}</h3>

        <form id="malakForm">
          ${getFieldsHtml(PAGE_TYPE)}

          <button type="submit" class="malak-submit-btn">حفظ ✦</button>
          <p class="malak-status" id="malakStatus"></p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("malakModalClose").addEventListener("click", closeModal);
    document.getElementById("malakForm").addEventListener("submit", handleSubmit);
  }

  function openModal() {
    document.getElementById("malakModalOverlay").classList.add("open");
  }

  function closeModal() {
    document.getElementById("malakModalOverlay").classList.remove("open");
    document.getElementById("malakForm").reset();
    document.getElementById("malakStatus").textContent = "";
  }

  // ---------------------------------------------
  // Save
  // ---------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const statusEl = document.getElementById("malakStatus");
    const submitBtn = form.querySelector(".malak-submit-btn");

    submitBtn.disabled = true;
    statusEl.textContent = "بتتحفظ... ⏳";

    try {
      let entry = { type: PAGE_TYPE };
      let file = null;

      if (PAGE_TYPE === "song") {
        entry.title = form.title.value.trim();
        entry.artist = form.artist.value.trim();
        entry.url = form.url.value.trim();
      } else if (PAGE_TYPE === "surprise") {
        entry.text = form.surpriseText.value.trim();
      } else {
        entry.text = form.text.value.trim();
        file = form.photo.files[0] || null;
      }

      if (file) {
        statusEl.textContent = "بتضغط الصورة... ⏳";
        // مقاس صغير كفاية عشان تتحفظ كنص جوه Firestore (حد أقصى ~1 ميجا للمستند)
        entry.imageData = await imageToDataUrl(file, 1000, 0.65);
      }

      statusEl.textContent = "بتتحفظ في القاعدة... ⏳";
      entry.createdAt = firebase.firestore.FieldValue.serverTimestamp();

      await db.collection(COLLECTION).add(entry);

      statusEl.textContent = "اتحفظت ✦ لو انتي دلوقتي في نفس الصفحة، ريفرشي عشان تشوفيها.";
      form.reset();

      setTimeout(closeModal, 1400);
    } catch (err) {
      console.error(err);
      let msg = err && err.message ? err.message : String(err);
      if (/longer than.*1048487|exceeds the maximum|invalid-argument/i.test(msg)) {
        msg = "الصورة لسه كبيرة على قاعدة البيانات — جربي صورة تانية أصغر أو قصي فيها أكتر.";
      } else if (/permission-denied/i.test(msg)) {
        msg = "الصلاحيات (Security Rules) في Firebase لسه مقفولة — افتحي ملف FIREBASE_RULES وطبقيه.";
      }
      statusEl.textContent = "حصل خطأ: " + msg;
    } finally {
      submitBtn.disabled = false;
    }
  }

  // ---------------------------------------------
  // تصغير وضغط الصورة، وتحويلها لنص base64 جاهز يتحفظ في Firestore
  // ---------------------------------------------
  function imageToDataUrl(file, maxDim = 1000, quality = 0.65) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;

      img.onload = () => {
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------------------------------------------
  // Load & render content for the current page
  // ---------------------------------------------
  async function loadPageContent() {
    try {
      const snap = await db.collection(COLLECTION)
        .where("type", "==", PAGE_TYPE)
        .get();

      // بنرتب في المتصفح نفسه (الأحدث الأول) بدل ما نستخدم orderBy
      // في الطلب، عشان كده مش محتاجين composite index في فيربيز.
      const docs = snap.docs
        .map((doc) => doc.data())
        .sort((a, b) => {
          const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });

      docs.forEach((data) => renderItem(PAGE_TYPE, data));
    } catch (err) {
      console.error("مقدرناش نجيب المحتوى المحفوظ:", err);
      showLoadError(err);
    }
  }

  // ---------------------------------------------
  // بانر خطأ ظاهر على الصفحة نفسها (بدل الاعتماد على Console)
  // ---------------------------------------------
  function showLoadError(err) {
    const msg = err && err.message ? err.message : String(err);
    const banner = document.createElement("div");
    banner.className = "malak-error-banner";
    banner.innerHTML = `
      <strong>مقدرناش نجيب المحتوى المحفوظ 😕</strong>
      <span>${escapeHtml(msg)}</span>
      <button type="button" id="malakErrorClose">×</button>
    `;
    document.body.appendChild(banner);
    document.getElementById("malakErrorClose").addEventListener("click", () => banner.remove());
  }

  function renderItem(type, data) {
    const imgSrc = data.imageData || data.url || null;

    if (type === "memory") {
      const grid = document.querySelector(".gallery-grid");
      if (!grid) return;

      const div = document.createElement("div");
      div.className = "gallery-item";
      div.dataset.category = "favorites";

      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Memory";
        div.appendChild(img);
        if (data.text) {
          const cap = document.createElement("span");
          cap.className = "malak-memory-caption";
          cap.textContent = data.text;
          div.appendChild(cap);
        }
      } else if (data.text) {
        div.classList.add("malak-text-memory");
        div.innerHTML = `<p>${escapeHtml(data.text)}</p>`;
      } else {
        return;
      }

      grid.appendChild(div);
      return;
    }

    if (type === "song") {
      const list = document.querySelector(".playlist");
      if (!list) return;

      const div = document.createElement("div");
      div.className = "track";
      div.dataset.src = data.url || "";
      div.innerHTML = `
        <div class="track-play">▶</div>
        <div class="track-info">
          <h4>${escapeHtml(data.title || "Untitled")}</h4>
          <p>${escapeHtml(data.artist || "")}</p>
        </div>
        <div class="track-bars">
          <span></span><span></span><span></span><span></span>
        </div>
      `;

      div.addEventListener("click", () => {
        if (data.url) window.open(data.url, "_blank");
      });

      list.appendChild(div);
      return;
    }

    if (type === "surprise") {
      const section = document.querySelector(".surprise-section");
      if (!section) return;

      let list = document.getElementById("malakMoreSurprises");
      if (!list) {
        list = document.createElement("div");
        list.id = "malakMoreSurprises";
        list.className = "malak-more-surprises";
        section.appendChild(list);
      }

      const card = document.createElement("div");
      card.className = "malak-mini-surprise";
      card.innerHTML = `<span>☆</span><p>${escapeHtml(data.text || "")}</p>`;
      list.appendChild(card);
      return;
    }

    // ---------- كل صفحة تانية (ocean, loves, about, foryou, poetry, index...) ----------
    // بيتعرض في قسم "إضافات" بسيط بيتحط في آخر main، مش هيدخل جوه
    // التصميم المخصص للصفحة (عشان بعض الصفحات فيها كاروسيل معقد).
    const main = document.querySelector("main");
    if (!main) return;

    let list = document.getElementById("malakGenericAdditions");
    if (!list) {
      const wrapper = document.createElement("section");
      wrapper.className = "malak-generic-section reveal";

      const heading = document.createElement("div");
      heading.className = "section-title";
      heading.innerHTML = `
        <div class="title-line"></div>
        <span>✦</span>
        <h2>إضافات</h2>
        <span>✦</span>
        <div class="title-line"></div>
      `;
      wrapper.appendChild(heading);

      list = document.createElement("div");
      list.id = "malakGenericAdditions";
      list.className = "malak-generic-grid";
      wrapper.appendChild(list);

      main.appendChild(wrapper);
    }

    const card = document.createElement("div");
    card.className = "malak-generic-card";

    if (imgSrc) {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = "";
      card.appendChild(img);
    }
    if (data.text) {
      const p = document.createElement("p");
      p.textContent = data.text;
      card.appendChild(p);
    }
    if (!imgSrc && !data.text) return;

    list.appendChild(card);
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------------------------------------------
  // Init
  // ---------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    createAddButton();
    injectModal();
    loadPageContent();
  });

})();
