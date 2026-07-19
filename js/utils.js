
window.HighfieldUtils = {
  escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  },

  safeValue(value){
    const text = String(value ?? "").trim();
    return text ? this.escapeHtml(text) : "—";
  },

  statusClass(status){
    const value = String(status ?? "").trim().toLowerCase();
    if(value === "valid") return "valid";
    if(value === "expired") return "expired";
    if(value === "revoked") return "revoked";
    return "invalid";
  },

  directUrl(certificateNumber){
    return location.origin + location.pathname + "?certificate=" + encodeURIComponent(certificateNumber);
  },

  async copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch{
      window.prompt("Copy this link:", text);
      return false;
    }
  },

  async share(data){
    if(navigator.share){
      await navigator.share(data);
      return true;
    }
    await this.copyText(data.url);
    return false;
  }
};
