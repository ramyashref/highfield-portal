
(() => {
  const C = window.HIGHFIELD_CONFIG;
  const U = window.HighfieldUtils;

  const form = document.getElementById("verificationForm");
  const input = document.getElementById("certificateInput");
  const verifyButton = document.getElementById("verifyButton");
  const resultArea = document.getElementById("resultArea");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const previewModal = document.getElementById("previewModal");
  const modalCanvas = document.getElementById("modalCanvas");
  const closeModalButton = document.getElementById("closeModalButton");
  const zoomInButton = document.getElementById("zoomInButton");
  const zoomOutButton = document.getElementById("zoomOutButton");
  const resetZoomButton = document.getElementById("resetZoomButton");
  const toast = document.getElementById("toast");

  let currentCertificate = null;
  let currentQueryNumber = "";
  let currentZoom = 1;
  let toastTimer = null;

  form.addEventListener("submit", event => {
    event.preventDefault();
    verifyCertificate();
  });

  window.addEventListener("DOMContentLoaded", () => {
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }

    const certificateNumber = new URLSearchParams(location.search).get("certificate");
    if(certificateNumber){
      input.value = certificateNumber.trim();
      verifyCertificate();
    }
  });

  closeModalButton.addEventListener("click", closePreview);
  previewModal.addEventListener("click", event => {
    if(event.target === previewModal) closePreview();
  });
  zoomInButton.addEventListener("click", () => setZoom(currentZoom + .15));
  zoomOutButton.addEventListener("click", () => setZoom(currentZoom - .15));
  resetZoomButton.addEventListener("click", () => setZoom(1));

  function showToast(message,type="success"){
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    toastTimer = setTimeout(() => {
      toast.className = "toast";
    },2200);
  }

  function setLoading(active){
    verifyButton.disabled = active;
    loadingOverlay.classList.toggle("show",active);
    loadingOverlay.setAttribute("aria-hidden",String(!active));
  }

  function detail(icon,label,value){
    return `
      <div class="detail-item">
        <span class="detail-dot">${icon}</span>
        <div><small>${U.escapeHtml(label)}</small><strong>${U.safeValue(value)}</strong></div>
      </div>
    `;
  }

  function normalizedCertificate(certificate){
    return {
      ...certificate,
      expiry: certificate["Expiry Date"] || certificate["Expirty Date"] || "",
      serial: certificate["Certificate No"] || currentQueryNumber || "",
      status: certificate["Status"] || "Unknown"
    };
  }

  function renderSuccess(rawCertificate,queryNumber){
    const certificate = normalizedCertificate(rawCertificate);
    currentCertificate = rawCertificate;
    currentQueryNumber = queryNumber;

    const url = U.directUrl(queryNumber);
    const verifiedAt = new Intl.DateTimeFormat("en-GB",{
      dateStyle:"medium",
      timeStyle:"short"
    }).format(new Date());

    resultArea.innerHTML = `
      <div class="result-grid">
        <section class="verification-column">
          <div class="success-banner">
            <div class="success-left">
              <div class="success-icon">
                <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"></path></svg>
              </div>
              <div>
                <h2>Certificate Verified Successfully</h2>
                <p>This record was retrieved from the official Highfield Egypt database.</p>
                <div class="certificate-holder-line">${U.safeValue(certificate["Full Name"])}</div>
                <div class="success-meta">
                  <span class="verified-time">◷ Verified ${U.escapeHtml(verifiedAt)}</span>
                  <span>•</span>
                  <span>Certificate No. ${U.safeValue(certificate.serial)}</span>
                </div>
              </div>
            </div>
            <span class="status-pill ${U.statusClass(certificate.status)}">${U.safeValue(certificate.status)}</span>
          </div>

          <div class="certificate-panel" id="certificatePreviewTrigger" title="Tap to open full-screen preview">
            ${HighfieldCertificate.render(rawCertificate)}
          </div>

          <div class="action-bar">
            <button class="action-button" id="downloadPdfButton" type="button">
              <span class="button-icon">⇩</span> Download PDF
            </button>
            <button class="action-button" id="printButton" type="button">
              <span class="button-icon">▣</span> Print Certificate
            </button>
            <button class="action-button" id="shareButton" type="button">
              <span class="button-icon">⌁</span> Share Certificate
            </button>
          </div>
        </section>

        <aside class="side-column">
          <section class="side-card highlight-card">
            <h3>Certificate Details</h3>
            <div class="detail-list">
              ${detail("№","Certificate Number",certificate.serial)}
              ${detail("◇","Accreditation Code",certificate["Accreditation Code"])}
              ${detail("▣","Program",certificate["Program Name"])}
              ${detail("◷","Issue Date",certificate["Issue Date"])}
              ${detail("⌛","Expiry Date",certificate.expiry)}
              ${detail("✦","Training Hours",certificate["Training Hours"])}
              ${detail("●","CPD Points",certificate["CPD Points"])}
            </div>

            <div class="detail-section-title">Provider and Academic Information</div>
            <div class="detail-list">
              ${detail("H","Provider",certificate["Provider"])}
              ${detail("I","Instructor",certificate["Instructor Name"])}
              ${detail("A","Accredited By",certificate["Accredited By"] || "Egyptian Health Council")}
              ${detail("⌖","Country",certificate["Country"])}
              ${detail("✓","Status",certificate.status)}
            </div>

            <div class="database-seal">
              <span>✓</span>
              <div>This verification reflects the record currently stored in the official Highfield Egypt database.</div>
            </div>
          </section>

          <section class="side-card">
            <h3>Verify this Certificate</h3>
            <div class="qr-frame">
              <div class="qr-wrap">
                <div id="qrCode"></div>
                <div class="qr-center-mark">HF</div>
              </div>
            </div>
            <p class="qr-caption">Scan the QR code to open the official verification record.</p>
            <div class="qr-security-line">✓ Secure verification link</div>

            <div class="side-actions">
              <button id="copyLinkButton" type="button">Copy Link</button>
              <button id="sideShareButton" type="button">Share</button>
            </div>

            <button class="verify-another" id="verifyAnotherButton" type="button">Verify Another Certificate</button>
          </section>
        </aside>
      </div>
    `;

    HighfieldQR.create(document.getElementById("qrCode"),url);

    document.getElementById("certificatePreviewTrigger").addEventListener("click",openPreview);
    document.getElementById("downloadPdfButton").addEventListener("click",async () => {
      showToast("Preparing your PDF...");
      await HighfieldPDF.download(rawCertificate);
    });
    document.getElementById("printButton").addEventListener("click",() => window.print());

    const shareData = {
      title:"Highfield Egypt Certificate",
      text:`Verify certificate ${certificate.serial}`,
      url
    };

    document.getElementById("shareButton").addEventListener("click",async () => {
      await U.share(shareData);
      showToast("Verification link is ready to share.");
    });

    document.getElementById("sideShareButton").addEventListener("click",async () => {
      await U.share(shareData);
      showToast("Verification link is ready to share.");
    });

    document.getElementById("copyLinkButton").addEventListener("click",async event => {
      await U.copyText(url);
      event.currentTarget.textContent = "Copied";
      showToast("Verification link copied.");
      setTimeout(() => event.currentTarget.textContent = "Copy Link",1400);
    });

    document.getElementById("verifyAnotherButton").addEventListener("click",resetSearch);

    history.replaceState({}, "", location.pathname + "?certificate=" + encodeURIComponent(queryNumber));
    setTimeout(() => resultArea.scrollIntoView({behavior:"smooth",block:"start"}),120);
  }

  function renderNotFound(queryNumber){
    currentCertificate = null;
    currentQueryNumber = queryNumber;

    const message = encodeURIComponent(
      `Hello Highfield Egypt, I searched for certificate number ${queryNumber}, but it was not found. I would like to ask about the certificate or apply for an upcoming program.`
    );

    resultArea.innerHTML = `
      <section class="not-found-card">
        <div class="not-found-left">
          <div class="not-found-icon">×</div>
          <h2>Certificate Not Found</h2>
          <p>We could not locate a certificate matching <strong>${U.escapeHtml(queryNumber)}</strong>.</p>

          <div class="not-found-actions">
            <a class="whatsapp-button" href="https://wa.me/${C.whatsappNumber}?text=${message}" target="_blank" rel="noopener">
              Contact us on WhatsApp<br>${C.whatsappDisplay}
            </a>
            <a class="programs-button" href="${C.programsUrl}" target="_blank" rel="noopener">Explore Our Programs</a>
            <button class="search-again-button" id="searchAgainButton" type="button">Search Again</button>
          </div>
        </div>

        <div class="not-found-right">
          <div>
            <h3>It may simply be too early.</h3>
            <p>The certificate may not have been issued yet, or the number entered may be incorrect.</p>
            <div class="early-message">
              If you recently completed the program, contact our team so we can assist you.
              If you have not joined yet, you can ask about the next available intake and apply for the program.
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById("searchAgainButton").addEventListener("click",resetSearch);
    setTimeout(() => resultArea.scrollIntoView({behavior:"smooth",block:"center"}),120);
  }

  function renderServiceError(){
    resultArea.innerHTML = `
      <section class="not-found-card">
        <div class="not-found-left">
          <div class="not-found-icon">!</div>
          <h2>Verification Unavailable</h2>
          <p>The verification service is temporarily unavailable.</p>
        </div>
        <div class="not-found-right">
          <div>
            <h3>Please try again shortly.</h3>
            <p>We could not connect to the official database at this moment.</p>
          </div>
        </div>
      </section>
    `;
    showToast("Could not connect to the database.","error");
  }

  function resetSearch(){
    resultArea.innerHTML = "";
    input.value = "";
    history.replaceState({},"",location.pathname);
    window.scrollTo({top:0,behavior:"smooth"});
    setTimeout(() => input.focus(),500);
  }

  async function verifyCertificate(){
    const queryNumber = input.value.trim();

    if(!queryNumber){
      input.focus();
      input.setAttribute("aria-invalid","true");
      showToast("Enter a certificate number first.","error");
      return;
    }

    input.removeAttribute("aria-invalid");
    resultArea.innerHTML = "";
    setLoading(true);

    try{
      const response = await fetch(C.apiUrl + "?certificate=" + encodeURIComponent(queryNumber),{
        method:"GET",
        cache:"no-store"
      });

      if(!response.ok) throw new Error("API request failed");
      const payload = await response.json();

      if(payload.success && payload.certificate){
        renderSuccess(payload.certificate,queryNumber);
      }else{
        renderNotFound(queryNumber);
      }
    }catch(error){
      console.error(error);
      renderServiceError();
    }finally{
      setLoading(false);
    }
  }

  function openPreview(){
    if(!currentCertificate) return;
    modalCanvas.innerHTML = HighfieldCertificate.render(currentCertificate,"modalCertificate");
    currentZoom = 1;
    applyZoom();
    previewModal.classList.add("show");
    previewModal.setAttribute("aria-hidden","false");
  }

  function closePreview(){
    previewModal.classList.remove("show");
    previewModal.setAttribute("aria-hidden","true");
  }

  function setZoom(value){
    currentZoom = Math.min(2.2,Math.max(.6,value));
    applyZoom();
  }

  function applyZoom(){
    const certificate = document.getElementById("modalCertificate");
    if(!certificate) return;
    certificate.style.transform = `scale(${currentZoom})`;
    resetZoomButton.textContent = `${Math.round(currentZoom*100)}%`;
  }
})();
