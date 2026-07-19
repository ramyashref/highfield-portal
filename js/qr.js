
window.HighfieldQR = {
  create(element, url){
    element.innerHTML = "";
    new QRCode(element,{
      text:url,
      width:188,
      height:188,
      colorDark:"#071a3f",
      colorLight:"#ffffff",
      correctLevel:QRCode.CorrectLevel.H
    });
  }
};
