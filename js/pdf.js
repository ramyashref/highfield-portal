
window.HighfieldPDF = {
  async download(certificate){
    const target = document.getElementById("pdfRenderTarget");
    target.innerHTML = HighfieldCertificate.render(certificate,"pdfCertificate");

    const node = document.getElementById("pdfCertificate");
    const image = node.querySelector("img");

    await new Promise(resolve => {
      if(image.complete) resolve();
      else{
        image.onload = resolve;
        image.onerror = resolve;
      }
    });

    const filename = `${certificate["Certificate No"] || "Highfield-Certificate"}.pdf`;

    await html2pdf().set({
      margin:0,
      filename,
      image:{type:"jpeg",quality:1},
      html2canvas:{
        scale:2,
        useCORS:true,
        backgroundColor:"#fbf4e5",
        width:2048,
        height:1448,
        windowWidth:2048,
        windowHeight:1448,
        scrollX:0,
        scrollY:0
      },
      jsPDF:{
        unit:"mm",
        format:"a4",
        orientation:"landscape",
        compress:true
      },
      pagebreak:{mode:["avoid-all"]}
    }).from(node).save();
  }
};
