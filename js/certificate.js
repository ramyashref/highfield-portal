
window.HighfieldCertificate = (() => {
  const U = window.HighfieldUtils;
  const C = window.HIGHFIELD_CONFIG;

  function fitClass(value, baseClass){
    const len = String(value ?? "").trim().length;
    if(baseClass === "cert-name" && len > 34) return baseClass + " long-text";
    if(baseClass === "cert-program" && len > 36) return baseClass + " long-text";
    return baseClass;
  }

  function render(certificate, id="certificateVisual"){
    const expiry = certificate["Expiry Date"] || certificate["Expirty Date"] || "";
    const serial = certificate["Certificate No"] || "";

    return `
      <div class="certificate-shell" id="${id}">
        <img src="${C.certificateTemplate}" alt="Highfield Egypt certificate template">

        <div class="dynamic-cover cover-name"></div>
        <div class="dynamic-cover cover-license"></div>
        <div class="dynamic-cover cover-program"></div>
        <div class="dynamic-cover cover-dates"></div>
        <div class="dynamic-cover cover-accreditation"></div>
        <div class="dynamic-cover cover-cpd"></div>
        <div class="dynamic-cover cover-serial"></div>

        <div class="certificate-text ${fitClass(certificate["Full Name"],"cert-name")}">${U.safeValue(certificate["Full Name"])}</div>
        <div class="certificate-text cert-license">License No: ${U.safeValue(certificate["License Number"])}</div>
        <div class="certificate-text ${fitClass(certificate["Program Name"],"cert-program")}">${U.safeValue(certificate["Program Name"])}</div>
        <div class="certificate-text cert-dates">From ${U.safeValue(certificate["Issue Date"])} to ${U.safeValue(expiry)}</div>
        <div class="certificate-text cert-accreditation">Accreditation Code: ${U.safeValue(certificate["Accreditation Code"])}</div>
        <div class="certificate-text cert-cpd">CPD Points: ${U.safeValue(certificate["CPD Points"])}</div>
        <div class="certificate-text cert-serial">Certificate Serial No. ${U.safeValue(serial)}</div>
      </div>
    `;
  }

  return {render};
})();
